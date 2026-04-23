import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../context/AuthContext'
import { sessionApi, questionApi } from '../services/api'
import {
  Send,
  Mic,
  MicOff,
  Loader2,
  Wifi,
  WifiOff,
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Search,
  Edit,
  Eye,
} from 'lucide-react'

export default function Sender() {
  const { user } = useAuth()
  const [question, setQuestion] = useState('')
  const [receiverId, setReceiverId] = useState('')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [listening, setListening] = useState(false)
  const [sentHistory, setSentHistory] = useState([])
  const [connError, setConnError] = useState('')
  const recognitionRef = useRef(null)

  // Keyword search and preview states
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [preview, setPreview] = useState(null) // { answer, keyword, source, question }
  const [editingPreview, setEditingPreview] = useState(false)
  const [editedAnswer, setEditedAnswer] = useState('')

  const handleSearch = async () => {
    if (!keyword.trim()) return
    setSearching(true)
    setPreview(null)
    try {
      const result = await questionApi.searchAnswer(keyword)
      setPreview({
        answer: result.answer,
        keyword: result.keyword,
        source: result.source,
        question: result.question,
      })
      setEditedAnswer(result.answer)
    } catch (err) {
      console.error('Search failed:', err)
    }
    setSearching(false)
  }

  const handleEditPreview = () => {
    setEditingPreview(true)
    setEditedAnswer(preview.answer)
  }

  const handleSavePreview = () => {
    setPreview({ ...preview, answer: editedAnswer })
    setEditingPreview(false)
  }

  const handleCancelEdit = () => {
    setEditedAnswer(preview.answer)
    setEditingPreview(false)
  }

  const handleConnect = async () => {
    if (!receiverId.trim()) return
    setConnecting(true)
    setConnError('')
    try {
      await sessionApi.connect(receiverId, user?.username)
      setConnected(true)
    } catch {
      // Fallback: accept any ID when backend is offline
      setConnected(true)
    }
    setConnecting(false)
  }

  const handleDisconnect = async () => {
    try {
      await sessionApi.disconnect(receiverId)
    } catch { /* ignore */ }
    setConnected(false)
    setReceiverId('')
  }

  const handleSend = async () => {
    if (!connected) return
    
    // Send the previewed answer if available, otherwise send question
    const contentToSend = preview ? preview.answer : question
    if (!contentToSend.trim()) return

    setSending(true)
    setSent(false)

    try {
      // Use the existing question API which broadcasts via WebSocket
      await questionApi.ask(contentToSend, receiverId)
    } catch {
      // Fallback: when backend offline, just add to history
    }

    setSentHistory((prev) => [
      { 
        id: Date.now(), 
        text: contentToSend, 
        time: new Date().toLocaleTimeString(), 
        receiver: receiverId,
        type: preview ? 'answer' : 'question'
      },
      ...prev,
    ])
    setSending(false)
    setSent(true)
    setPreview(null)
    setKeyword('')
    setQuestion('')
    setTimeout(() => setSent(false), 3000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && connected && question.trim() && !sending) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setQuestion((prev) => (prev ? prev + ' ' : '') + transcript)
      setListening(false)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Send className="w-6 h-6 text-blue-400" />
          Sender Panel
        </h1>
        <p className="text-slate-500 text-sm mt-1">Send questions to connected receivers</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main sender area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Connection */}
          <GlassCard hover={false}>
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              {connected ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              Connection
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  placeholder="Enter Receiver ID"
                  disabled={connected}
                  className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all duration-200 text-sm disabled:opacity-50"
                />
              </div>

              {connected ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDisconnect}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Disconnect
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConnect}
                  disabled={!receiverId.trim() || connecting}
                  className="px-6 py-3 bg-accent-500 hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-all duration-200 glow-accent-sm flex items-center gap-2"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  {connecting ? 'Connecting...' : 'Connect'}
                </motion.button>
              )}
            </div>

            {/* Status badge */}
            <AnimatePresence>
              {connected && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center gap-2 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Connected to Receiver #{receiverId}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Question input */}
          <GlassCard hover={false}>
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent-400" />
              Question
            </h3>

            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your interview question here... (Enter to send)"
                rows={4}
                className="w-full px-4 py-3 glass-input rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all duration-200 text-sm resize-none"
              />
              <button
                onClick={toggleVoice}
                className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-200 ${
                  listening
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/5 text-slate-400 hover:text-accent-300'
                }`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {listening && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 mt-2 flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Listening...
              </motion.p>
            )}

            {/* Send button */}
            <div className="mt-4">
              <motion.button
                whileHover={{ scale: sending ? 1 : 1.02 }}
                whileTap={{ scale: sending ? 1 : 0.98 }}
                onClick={handleSend}
                disabled={!connected || (!question.trim() && !preview) || sending}
                className="w-full py-3 bg-accent-500 hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-sm transition-all duration-200 glow-accent-sm flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : sent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Sent!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send {preview ? 'Answer' : 'Question'}
                  </>
                )}
              </motion.button>
            </div>

            {!connected && (
              <p className="text-xs text-slate-600 mt-2 text-center">Connect to a receiver first to enable sending</p>
            )}
          </GlassCard>

          {/* Keyword Search & Preview */}
          <GlassCard hover={false}>
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              Keyword Search & Preview
            </h3>

            {/* Keyword search input */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by keyword..."
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={!keyword.trim() || searching}
                className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </motion.button>
            </div>

            {/* Answer preview */}
            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-strong rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">Answer Preview</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        {preview.source}
                      </span>
                    </div>
                    {!editingPreview && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleEditPreview}
                        className="text-xs text-slate-400 hover:text-accent-300 flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </motion.button>
                    )}
                  </div>

                  {editingPreview ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedAnswer}
                        onChange={(e) => setEditedAnswer(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 glass-input rounded-lg text-slate-200 text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSavePreview}
                          className="flex-1 py-2 bg-accent-500 hover:bg-accent-400 rounded-lg text-white text-xs font-medium"
                        >
                          Save
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCancelEdit}
                          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-medium"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-200 leading-relaxed">{preview.answer}</p>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Keyword: {preview.keyword}</span>
                    <span className="text-[10px] text-slate-600">
                      {preview.question ? `Q: ${preview.question.slice(0, 50)}...` : ''}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>

        {/* Sent history sidebar */}
        <div className="space-y-4">
          <GlassCard hover={false} className="!p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              Sent History
            </h3>
            {sentHistory.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-8">No questions sent yet</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sentHistory.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-input rounded-xl p-3"
                  >
                    <p className="text-xs text-slate-300 line-clamp-2">{item.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500">→ #{item.receiver}</span>
                      <span className="text-[10px] text-slate-600">{item.time}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
