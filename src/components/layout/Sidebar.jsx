import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import { translations } from '../../utils/translations'
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Video,
  TrendingUp,
  Settings,
  LogOut,
  ShieldAlert,
  ClipboardList,
  ArrowLeftRight,
  Sparkles
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import { LanguageSelector } from '../ui/LanguageSelector'

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { language } = useLanguageStore()
  const t = translations[language]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const subscriberLinks = [
    { name: t.dashboard, path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: t.workouts, path: '/dashboard/workouts', icon: <Dumbbell size={20} /> },
    { name: t.nutrition, path: '/dashboard/nutrition', icon: <Apple size={20} /> },
    { name: t.videos, path: '/dashboard/videos', icon: <Video size={20} /> },
    { name: t.progress, path: '/dashboard/progress', icon: <TrendingUp size={20} /> },
    { name: t.settings, path: '/dashboard/settings', icon: <Settings size={20} /> },
  ]

  const adminLinks = [
    { name: language === 'ar' ? "لوحة الإشراف" : "Admin Panel", path: '/admin', icon: <ShieldAlert size={20} /> },
    { name: language === 'ar' ? "قائمة المشتركين" : "Clients list", path: '/admin/clients', icon: <LayoutDashboard size={20} /> },
    { name: language === 'ar' ? "دليل الخطط" : "Plans Directory", path: '/admin/plans', icon: <ClipboardList size={20} /> },
    { name: language === 'ar' ? "صانع التمارين" : "Workout Builder", path: '/admin/workouts/new', icon: <Dumbbell size={20} /> },
    { name: language === 'ar' ? "صانع الأنظمة الغذائية" : "Diet Builder", path: '/admin/nutrition/new', icon: <Apple size={20} /> },
    { name: language === 'ar' ? "بدائل الأغذية" : "Food Alternatives", path: '/admin/food-alternatives', icon: <ArrowLeftRight size={20} /> },
    { name: language === 'ar' ? "سجل المدفوعات" : "Payments log", path: '/admin/payments', icon: <TrendingUp size={20} /> },
    { name: language === 'ar' ? "إدارة الفيديوهات" : "Videos Manager", path: '/admin/videos', icon: <Video size={20} /> },
    { name: language === 'ar' ? "التحولات قبل وبعد" : "Transformations", path: '/admin/transformations', icon: <Sparkles size={20} /> },
    { name: language === 'ar' ? "الإعدادات" : "Settings", path: '/dashboard/settings', icon: <Settings size={20} /> },
  ]

  const isAdmin = user?.role === 'admin'
  const navLinks = isAdmin ? adminLinks : subscriberLinks

  const getFitnessBadgeText = (level) => {
    if (level === 'beginner') return language === 'ar' ? 'مبتدئ' : 'Beginner'
    if (level === 'intermediate') return language === 'ar' ? 'متوسط' : 'Intermediate'
    if (level === 'advanced') return language === 'ar' ? 'متقدم' : 'Advanced'
    return language === 'ar' ? 'عضو' : 'Member'
  }

  return (
    <aside className="hidden md:flex w-[240px] h-screen bg-[#111111] border-r rtl:border-r-0 rtl:border-l border-[#1F1F1F] flex-col fixed left-0 rtl:left-auto rtl:right-0 top-0 z-40">
      {/* Brand logo/header */}
      <div className="p-6 border-b border-[#1F1F1F] flex flex-col items-center">
        <Link to="/" className="flex items-center justify-center gap-2 group">
          <img src="/logo.png" alt="Coach Mosab Logo" className="h-16 w-auto object-contain" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/')
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-dmsans text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#1A1A1A] text-[#E8FF00] border-l-2 border-l-[#E8FF00] rtl:border-l-0 rtl:border-r-2 rtl:border-r-[#E8FF00] pl-[14px] rtl:pl-4 rtl:pr-[14px]'
                  : 'text-[#666666] hover:text-[#F5F5F5] hover:bg-[#161616] border-l-2 border-l-transparent'
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User profile section */}
      <div className="p-4 border-t border-[#1F1F1F] space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2 py-1 text-left rtl:text-right">
            <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#1F1F1F] flex items-center justify-center font-bebas text-xl text-[#E8FF00] overflow-hidden select-none">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#F5F5F5] truncate leading-tight">
                {user.full_name}
              </p>
              <Badge variant={user.role === 'admin' ? 'accent' : 'beginner'} className="mt-1 scale-90 origin-left rtl:origin-right">
                {user.role === 'admin' ? (language === 'ar' ? 'المدرب' : 'Coach') : getFitnessBadgeText(user.fitness_level)}
              </Badge>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <LanguageSelector />
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#1F1F1F] bg-transparent text-[#FF3A2D] hover:bg-[#FF3A2D]/10 font-dmsans text-sm font-bold transition-all duration-200 cursor-pointer outline-none"
          >
            <LogOut size={16} />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
export default Sidebar
