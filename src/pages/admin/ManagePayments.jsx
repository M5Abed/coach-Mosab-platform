import React, { useState, useEffect, useCallback } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { toast } from '../../store/toastStore'
import { supabase } from '../../lib/supabase'
import { Check, X, Phone, Calendar, ZoomIn, DollarSign, RefreshCw, User } from 'lucide-react'

export function ManagePayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const [activeTab, setActiveTab] = useState('pending') // pending | all
  const [zoomedPhoto, setZoomedPhoto] = useState(null)
  
  // Rejection Modal states
  const [rejectingPayment, setRejectingPayment] = useState(null)
  const [rejectReason, setRejectReason] = useState('Blurred Screenshot')
  const [customReason, setCustomReason] = useState('')

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, subscription_status, plan_duration, rejection_reason, updated_at, payment_screenshot_url')
        .in('subscription_status', ['pending', 'active', 'rejected'])
        .neq('role', 'admin')  // exclude admin profiles
        .order('updated_at', { ascending: false })

      if (error) throw error

      console.log('[ManagePayments] Fetched', data?.length, 'profiles')

      // Map profile rows to payment display format
      setPayments((data || []).map(p => ({
        id: p.id,
        clientName: p.full_name || 'Unknown',
        email: p.email,
        phone: p.phone || '—',
        method: '—',
        amount: p.plan_duration === '1' ? '499' : p.plan_duration === '2' ? '899' : p.plan_duration === '3' ? '1299' : '—',
        date: p.updated_at ? p.updated_at.split('T')[0] : '—',
        status: p.subscription_status,
        plan: p.plan_duration || '—',
        rejectionReason: p.rejection_reason || '',
        screenshotUrl: p.payment_screenshot_url || null
      })))
    } catch (err) {
      console.error('[ManagePayments] Fetch error:', err)
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleApprove = async (payment) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', payment.id)

      if (error) throw error

      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'active' } : p))
      toast.success(`✅ ${payment.clientName}'s subscription is now Active.`)
    } catch (err) {
      toast.error('Approval failed: ' + err.message)
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectingPayment) return

    const finalReason = rejectReason === 'Other' ? customReason : rejectReason
    if (!finalReason) {
      toast.error('Please specify a rejection reason.')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'rejected', rejection_reason: finalReason })
        .eq('id', rejectingPayment.id)

      if (error) throw error

      setPayments(prev => prev.map(p => p.id === rejectingPayment.id ? { ...p, status: 'rejected', rejectionReason: finalReason } : p))
      toast.success(`❌ Rejected. Reason logged: "${finalReason}"`)
    } catch (err) {
      toast.error('Rejection failed: ' + err.message)
    }

    setRejectingPayment(null)
    setCustomReason('')
  }

  const filteredPayments = activeTab === 'pending'
    ? payments.filter(p => p.status === 'pending')
    : payments

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            MANUAL PAYMENT REQUESTS
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            Review screenshots via Telegram, verify wallet transfers, and update subscription permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={fetchPayments}
            className="p-2 rounded-lg border border-[#1F1F1F] text-[#666666] hover:text-[#E8FF00] hover:border-[#E8FF00]/30 transition-colors cursor-pointer outline-none"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Filter Tab bar */}
          <div className="flex bg-[#111111] border border-[#1F1F1F] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none ${
                activeTab === 'pending' ? 'bg-[#E8FF00] text-[#0A0A0A]' : 'text-[#666666] hover:text-[#F5F5F5]'
              }`}
            >
              Pending ({payments.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none ${
                activeTab === 'all' ? 'bg-[#E8FF00] text-[#0A0A0A]' : 'text-[#666666] hover:text-[#F5F5F5]'
              }`}
            >
              All Logs
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner — shown when DB query fails (e.g. mock session / no JWT) */}
      {fetchError && (
        <div className="bg-[#FF3A2D]/10 border border-[#FF3A2D]/40 rounded-xl p-4 text-sm text-[#FF3A2D] font-semibold space-y-1">
          <p className="font-bold uppercase text-xs tracking-wider">⚠️ Database Connection Issue</p>
          <p className="font-mono text-xs opacity-80">{fetchError}</p>
        </div>
      )}

      {/* Grid listing */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-[#666666] font-semibold uppercase text-sm animate-pulse">
            Loading payment submissions…
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-[#111111]/30 border border-[#1F1F1F] rounded-xl text-[#666666] font-semibold uppercase">
            {activeTab === 'pending' ? 'No pending payments. All clear! ✅' : 'No transactions found.'}
          </div>
        ) : (
          filteredPayments.map((p) => (
            <Card key={p.id} className="p-5 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
              {/* Left Side: Client & payment data */}
              <div className="space-y-3.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3.5 border-b border-[#1F1F1F]/60 pb-2">
                  <h3 className="font-bebas text-2xl text-[#F5F5F5] tracking-wide">{p.clientName}</h3>
                  <Badge variant={p.status === 'active' ? 'active' : p.status}>{p.status}</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-[#666666]">
                  <div>
                    <span className="block uppercase text-[10px]">Email</span>
                    <span className="text-[#F5F5F5] mt-1 block truncate">{p.email}</span>
                  </div>
                  <div>
                    <span className="block uppercase text-[10px]">Plan / Amount</span>
                    <span className="text-[#E8FF00] mt-1 block flex items-center">
                      <DollarSign size={12} /> {p.amount} EGP
                    </span>
                  </div>
                  <div>
                    <span className="block uppercase text-[10px]">Sender Phone</span>
                    <span className="text-[#F5F5F5] mt-1 block flex items-center gap-1">
                      <Phone size={12} /> {p.phone}
                    </span>
                  </div>
                  <div>
                    <span className="block uppercase text-[10px]">Last Updated</span>
                    <span className="text-[#F5F5F5] mt-1 block flex items-center gap-1">
                      <Calendar size={12} /> {p.date}
                    </span>
                  </div>
                </div>

                {/* Show rejection reason if rejected */}
                {p.status === 'rejected' && p.rejectionReason && (
                  <div className="text-xs text-[#FF3A2D] font-semibold border-t border-[#1F1F1F] pt-2">
                    ❌ Rejection reason: {p.rejectionReason}
                  </div>
                )}
              </div>

              {/* Middle: screenshot thumbnail (only if available) */}
              {p.screenshotUrl && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#1F1F1F] group shrink-0 self-center lg:self-auto">
                  <img src={p.screenshotUrl} alt="Slip" className="w-full h-full object-cover blur-[1px] group-hover:blur-0 transition-all duration-300" />
                  <div 
                    onClick={() => setZoomedPhoto(p.screenshotUrl)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#E8FF00] transition-opacity cursor-pointer"
                  >
                    <ZoomIn size={18} />
                  </div>
                </div>
              )}

              {/* Right Side: Approval / Rejection buttons */}
              {p.status === 'pending' && (
                <div className="flex gap-2.5 w-full lg:w-auto border-t lg:border-none border-[#1F1F1F] pt-4 lg:pt-0">
                  <Button 
                    onClick={() => handleApprove(p)}
                    variant="primary"
                    size="sm"
                    className="font-bebas uppercase tracking-wider text-xs flex-1 lg:flex-initial py-2.5 px-4"
                  >
                    <Check size={14} className="mr-1" /> Approve
                  </Button>
                  <Button 
                    onClick={() => setRejectingPayment(p)}
                    variant="outline"
                    size="sm"
                    className="font-bebas uppercase tracking-wider text-xs flex-1 lg:flex-initial py-2.5 px-4 text-[#FF3A2D] hover:bg-[#FF3A2D]/10 hover:border-[#FF3A2D]/20"
                  >
                    <X size={14} className="mr-1" /> Reject
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Screenshot Zoom Modal */}
      <Modal
        isOpen={!!zoomedPhoto}
        onClose={() => setZoomedPhoto(null)}
        title="TRANSACTION CONFIRMATION SLIP"
      >
        <div className="flex items-center justify-center">
          <img src={zoomedPhoto} alt="Verification" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={!!rejectingPayment}
        onClose={() => setRejectingPayment(null)}
        title="REJECT TRANSACTION"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Reason for Rejection</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none cursor-pointer"
            >
              <option value="Blurred Screenshot">Blurred Screenshot / Cannot read receipt</option>
              <option value="Incorrect Amount">Incorrect Amount Paid</option>
              <option value="Sender number mismatch">Sender number mismatch on transaction record</option>
              <option value="Other">Other (Specify below)</option>
            </select>
          </div>

          {rejectReason === 'Other' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Custom Rejection Message</label>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Type descriptive rejection reason details..."
                className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none resize-none"
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full font-bebas uppercase tracking-wider text-base py-3 mt-2 bg-[#FF3A2D] text-[#F5F5F5] hover:bg-[#FF3A2D]/90 border-transparent">
            LOG REJECTION & NOTIFY CLIENT
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default ManagePayments
