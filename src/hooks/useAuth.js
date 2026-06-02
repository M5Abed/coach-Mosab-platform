import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const loading = useAuthStore((state) => state.loading)
  const initialized = useAuthStore((state) => state.initialized)

  return {
    user,
    session,
    loading,
    initialized,
    isAuthenticated: !!session,
    isAdmin: user?.role === 'admin',
    isPendingPayment: user?.subscription_status === 'pending',
    isRejectedPayment: user?.subscription_status === 'rejected',
    isActiveSubscriber: user?.subscription_status === 'active',
  }
}
export default useAuth
