import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ToastContainer } from './components/ui/Toast'

// Public Route Guards
import PublicRoute from './routes/PublicRoutes'
import PrivateRoute from './routes/PrivateRoutes'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Payment from './pages/Payment'

// Subscriber pages
import Dashboard from './pages/dashboard/Dashboard'
import Workouts from './pages/dashboard/Workouts'
import WorkoutPlanDetail from './pages/dashboard/WorkoutPlanDetail'
import WorkoutDay from './pages/dashboard/WorkoutDay'
import Nutrition from './pages/dashboard/Nutrition'
import VideoLibrary from './pages/dashboard/VideoLibrary'
import VideoPlayer from './pages/dashboard/VideoPlayer'
import Progress from './pages/dashboard/Progress'
import Settings from './pages/dashboard/Settings'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageClients from './pages/admin/ManageClients'
import ManagePlans from './pages/admin/ManagePlans'
import ManagePayments from './pages/admin/ManagePayments'
import PaymentConfig from './pages/admin/PaymentConfig'
import WorkoutBuilder from './pages/admin/WorkoutBuilder'
import DietBuilder from './pages/admin/DietBuilder'
import VideoManager from './pages/admin/VideoManager'
import FoodAlternatives from './pages/admin/FoodAlternatives'
import TransformationsManager from './pages/admin/TransformationsManager'
import TestimonialsManager from './pages/admin/TestimonialsManager'

function App() {
  const initAuth = useAuthStore((state) => state.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        
        {/* Unauthenticated-only route guard */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/payment" element={<Payment />} />

        {/* Private Subscriber Routes */}
        <Route path="/dashboard" element={<PrivateRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="workouts/:planId" element={<WorkoutPlanDetail />} />
          <Route path="workouts/:planId/:dayId" element={<WorkoutDay />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="videos" element={<VideoLibrary />} />
          <Route path="videos/:videoId" element={<VideoPlayer />} />
          <Route path="progress" element={<Progress />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Private Admin Routes */}
        <Route path="/admin" element={<PrivateRoute requireAdmin />}>
          <Route index element={<AdminDashboard />} />
          <Route path="clients" element={<ManageClients />} />
          <Route path="plans" element={<ManagePlans />} />
          <Route path="payments" element={<ManagePayments />} />
          <Route path="payment-config" element={<PaymentConfig />} />
          <Route path="workouts/new" element={<WorkoutBuilder />} />
          <Route path="nutrition/new" element={<DietBuilder />} />
          <Route path="food-alternatives" element={<FoodAlternatives />} />
           <Route path="videos" element={<VideoManager />} />
          <Route path="transformations" element={<TransformationsManager />} />
          <Route path="testimonials" element={<TestimonialsManager />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global toast notification system */}
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
