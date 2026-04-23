import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

const HARDCODED_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
  { username: 'sender', password: 'sender123', role: 'sender', name: 'Sender User' },
  { username: 'receiver', password: 'receiver123', role: 'receiver', name: 'Receiver User' },
  { username: 'demo', password: 'demo123', role: 'admin', name: 'Demo User' },
]

function safeReadStoredUser() {
  try {
    const saved = window.localStorage.getItem('ai_interview_user')
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function safeWriteStoredUser(user) {
  try {
    if (user) {
      window.localStorage.setItem('ai_interview_user', JSON.stringify(user))
    } else {
      window.localStorage.removeItem('ai_interview_user')
    }
  } catch {
    // Ignore storage errors (private mode / blocked storage)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => safeReadStoredUser())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    safeWriteStoredUser(user)
  }, [user])

  const login = async (username, password) => {
    setLoading(true)
    setError('')

    try {
      const data = await authApi.login(username, password)
      const userData = { username: data.username, name: data.name, role: data.role, token: data.token }
      setUser(userData)
      setLoading(false)
      return true
    } catch (err) {
      // Fallback only when backend is unreachable (local demo mode)
      const isNetworkError = err?.message?.includes('Failed to fetch') || err?.message?.includes('timed out')
      if (!isNetworkError) {
        setError(err?.message || 'Login failed')
        setLoading(false)
        return false
      }

      const found = HARDCODED_USERS.find(
        (u) => u.username === username && u.password === password
      )
      if (found) {
        const { password: _, ...userData } = found
        setUser(userData)
        setLoading(false)
        return true
      }
      setError('Invalid username or password')
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    safeWriteStoredUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
