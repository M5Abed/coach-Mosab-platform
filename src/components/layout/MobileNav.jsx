import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, Apple, Video, TrendingUp, ShieldAlert, Users, CreditCard } from 'lucide-react'
import { useLanguageStore } from '../../store/languageStore'
import { useAuthStore } from '../../store/authStore'
import { translations } from '../../utils/translations'

export function MobileNav() {
  const location = useLocation()
  const { language } = useLanguageStore()
  const user = useAuthStore((state) => state.user)
  const t = translations[language]

  const isAdmin = user?.role === 'admin'

  const subscriberTabs = [
    { name: t.dashboard, path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: t.workouts, path: '/dashboard/workouts', icon: <Dumbbell size={20} /> },
    { name: t.nutrition, path: '/dashboard/nutrition', icon: <Apple size={20} /> },
    { name: t.videos, path: '/dashboard/videos', icon: <Video size={20} /> },
    { name: t.progress, path: '/dashboard/progress', icon: <TrendingUp size={20} /> },
  ]

  const adminTabs = [
    { name: language === 'ar' ? "لوحة الإشراف" : "Admin", path: '/admin', icon: <ShieldAlert size={20} /> },
    { name: language === 'ar' ? "المشتركون" : "Clients", path: '/admin/clients', icon: <Users size={20} /> },
    { name: language === 'ar' ? "التمارين" : "Workouts", path: '/admin/workouts/new', icon: <Dumbbell size={20} /> },
    { name: language === 'ar' ? "الأنظمة" : "Nutrition", path: '/admin/nutrition/new', icon: <Apple size={20} /> },
  ]

  const tabs = isAdmin ? adminTabs : subscriberTabs

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111111]/95 backdrop-blur-md border-t border-[#1F1F1F] flex items-center justify-around z-40 px-2 select-none">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path || (tab.path !== '/dashboard' && tab.path !== '/admin' && location.pathname.startsWith(tab.path + '/'))
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive ? 'text-[#E8FF00]' : 'text-[#666666]'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-bold font-dmsans">{tab.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default MobileNav
