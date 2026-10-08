import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, Apple, Video, TrendingUp, ShieldAlert, Users, CreditCard, X, ClipboardList, Menu, ArrowLeftRight, Sparkles, MessageSquare, Settings } from 'lucide-react'
import { useLanguageStore } from '../../store/languageStore'
import { useAuthStore } from '../../store/authStore'
import { usePreviewStore } from '../../store/previewStore'

export function MobileNav() {
  const location = useLocation()
  const { language } = useLanguageStore()
  const user = useAuthStore((state) => state.user)
  const { previewClient } = usePreviewStore()
  const [showMore, setShowMore] = useState(false)

  const isPreview = !!previewClient
  const isAdmin = !isPreview && user?.role === 'admin'

  const subscriberTabs = [
    { name: language === 'ar' ? 'الرئيسية' : 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: language === 'ar' ? 'تمارين' : 'Workouts', path: '/dashboard/workouts', icon: <Dumbbell size={20} /> },
    { name: language === 'ar' ? 'تغذية' : 'Nutrition', path: '/dashboard/nutrition', icon: <Apple size={20} /> },
    { name: language === 'ar' ? 'فيديو' : 'Videos', path: '/dashboard/videos', icon: <Video size={20} /> },
    { name: language === 'ar' ? 'تقدم' : 'Progress', path: '/dashboard/progress', icon: <TrendingUp size={20} /> },
  ]

  const adminTabs = [
    { name: language === 'ar' ? 'الإدارة' : 'Admin', path: '/admin', icon: <ShieldAlert size={20} /> },
    { name: language === 'ar' ? 'العملاء' : 'Clients', path: '/admin/clients', icon: <Users size={20} /> },
    { name: language === 'ar' ? 'الخطط' : 'Plans', path: '/admin/plans', icon: <ClipboardList size={20} /> },
    { name: language === 'ar' ? 'الدفع' : 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
  ]

  const moreLinks = [
    { name: language === 'ar' ? 'إنشاء تمرين' : 'Workout Builder', path: '/admin/workouts/new', icon: <Dumbbell size={18} /> },
    { name: language === 'ar' ? 'إنشاء نظام غذائي' : 'Diet Builder', path: '/admin/nutrition/new', icon: <Apple size={18} /> },
    { name: language === 'ar' ? 'بدائل الأغذية' : 'Food Alternatives', path: '/admin/food-alternatives', icon: <ArrowLeftRight size={18} /> },
    { name: language === 'ar' ? 'إدارة الفيديوهات' : 'Videos Manager', path: '/admin/videos', icon: <Video size={18} /> },
    { name: language === 'ar' ? 'التحولات' : 'Transformations', path: '/admin/transformations', icon: <Sparkles size={18} /> },
    { name: language === 'ar' ? 'آراء العملاء' : 'Testimonials', path: '/admin/testimonials', icon: <MessageSquare size={18} /> },
    { name: language === 'ar' ? 'إعدادات الدفع' : 'Payment Settings', path: '/admin/payment-config', icon: <CreditCard size={18} /> },
    { name: language === 'ar' ? 'الإعدادات' : 'Settings', path: '/dashboard/settings', icon: <Settings size={18} /> },
  ]

  const tabs = isAdmin ? adminTabs : subscriberTabs

  return (
    <>
    {isAdmin && showMore && (
      <>
        <button type="button" aria-label="Close more menu" onClick={() => setShowMore(false)} className="md:hidden fixed inset-0 z-40 bg-black/70" />
        <div className="md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-[#2A2A2A] bg-[#111111] p-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
            <span className="font-bebas text-lg text-[#F5F5F5] uppercase">{language === 'ar' ? 'أدوات الإدارة' : 'Admin Tools'}</span>
            <button type="button" aria-label="Close more menu" onClick={() => setShowMore(false)} className="p-2 text-[#888888]"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 pt-3">
            {moreLinks.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setShowMore(false)} className="flex items-center gap-3 rounded-lg border border-[#252525] bg-[#181818] px-3 py-3 text-sm text-[#F5F5F5] hover:border-[#E8FF00]/40 hover:text-[#E8FF00]">
                <span className="text-[#E8FF00] shrink-0">{link.icon}</span><span>{link.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </>
    )}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-[#111111]/95 backdrop-blur-md border-t border-[#1F1F1F] flex items-center justify-around z-50 px-1 select-none">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path || (tab.path !== '/dashboard' && tab.path !== '/admin' && location.pathname.startsWith(tab.path + '/'))
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 px-0.5 transition-colors ${
              isActive ? 'text-[#E8FF00]' : 'text-[#666666]'
            }`}
          >
            {tab.icon}
            <span className="w-full truncate text-center text-[9px] min-[380px]:text-[10px] font-bold font-dmsans">{tab.name}</span>
          </Link>
        )
      })}
      {isAdmin && (
        <button
          type="button"
          onClick={() => setShowMore(open => !open)}
          aria-label={language === 'ar' ? 'المزيد من أدوات الإدارة' : 'More admin tools'}
          aria-expanded={showMore}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 px-0.5 transition-colors cursor-pointer outline-none ${showMore || moreLinks.some(link => location.pathname === link.path) ? 'text-[#E8FF00]' : 'text-[#666666]'}`}
        >
          <Menu size={20} />
          <span className="w-full truncate text-center text-[9px] min-[380px]:text-[10px] font-bold font-dmsans">{language === 'ar' ? 'المزيد' : 'More'}</span>
        </button>
      )}
    </nav>
    </>
  )
}

export default MobileNav
