import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { Users, CreditCard, Video, RefreshCw, DollarSign, TrendingUp, Calendar } from 'lucide-react'

export function AdminDashboard() {
  const [stats, setStats] = useState([
    { name: 'Active Subscribers', value: '0', icon: <Users size={20} />, color: 'text-[#E8FF00] bg-[#E8FF00]/10 border-[#E8FF00]/25', link: '/admin/clients' },
    { name: 'Pending Payments', value: '0', icon: <CreditCard size={20} />, color: 'text-[#FF8C00] bg-[#FF8C00]/10 border-[#FF8C00]/25', link: '/admin/payments' },
    { name: 'Total Revenue', value: '0 EGP', icon: <DollarSign size={20} />, color: 'text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/25', link: '/admin/payments' },
    { name: 'This Month', value: '0 EGP', icon: <TrendingUp size={20} />, color: 'text-[#F5F5F5] bg-[#F5F5F5]/5 border-[#1F1F1F]', link: '/admin/payments' },
    { name: 'Last Month', value: '0 EGP', icon: <Calendar size={20} />, color: 'text-[#666666] bg-[#111111] border-[#1F1F1F]', link: '/admin/payments' },
    { name: 'Videos Uploaded', value: '0', icon: <Video size={20} />, color: 'text-[#4DA6FF] bg-[#4DA6FF]/10 border-[#4DA6FF]/25', link: '/admin/videos' }
  ])

  const [signups, setSignups] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch counts
      const [profilesRes, videosRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('subscription_status, full_name, plan_duration, updated_at, email')
          .neq('role', 'admin'),
        supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
      ])

      if (profilesRes.error) throw profilesRes.error
      if (videosRes.error) throw videosRes.error

      const profiles = profilesRes.data || []
      const activeCount = profiles.filter(p => p.subscription_status === 'active').length
      const pendingCount = profiles.filter(p => p.subscription_status === 'pending').length
      const videoCount = videosRes.count || 0

      // Calculate revenue stats
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()

      let totalRevenue = 0
      let thisMonthRevenue = 0
      let lastMonthRevenue = 0

      profiles.forEach(p => {
        if (p.subscription_status === 'active') {
          const amount = p.plan_duration === '1' ? 499 : p.plan_duration === '2' ? 899 : p.plan_duration === '3' ? 1299 : 0
          totalRevenue += amount

          if (p.updated_at) {
            const pDate = new Date(p.updated_at)
            if (!isNaN(pDate.getTime())) {
              const pYear = pDate.getFullYear()
              const pMonth = pDate.getMonth()

              // This Month
              if (pYear === currentYear && pMonth === currentMonth) {
                thisMonthRevenue += amount
              }
              // Last Month
              const targetLastMonth = currentMonth === 0 ? 11 : currentMonth - 1
              const targetLastYear = currentMonth === 0 ? currentYear - 1 : currentYear
              if (pYear === targetLastYear && pMonth === targetLastMonth) {
                lastMonthRevenue += amount
              }
            }
          }
        }
      })

      setStats([
        { name: 'Active Subscribers', value: String(activeCount), icon: <Users size={20} />, color: 'text-[#E8FF00] bg-[#E8FF00]/10 border-[#E8FF00]/25', link: '/admin/clients' },
        { name: 'Pending Payments', value: String(pendingCount), icon: <CreditCard size={20} />, color: 'text-[#FF8C00] bg-[#FF8C00]/10 border-[#FF8C00]/25', link: '/admin/payments' },
        { name: 'Total Revenue', value: `${totalRevenue.toLocaleString()} EGP`, icon: <DollarSign size={20} />, color: 'text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/25', link: '/admin/payments' },
        { name: 'This Month', value: `${thisMonthRevenue.toLocaleString()} EGP`, icon: <TrendingUp size={20} />, color: 'text-[#F5F5F5] bg-[#F5F5F5]/5 border-[#1F1F1F]', link: '/admin/payments' },
        { name: 'Last Month', value: `${lastMonthRevenue.toLocaleString()} EGP`, icon: <Calendar size={20} />, color: 'text-[#666666] bg-[#111111] border-[#1F1F1F]', link: '/admin/payments' },
        { name: 'Videos Uploaded', value: String(videoCount), icon: <Video size={20} />, color: 'text-[#4DA6FF] bg-[#4DA6FF]/10 border-[#4DA6FF]/25', link: '/admin/videos' }
      ])

      // 2. Map recent enrollments
      const sortedProfiles = [...profiles]
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
        .slice(0, 5)

      setSignups(sortedProfiles.map(p => ({
        name: p.full_name || 'Fitness Member',
        plan: p.plan_duration === '1' ? '1-Month Plan' : p.plan_duration === '2' ? '2-Month Plan' : p.plan_duration === '3' ? '3-Month Plan' : 'No Active Plan',
        date: p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '—',
        status: p.subscription_status || 'inactive'
      })))
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            COACH MOSAB — ADMIN PANEL
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            Review manual checkout slips and assign client sheets.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2.5 rounded-lg border border-[#1F1F1F] bg-[#111111] text-[#666666] hover:text-[#E8FF00] hover:border-[#E8FF00]/30 transition-colors cursor-pointer outline-none self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.link} className="block transition-transform duration-200 hover:-translate-y-1">
            <Card className="flex items-center gap-4 h-full cursor-pointer hover:border-[#E8FF00]/30 transition-colors">
              <div className={`p-3 rounded-lg border ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">{stat.name}</span>
                <span className="font-bebas text-2xl text-[#F5F5F5]">{stat.value}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent signups list */}
      <Card className="w-full space-y-4">
        <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2">RECENT REGISTRATION ENROLLMENTS</h3>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-6 text-xs text-[#666666] font-bold uppercase animate-pulse">Loading recent signups...</div>
          ) : signups.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#666666] font-bold uppercase">No recent signups.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#666666] uppercase border-b border-[#1F1F1F]">
                  <th className="pb-3 font-bold">Client Name</th>
                  <th className="pb-3 font-bold">Assigned Plan</th>
                  <th className="pb-3 font-bold">Enroll Date</th>
                  <th className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]/40">
                {signups.map((s, idx) => (
                  <tr key={idx} className="hover:bg-[#1C1C1C]/10 transition-colors">
                    <td className="py-3.5 font-bold text-[#F5F5F5]">{s.name}</td>
                    <td className="py-3.5 text-[#666666] font-semibold">{s.plan}</td>
                    <td className="py-3.5 text-[#666666] font-semibold">{s.date}</td>
                    <td className="py-3.5">
                      <Badge variant={s.status === 'active' ? 'active' : s.status}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AdminDashboard
