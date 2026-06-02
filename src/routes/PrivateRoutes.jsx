import React from 'react'
import { Navigate, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Sidebar } from '../components/layout/Sidebar'
import { TopBar } from '../components/layout/TopBar'
import { MobileNav } from '../components/layout/MobileNav'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguageStore } from '../store/languageStore'
import { Lock } from 'lucide-react'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'

export function PrivateRoute({ requireAdmin = false }) {
  const { isAuthenticated, isAdmin, initialized, loading, user } = useAuth()
  const { language } = useLanguageStore()

  if (!initialized || (loading && !user)) {
    return (
      <div className="flex h-screen bg-[#0A0A0A] items-center justify-center p-6 select-none">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton variant="text" className="h-8" />
          <Skeleton variant="rect" className="h-32" />
          <Skeleton variant="text" className="h-6" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const status = user?.subscription_status
  const isPending  = status === 'pending'
  const isRejected = status === 'rejected'
  // Inactive users (not yet paid) and pending/rejected users cannot see content — unless they're admins
  const isLocked = !isAdmin && (status === 'inactive' || isPending || isRejected)

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col md:flex-row">
      <Sidebar />
      <TopBar />
      
      <div className="flex-1 md:pl-[240px] rtl:md:pl-0 rtl:md:pr-[240px] pt-16 md:pt-0 pb-16 md:pb-0 flex flex-col min-h-screen">

        {/* Pending Subscription Banner */}
        {isPending && (
          <div className="bg-[#1A1400] border-b border-l-4 border-l-[#FF8C00] rtl:border-l-0 rtl:border-r-4 rtl:border-r-[#FF8C00] border-[#1F1F1F] px-6 py-4 flex flex-col sm:flex-row gap-3 items-center justify-between text-sm select-none">
            <span className="text-[#FF8C00] font-semibold text-center sm:text-left rtl:sm:text-right">
              {language === 'ar' 
                ? "⏳ دفعتك قيد المراجعة حالياً. سيتم تفعيل حسابك بالكامل خلال 24 ساعة."
                : "⏳ Your payment is under review. Full access unlocked within 24 hours."}
            </span>
            <Link 
              to="/dashboard/settings"
              className="px-3 py-1 bg-[#FF8C00]/15 hover:bg-[#FF8C00]/25 text-[#FF8C00] text-xs font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
            >
              {language === 'ar' ? "عرض الطلب" : "View Submission"}
            </Link>
          </div>
        )}

        {/* Rejected Subscription Banner */}
        {isRejected && (
          <div className="bg-[#1A0000] border-b border-l-4 border-l-[#FF3A2D] rtl:border-l-0 rtl:border-r-4 rtl:border-r-[#FF3A2D] border-[#1F1F1F] px-6 py-4 flex flex-col sm:flex-row gap-3 items-center justify-between text-sm select-none">
            <span className="text-[#FF3A2D] font-semibold text-center sm:text-left rtl:sm:text-right">
              {language === 'ar'
                ? `❌ لم يتم قبول دفعتك. السبب: ${user?.rejection_reason || 'الصورة غير واضحة أو البيانات غير صحيحة.'}`
                : `❌ Your payment was not approved. Reason: ${user?.rejection_reason || 'Screenshot blurred or incorrect details.'}`}
            </span>
            <Link 
              to="/payment"
              className="px-3 py-1 bg-[#FF3A2D]/15 hover:bg-[#FF3A2D]/25 text-[#FF3A2D] text-xs font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
            >
              {language === 'ar' ? "إعادة إرسال الدفع" : "Resubmit Payment"}
            </Link>
          </div>
        )}

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {isLocked ? (
            /* Subscription Gate — shown instead of content for unverified users */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 select-none">
              <div className="w-20 h-20 rounded-full bg-[#1F1F1F] border border-[#2F2F2F] flex items-center justify-center text-[#666666]">
                <Lock size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="font-bebas text-3xl text-[#F5F5F5] tracking-wide uppercase">
                  {language === 'ar' ? 'الوصول محظور' : 'Access Restricted'}
                </h2>
                <p className="text-sm text-[#666666] font-semibold max-w-sm">
                  {status === 'pending'
                    ? (language === 'ar'
                        ? 'دفعتك قيد المراجعة. سيتم تفعيل حسابك خلال 24 ساعة بعد التحقق.'
                        : 'Your payment is being reviewed. Access will be unlocked within 24 hours.')
                    : status === 'rejected'
                    ? (language === 'ar'
                        ? 'لم يتم قبول دفعتك. يرجى إعادة إرسال الدفع للمراجعة.'
                        : 'Your payment was not approved. Please resubmit your payment proof.')
                    : (language === 'ar'
                        ? 'يجب عليك إتمام الدفع أولاً للوصول إلى المحتوى.'
                        : 'You need to complete payment to access content.')}
                </p>
              </div>
              <Link
                to={status === 'rejected' || status === 'inactive' ? '/payment' : '/dashboard/settings'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8FF00] text-[#0A0A0A] font-bebas text-base tracking-wider uppercase rounded-lg hover:bg-[#d4e800] transition-colors"
              >
                {status === 'rejected' || status === 'inactive'
                  ? (language === 'ar' ? 'إرسال إثبات الدفع' : 'Submit Payment Proof')
                  : (language === 'ar' ? 'عرض الطلب' : 'View Submission')}
              </Link>
            </div>
          ) : (
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

export default PrivateRoute
