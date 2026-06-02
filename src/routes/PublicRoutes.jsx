import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Skeleton } from '../components/ui/Skeleton'

export function PublicRoute() {
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const initialized = useAuthStore((state) => state.initialized)
  const loading = useAuthStore((state) => state.loading)

  const isAuthenticated = !!session
  const isAdmin = user?.role === 'admin'
  const isInactive = user?.subscription_status === 'inactive'

  if (!initialized || loading) {
    return (
      <div className="flex h-screen bg-[#0A0A0A] items-center justify-center p-6 select-none">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton variant="text" className="h-8" />
          <Skeleton variant="rect" className="h-32" />
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" replace />
    if (isInactive) return <Navigate to="/payment" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default PublicRoute
