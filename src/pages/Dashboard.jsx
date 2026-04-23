import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/GlassCard'
import { Send, Radio, Shield, Zap, Clock, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Questions Sent', value: '128', icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { label: 'Answers Received', value: '96', icon: Radio, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { label: 'Admin Actions', value: '42', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { label: 'Response Rate', value: '75%', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/20' },
]

const recentActivity = [
  { text: 'New question sent to Receiver #2', time: '2 min ago', type: 'send' },
  { text: 'AI-generated answer received', time: '5 min ago', type: 'receive' },
  { text: 'Question bank updated by Admin', time: '12 min ago', type: 'admin' },
  { text: 'Connection established with Receiver #1', time: '18 min ago', type: 'connect' },
  { text: 'DB-sourced answer delivered', time: '25 min ago', type: 'receive' },
]

export default function Dashboard() {
  const { user } = useAuth()

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-100">
          {getGreeting()}, <span className="text-gradient">{user?.name}</span>
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Here's what's happening with your interview assistant today.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="!p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <Zap className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'send' ? 'bg-blue-400' :
                  item.type === 'receive' ? 'bg-emerald-400' :
                  item.type === 'admin' ? 'bg-amber-400' :
                  'bg-purple-400'
                }`} />
                <span className="text-slate-300 flex-1">{item.text}</span>
                <span className="text-slate-600 text-xs whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-400" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <a
              href="/sender"
              className="flex items-center gap-3 glass-input rounded-xl px-4 py-3 text-sm text-slate-300 hover:text-accent-300 hover:border-accent-500/30 transition-all duration-200"
            >
              <Send className="w-4 h-4 text-blue-400" />
              Send a new question
            </a>
            <a
              href="/receiver"
              className="flex items-center gap-3 glass-input rounded-xl px-4 py-3 text-sm text-slate-300 hover:text-accent-300 hover:border-accent-500/30 transition-all duration-200"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              View receiver panel
            </a>
            <a
              href="/admin"
              className="flex items-center gap-3 glass-input rounded-xl px-4 py-3 text-sm text-slate-300 hover:text-accent-300 hover:border-accent-500/30 transition-all duration-200"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Manage question bank
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
