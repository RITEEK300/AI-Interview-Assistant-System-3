import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCard from '../components/GlassCard'
import { adminApi } from '../services/api'
import {
  Shield,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Filter,
  Database,
  Sparkles,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react'

const FALLBACK_QUESTIONS = [
  { id: 1, question: 'What is the difference between let, const, and var?', category: 'Java', keyword: 'let const var' },
  { id: 2, text: 'Explain the concept of closures.', category: 'Java', keyword: 'closures' },
  { id: 3, question: 'What are React hooks?', category: 'Java', keyword: 'react hooks' },
  { id: 4, question: 'What is the difference between SQL and NoSQL?', category: 'DBMS', keyword: 'sql nosql' },
  { id: 5, question: 'Explain normalization in databases.', category: 'DBMS', keyword: 'normalization' },
  { id: 6, question: 'Tell me about yourself.', category: 'HR', keyword: 'introduce yourself' },
  { id: 7, question: 'What are your strengths?', category: 'HR', keyword: 'strengths' },
  { id: 8, question: 'What is ACID in databases?', category: 'DBMS', keyword: 'acid properties' },
  { id: 9, question: 'What is the Singleton design pattern?', category: 'Java', keyword: 'singleton pattern' },
  { id: 10, question: 'How do you handle conflict at work?', category: 'HR', keyword: 'conflict resolution' },
]

const CATEGORIES = ['All', 'Java', 'DBMS', 'HR']
const SOURCES = ['All', 'AI', 'DB']
const STATUSES = ['All', 'Active', 'Draft']

export default function Admin() {
  const [questions, setQuestions] = useState(FALLBACK_QUESTIONS)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterSource, setFilterSource] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newQ, setNewQ] = useState({ text: '', category: 'Java', source: 'AI', keyword: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getAllQuestions()
      setQuestions(data)
    } catch {
      // Fallback to local data when backend offline
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const qText = q.question || q.text || ''
      const qKeyword = q.keyword || ''
      const searchLower = search.toLowerCase()
      const matchSearch = qText.toLowerCase().includes(searchLower) || qKeyword.toLowerCase().includes(searchLower)
      const matchCat = filterCategory === 'All' || q.category === filterCategory
      const matchSrc = filterSource === 'All' || (q.source === 'DB' ? q.source === filterSource : filterSource === 'AI')
      const matchStat = filterStatus === 'All' || q.status === filterStatus
      return matchSearch && matchCat && matchSrc && matchStat
    })
  }, [questions, search, filterCategory, filterSource, filterStatus])

  const handleDelete = async (id) => {
    try { await adminApi.deleteQuestion(id) } catch { /* fallback */ }
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const [editKeyword, setEditKeyword] = useState('')

  const handleEdit = (q) => {
    setEditingId(q.id)
    setEditText(q.question || q.text || '')
    setEditCategory(q.category)
    setEditKeyword(q.keyword || '')
  }

  const handleSave = async () => {
    try {
      await adminApi.updateQuestion(editingId, { question: editText, category: editCategory, keyword: editKeyword || editText.split(' ').slice(0, 3).join(' ') })
    } catch { /* fallback */ }
    setQuestions((prev) =>
      prev.map((q) => (q.id === editingId ? { ...q, question: editText, category: editCategory, keyword: editKeyword } : q))
    )
    setEditingId(null)
    setEditText('')
    setEditCategory('')
    setEditKeyword('')
  }

  const handleAdd = async () => {
    if (!newQ.text.trim()) return
    const id = Math.max(...questions.map((q) => q.id), 0) + 1
    const question = { question: newQ.text, answer: 'Answer to be provided', keyword: newQ.keyword || newQ.text.split(' ').slice(0, 3).join(' '), category: newQ.category }
    try {
      const saved = await adminApi.addQuestion(question)
      setQuestions((prev) => [saved, ...prev])
    } catch {
      setQuestions((prev) => [{ ...question, id, status: 'Active' }, ...prev])
    }
    setNewQ({ text: '', category: 'Java', source: 'AI', keyword: '' })
    setShowAdd(false)
  }

  const handleToggleStatus = (id) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: q.status === 'Active' ? 'Draft' : 'Active' } : q
      )
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-400" />
          Admin Panel
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage the question bank</p>
      </motion.div>

      {/* Toolbar */}
      <GlassCard hover={false} className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all duration-200 text-sm"
            />
          </div>

          {/* Filter toggle */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              showFilters ? 'bg-accent-500/20 text-accent-300' : 'glass text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </motion.button>

          {/* Add */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 bg-accent-500 hover:bg-accent-400 rounded-xl text-white text-sm font-medium transition-all duration-200 glow-accent-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </motion.button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="glass-input rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-dark-800">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Source</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="glass-input rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s} className="bg-dark-800">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="glass-input rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-dark-800">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-200">Add New Question</h3>
                <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <textarea
                  value={newQ.text}
                  onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
                  placeholder="Enter question text..."
                  rows={3}
                  className="w-full px-4 py-3 glass-input rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-sm resize-none"
                />
                <input
                  type="text"
                  value={newQ.keyword}
                  onChange={(e) => setNewQ({ ...newQ, keyword: e.target.value })}
                  placeholder="Search keywords (comma-separated, e.g., java, oop, polymorphism)"
                  className="w-full px-4 py-3 glass-input rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-sm"
                />
                <div className="flex gap-3">
                  <select
                    value={newQ.category}
                    onChange={(e) => setNewQ({ ...newQ, category: e.target.value })}
                    className="glass-input rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-500/50 flex-1"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c} className="bg-dark-800">{c}</option>
                    ))}
                  </select>
                  <select
                    value={newQ.source}
                    onChange={(e) => setNewQ({ ...newQ, source: e.target.value })}
                    className="glass-input rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-500/50 flex-1"
                  >
                    {SOURCES.filter((s) => s !== 'All').map((s) => (
                      <option key={s} value={s} className="bg-dark-800">{s}</option>
                    ))}
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  className="w-full py-3 bg-accent-500 hover:bg-accent-400 rounded-xl text-white text-sm font-medium transition-all duration-200 glow-accent-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <GlassCard hover={false} className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Question</th>
                <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Keywords</th>
                <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-600 text-sm">
                    No questions found
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      {editingId === q.id ? (
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-2 glass-input rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                        />
                      ) : (
                        <p className="text-sm text-slate-300 max-w-md">{q.question || q.text}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === q.id ? (
                        <input
                          type="text"
                          value={editKeyword}
                          onChange={(e) => setEditKeyword(e.target.value)}
                          className="w-full px-3 py-2 glass-input rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                          placeholder="Keywords"
                        />
                      ) : (
                        <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">{q.keyword || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === q.id ? (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="glass-input rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                        >
                          {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                            <option key={c} value={c} className="bg-dark-800">{c}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">{q.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                          q.source === 'AI'
                            ? 'bg-purple-500/15 text-purple-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {q.source === 'AI' ? <Sparkles className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                        {q.source}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(q.id)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                          q.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-slate-500/15 text-slate-400 hover:bg-slate-500/25'
                        }`}
                      >
                        {q.status}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === q.id ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={handleSave}
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingId(null)}
                              className="p-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </motion.button>
                          </>
                        ) : (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(q)}
                              className="p-2 rounded-lg text-slate-500 hover:text-accent-300 hover:bg-accent-500/10 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(q.id)}
                              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Showing {filtered.length} of {questions.length} questions
          </p>
          <div className="flex gap-1">
            {['AI', 'DB'].map((s) => {
              const count = questions.filter((q) => q.source === s).length
              return (
                <span key={s} className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded">
                  {s}: {count}
                </span>
              )
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
