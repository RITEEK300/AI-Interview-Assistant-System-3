import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import GlassCard from '../components/GlassCard'
import { sessionApi } from '../services/api'
import wsService from '../services/websocket'
import {
  Radio,
  Copy,
  Check,
  Database,
  Sparkles,
  Clock,
  MessageSquare,
  Wifi,
  Loader2,
  Hash,
  Zap,
} from 'lucide-react'

function TypingText({ text, speed = 10, onComplete }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    indexRef.current = 0

    const interval = setInterval(() => {
      indexRef.current += 1
      setDisplayed(text.slice(0, indexRef.current))
      if (indexRef.current >= text.length) {
        clearInterval(interval)
        setDone(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return (
    <span>
      {displayed}
      {!done && <span className="typing-cursor" />}
    </span>
  )
}

export default function Receiver() {
  const [receiverId, setReceiverId] = useState('')
  const [wsConnected, setWsConnected] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [answers, setAnswers] = useState([])
  const [activeAnswer, setActiveAnswer] = useState(null)
  const [copied, setCopied] = useState(false)
  const [typingDone, setTypingDone] = useState(false)

  const handleIncomingAnswer = useCallback((data) => {
    const answer = {
      id: Date.now(),
      question: data.question,
      answer: data.answer,
      source: data.source,
      responseTimeMs: data.responseTimeMs,
      timestamp: data.timestamp || new Date().toISOString(),
    }
    setAnswers((prev) => [answer, ...prev].slice(0, 100))
    setActiveAnswer(answer)
    setTypingDone(false)
    setCopied(false)
  }, [])

  useEffect(() => {
    wsService.connect()
    const onConn = () => setWsConnected(true)
    const onDisc = () => setWsConnected(false)
    const removeConnHandler = wsService.onConnect(onConn)
    const removeDiscHandler = wsService.onDisconnect(onDisc)

    return () => {
      removeConnHandler?.()
      removeDiscHandler?.()
      wsService.disconnect()
    }
  }, [])

  useEffect(() => {
    let cleanupSubscription
    if (receiverId && wsService.isConnected()) {
      cleanupSubscription = wsService.subscribeToAnswers(receiverId, handleIncomingAnswer)
    }
    return () => {
      cleanupSubscription?.()
      if (receiverId) wsService.unsubscribeFromAnswers(receiverId)
    }
  }, [receiverId, wsConnected, handleIncomingAnswer])

  const generateId = async () => {
    setGenerating(true)
    try {
      const data = await sessionApi.generateReceiverId()
      setReceiverId(data.receiverId)
    } catch {
      // Fallback: generate local ID when backend offline
      const id = 'REC-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      setReceiverId(id)
    }
    setGenerating(false)
  }

  const handleCopy = async () => {
    if (!activeAnswer) return
    await navigator.clipboard.writeText(activeAnswer.answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSelectAnswer = (answer) => {
    setActiveAnswer(answer)
    setTypingDone(false)
    setCopied(false)
  }

  const timeAgo = (ts) => {
    const date = new Date(ts)
    const diff = Math.floor((Date.now() - date.getTime()) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ago`
  }

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Radio className="w-6 h-6 text-emerald-400" />
          Receiver Panel
        </h1>
        <p className="text-slate-500 text-sm mt-1">Receive answers in real-time via WebSocket</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main answer area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Receiver ID card */}
          <GlassCard hover={false} className="!p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-accent-400" />
                  Your Receiver ID
                </h3>
                {receiverId ? (
                  <div className="flex items-center gap-3">
                    <code className="text-lg font-bold text-gradient tracking-wider">{receiverId}</code>
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <Wifi className="w-3 h-3" />
                      {wsConnected ? 'Live' : 'Reconnecting'}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Generate a unique ID to start receiving answers</p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateId}
                disabled={generating || !!receiverId}
                className="px-5 py-2.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-all duration-200 glow-accent-sm flex items-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {receiverId ? 'Generated' : 'Generate ID'}
              </motion.button>
            </div>
          </GlassCard>

          {/* Answer display */}
          <GlassCard hover={false} className="!p-8">
            {!activeAnswer ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Waiting for answers...</p>
                <p className="text-slate-600 text-xs mt-1">
                  {receiverId
                    ? `Share your ID (${receiverId}) with a sender`
                    : 'Generate a Receiver ID first'}
                </p>
              </div>
            ) : (
              <>
                {/* Question */}
                <div className="mb-6">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Question</p>
                  <p className="text-sm text-slate-300 font-medium">{activeAnswer.question}</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent mb-6" />

                {/* Answer */}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Answer</p>
                  <div className="text-slate-200 text-base leading-relaxed min-h-[120px]">
                    <TypingText
                      key={activeAnswer.id}
                      text={activeAnswer.answer}
                      speed={18}
                      onComplete={() => setTypingDone(true)}
                    />
                  </div>
                </div>

                {/* Meta bar */}
                <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      activeAnswer.source === 'AI'
                        ? 'bg-purple-500/15 text-purple-300'
                        : 'bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {activeAnswer.source === 'AI' ? (
                      <Sparkles className="w-3 h-3" />
                    ) : (
                      <Database className="w-3 h-3" />
                    )}
                    {activeAnswer.source === 'AI' ? 'AI Generated' : 'DB Sourced'}
                  </div>

                  {activeAnswer.responseTimeMs && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Zap className="w-3 h-3" />
                      {activeAnswer.responseTimeMs}ms
                    </div>
                  )}

                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(activeAnswer.timestamp)} · {timeAgo(activeAnswer.timestamp)}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    disabled={!typingDone}
                    className={`ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      copied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : typingDone
                        ? 'glass hover:border-accent-500/30 text-slate-300 hover:text-accent-300'
                        : 'glass text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </motion.button>
                </div>
              </>
            )}
          </GlassCard>
        </div>

        {/* Answer history sidebar */}
        <div className="space-y-4">
          <GlassCard hover={false} className="!p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent-400" />
              Answer History
              {answers.length > 0 && (
                <span className="text-[10px] bg-accent-500/20 text-accent-300 px-1.5 py-0.5 rounded">
                  {answers.length}
                </span>
              )}
            </h3>
            {answers.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-8">No answers received yet</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {answers.map((answer) => (
                  <motion.button
                    key={answer.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 3 }}
                    onClick={() => handleSelectAnswer(answer)}
                    className={`w-full text-left glass-input rounded-xl p-3 transition-all duration-200 relative ${
                      activeAnswer?.id === answer.id
                        ? 'border-accent-500/40 bg-accent-500/5'
                        : 'hover:border-accent-500/20'
                    }`}
                  >
                    <p className="text-xs text-slate-300 line-clamp-2 mb-1.5">{answer.question}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-medium ${
                          answer.source === 'AI' ? 'text-purple-400' : 'text-emerald-400'
                        }`}
                      >
                        {answer.source}
                      </span>
                      <span className="text-[10px] text-slate-600">{timeAgo(answer.timestamp)}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
