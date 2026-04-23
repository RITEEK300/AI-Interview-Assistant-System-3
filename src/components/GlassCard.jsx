import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.01, transition: { duration: 0.2 } } : {}}
      className={`glass rounded-2xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}
