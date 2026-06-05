import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/toastStore'
import { supabase } from '../../lib/supabase'
import { User, CreditCard, Bell, Lock } from 'lucide-react'

export function Settings() {
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  
  const [activeTab, setActiveTab] = useState('profile') // profile | subscription | notifications | password
  const [loading, setLoading] = useState(false)

  // Profile Form States
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [level, setLevel] = useState(user?.fitness_level || 'beginner')

  // Sync form fields when user data loads asynchronously
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setLevel(user.fitness_level || 'beginner')
    }
  }, [user?.id]) // re-sync only when user identity changes
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile({
        full_name: fullName,
        fitness_level: level
      })
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Update failed.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.message || 'Password update failed.')
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <User size={16} /> },
    { id: 'subscription', name: 'Subscription', icon: <CreditCard size={16} /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell size={16} /> },
    { id: 'password', name: 'Password', icon: <Lock size={16} /> }
  ]

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div>
        <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
          ACCOUNT SETTINGS
        </h1>
        <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
          Configure profile layouts and active trackers.
        </p>
      </div>

      {/* Split grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Tab bar */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible bg-[#111111] border border-[#1F1F1F] p-1.5 rounded-xl gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center lg:justify-start gap-2.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors outline-none cursor-pointer flex-1 lg:flex-none ${
                activeTab === tab.id 
                  ? 'bg-[#E8FF00] text-[#0A0A0A]' 
                  : 'text-[#666666] hover:text-[#F5F5F5] hover:bg-[#161616]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Right: Settings panel container */}
        <div className="lg:col-span-9">
          {activeTab === 'profile' && (
            <Card className="space-y-6">
              <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-3">PROFILE OPTIONS</h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Email Address (Read-only)</label>
                  <input
                    type="text"
                    value={user?.email || 'user@example.com'}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#666666] outline-none"
                    readOnly
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Fitness Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                  >
                    <option value="beginner">Beginner (Foundation Shred)</option>
                    <option value="intermediate">Intermediate (Hypertrophy Bulk)</option>
                    <option value="advanced">Advanced (Elite Conditioning)</option>
                  </select>
                </div>

                <Button type="submit" loading={loading} className="font-bebas uppercase tracking-wider text-sm py-2.5 px-6">
                  Save Changes
                </Button>
              </form>
            </Card>
          )}

          {activeTab === 'subscription' && (
            <Card className="space-y-6">
              <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-3">SUBSCRIPTION DETAILS</h3>
              
              <div className="p-4 bg-[#111111]/85 border border-[#1F1F1F] rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-[#666666] font-bold uppercase block">Active Plan</span>
                    <span className="font-bebas text-xl text-[#F5F5F5] tracking-wide">
                      {user?.plan_duration ? `${user.plan_duration.toUpperCase()} ACCESS` : 'NO ACTIVE PLAN'}
                    </span>
                  </div>
                  <Badge variant={user?.subscription_status === 'active' ? 'active' : 'pending'}>
                    {user?.subscription_status || 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-[#666666] border-t border-[#1F1F1F] pt-4">
                  <div>
                    <span className="block uppercase text-[10px]">Start Date</span>
                    <span className="text-[#F5F5F5] mt-1 block">01 Jun 2026</span>
                  </div>
                  <div>
                    <span className="block uppercase text-[10px]">Renewal/Expiry Date</span>
                    <span className="text-[#F5F5F5] mt-1 block">01 Jul 2026</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="font-bebas uppercase tracking-wider text-xs" onClick={() => toast.info('Already active')}>
                  Review Payments
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="space-y-6">
              <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-3">NOTIFICATIONS CONFIG</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#111111]/50 border border-[#1F1F1F] rounded-lg">
                  <div>
                    <span className="text-xs font-bold text-[#F5F5F5] block">Email Alerts</span>
                    <span className="text-[10px] text-[#666666]">Receive workout log updates & check-in triggers.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#E8FF00] cursor-pointer" />
                </div>

                <div className="flex justify-between items-center p-3 bg-[#111111]/50 border border-[#1F1F1F] rounded-lg">
                  <div>
                    <span className="text-xs font-bold text-[#F5F5F5] block">In-app notifications</span>
                    <span className="text-[10px] text-[#666666]">Trigger notification dots on new videos & live streams.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#E8FF00] cursor-pointer" />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'password' && (
            <Card className="space-y-6">
              <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-3">UPDATE PASSWORD</h3>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                    required
                    minLength={8}
                  />
                </div>

                <Button type="submit" className="font-bebas uppercase tracking-wider text-sm py-2.5 px-6">
                  Reset Password
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
