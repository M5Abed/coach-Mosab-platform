import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LanguageSelector } from '../ui/LanguageSelector'

export function TopBar() {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#111111]/90 backdrop-blur-md border-b border-[#1F1F1F] flex items-center justify-between px-6 z-40 select-none">
      <Link to="/" className="flex items-center">
        <img src="/logo.png" alt="Coach Mosab Logo" className="h-8 w-auto object-contain" />
      </Link>
      <div className="flex items-center gap-3">
        <LanguageSelector />
        {user && (
          <Link to="/dashboard/settings" className="w-8 h-8 rounded-full bg-[#161616] border border-[#1F1F1F] flex items-center justify-center font-bebas text-sm text-[#E8FF00] overflow-hidden active:scale-95 transition-transform hover:opacity-80">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              user.full_name?.charAt(0).toUpperCase()
            )}
          </Link>
        )}
      </div>
    </header>
  )
}
export default TopBar
