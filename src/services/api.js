const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
const REQUEST_TIMEOUT_MS = 10000;

function getAuthHeaders() {
  try {
    const savedUser = localStorage.getItem('ai_interview_user');
    if (!savedUser) return {};
    const parsed = JSON.parse(savedUser);
    return parsed?.token ? { Authorization: `Bearer ${parsed.token}` } : {};
  } catch {
    return {};
  }
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const config = {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...options.headers },
    signal: controller.signal,
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await parseResponseBody(res);

    if (!res.ok) {
      throw new Error(data?.message || `Request failed with status ${res.status}`);
    }

    if (data && typeof data === 'object' && 'success' in data && !data.success) {
      throw new Error(data.message || 'API request failed');
    }

    return data?.data ?? data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const authApi = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

export const sessionApi = {
  generateReceiverId: () => request('/sessions/generate', { method: 'POST' }),
  connect: (receiverId, senderId) =>
    request('/sessions/connect', {
      method: 'POST',
      body: JSON.stringify({ receiverId, senderId: senderId?.toString() }),
    }),
  disconnect: (receiverId) =>
    request('/sessions/disconnect', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    }),
  status: (receiverId) => request(`/sessions/status/${receiverId}`),
};

export const questionApi = {
  ask: (question, receiverId) =>
    request('/questions/ask', {
      method: 'POST',
      body: JSON.stringify({ question, receiverId }),
    }),
  searchAnswer: (keyword) =>
    request(`/questions/search-answer?keyword=${encodeURIComponent(keyword)}`),
};

export const adminApi = {
  getAllQuestions: () => request('/admin/questions'),
  searchQuestions: (q) => request(`/admin/questions/search?q=${encodeURIComponent(q)}`),
  getByCategory: (category) => request(`/admin/questions/category/${category}`),
  addQuestion: (question) =>
    request('/admin/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    }),
  updateQuestion: (id, question) =>
    request(`/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(question),
    }),
  deleteQuestion: (id) =>
    request(`/admin/questions/${id}`, { method: 'DELETE' }),
  getLogs: () => request('/admin/logs'),
};
