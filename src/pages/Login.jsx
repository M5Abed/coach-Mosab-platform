import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { Button } from '../components/ui/Button'
import { ShieldCheck, Mail, Lock } from 'lucide-react'
import { useLanguageStore } from '../store/languageStore'
import { translations } from '../utils/translations'
import { LanguageSelector } from '../components/ui/LanguageSelector'

export function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const { language } = useLanguageStore()
  const t = translations[language]
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter both email and password.')
      return
    }

    try {
      const data = await login(email, password)
      toast.success('Successfully logged in!')
      // Use the DB-driven role from the auth store
      const userRole = useAuthStore.getState().user?.role
      if (userRole === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials. Please verify your email and password.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center p-6 relative font-dmsans select-none">
      <div className="noise-overlay" />
      
      {/* Top right language switch */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md bg-[#111111] border border-[#1F1F1F] rounded-xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Coach Mosab Logo" className="h-16 w-auto object-contain mx-auto" />
          </Link>
          <p className="text-xs text-[#666666] font-bold uppercase tracking-widest">
            {t.loginTitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">{t.emailAddress}</label>
            <div className="relative">
              <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/50 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left rtl:text-right">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-sm text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/50 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full font-bebas tracking-wide text-base mt-2 py-3">
            {t.loginButton}
          </Button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-[#666666]">
          {t.noAccount}{' '}
          <Link to="/register" className="text-[#E8FF00] font-bold hover:underline">
            {t.registerHere}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
