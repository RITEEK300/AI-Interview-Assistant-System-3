import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8081/ws';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.connected = false;
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
  }

  connect() {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected = true;
        this.onConnectCallbacks.forEach((cb) => cb());
      },
      onDisconnect: () => {
        this.connected = false;
        this.onDisconnectCallbacks.forEach((cb) => cb());
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers?.message);
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client?.active) {
      this.client.deactivate();
      this.connected = false;
      this.subscriptions.clear();
    }
  }

  subscribeToAnswers(receiverId, callback) {
    if (!this.client?.active) {
      console.warn('[WS] Not connected, queuing subscription');
      const connectHandler = () => this._subscribe(receiverId, callback);
      this.onConnectCallbacks.push(connectHandler);
      return () => {
        this.onConnectCallbacks = this.onConnectCallbacks.filter((cb) => cb !== connectHandler);
      };
    }
    this._subscribe(receiverId, callback);
    return () => this.unsubscribeFromAnswers(receiverId);
  }

  _subscribe(receiverId, callback) {
    const topic = `/topic/answers/${receiverId}`;
    const existing = this.subscriptions.get(topic);
    if (existing) existing.unsubscribe();

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    });
    this.subscriptions.set(topic, sub);
  }

  unsubscribeFromAnswers(receiverId) {
    const topic = `/topic/answers/${receiverId}`;
    const sub = this.subscriptions.get(topic);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  publish(destination, data) {
    if (!this.client?.active) {
      console.warn('[WS] Not connected, cannot publish');
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(data),
    });
  }

  onConnect(callback) {
    this.onConnectCallbacks.push(callback);
    return () => {
      this.onConnectCallbacks = this.onConnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  onDisconnect(callback) {
    this.onDisconnectCallbacks.push(callback);
    return () => {
      this.onDisconnectCallbacks = this.onDisconnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  isConnected() {
    return this.connected;
  }
}

const wsService = new WebSocketService();
export default wsService;
