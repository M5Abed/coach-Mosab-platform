import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../../store/toastStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onClose }) {
  const { message, type } = toast

  const configs = {
    success: {
      border: 'border-l-4 border-l-[#34D399]',
      icon: <CheckCircle2 size={18} className="text-[#34D399]" />,
      bg: 'bg-[#161616]'
    },
    info: {
      border: 'border-l-4 border-l-[#4DA6FF]',
      icon: <Info size={18} className="text-[#4DA6FF]" />,
      bg: 'bg-[#161616]'
    },
    error: {
      border: 'border-l-4 border-l-[#FF3A2D]',
      icon: <AlertCircle size={18} className="text-[#FF3A2D]" />,
      bg: 'bg-[#161616]'
    }
  }

  const config = configs[type] || configs.success

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border border-[#1F1F1F] ${config.bg} ${config.border}`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 font-dmsans text-sm text-[#F5F5F5]">{message}</div>
      <button
        onClick={onClose}
        className="text-[#666666] hover:text-[#F5F5F5] transition-colors p-0.5 rounded cursor-pointer"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

export default ToastContainer
