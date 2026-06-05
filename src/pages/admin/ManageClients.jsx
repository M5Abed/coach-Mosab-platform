import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { toast } from '../../store/toastStore'
import { parseWorkoutPlan, parseNutritionPlan } from '../../utils/planParser'
import { Eye, Edit3, Trash2, Search, Plus, Save, Dumbbell, Apple, AlertTriangle, RefreshCw, FileText } from 'lucide-react'

export function ManageClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  // Plan editing states
  const [workoutPlanText, setWorkoutPlanText] = useState('')
  const [nutritionPlanText, setNutritionPlanText] = useState('')
  const [savingPlans, setSavingPlans] = useState(false)

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLevel, setEditLevel] = useState('beginner')
  const [editStatus, setEditStatus] = useState('inactive')
  const [savingProfile, setSavingProfile] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'subscriber')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      toast.error('Failed to load client directory.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleSelectClient = (client) => {
    setSelectedClient(client)
    setIsEditingProfile(false)
    
    // Extract plans if they exist as JSONB strings/objects
    const workoutPlan = client.workout_plan
    const nutritionPlan = client.nutrition_plan

    setWorkoutPlanText(workoutPlan?.text || workoutPlan?.markdown || '')
    setNutritionPlanText(nutritionPlan?.text || nutritionPlan?.markdown || '')

    // Set profile edit values
    setEditName(client.full_name || '')
    setEditPhone(client.phone || '')
    setEditLevel(client.fitness_level || 'beginner')
    setEditStatus(client.subscription_status || 'inactive')
  }

  const handleQuickApprove = async (client) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', client.id)

      if (error) throw error

      toast.success(`✅ Approved ${client.full_name}'s subscription!`)
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === client.id 
          ? { ...c, subscription_status: 'active' }
          : c
      ))
      setSelectedClient(prev => ({ ...prev, subscription_status: 'active' }))
    } catch (err) {
      toast.error('Approval failed: ' + err.message)
    }
  }

  const handleQuickReject = async (client) => {
    const reason = window.prompt("Enter rejection reason (optional):", "Blurred Screenshot")
    if (reason === null) return // cancelled
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'rejected', rejection_reason: reason })
        .eq('id', client.id)

      if (error) throw error

      toast.success(`❌ Rejected subscription request.`)
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === client.id 
          ? { ...c, subscription_status: 'rejected', rejection_reason: reason }
          : c
      ))
      setSelectedClient(prev => ({ ...prev, subscription_status: 'rejected', rejection_reason: reason }))
    } catch (err) {
      toast.error('Rejection failed: ' + err.message)
    }
  }

  const handleSavePlans = async () => {
    if (!selectedClient) return
    setSavingPlans(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          workout_plan: { text: workoutPlanText },
          nutrition_plan: { text: nutritionPlanText }
        })
        .eq('id', selectedClient.id)

      if (error) throw error

      toast.success(`Successfully saved customized plans for ${selectedClient.full_name}!`)
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id 
          ? { ...c, workout_plan: { text: workoutPlanText }, nutrition_plan: { text: nutritionPlanText } }
          : c
      ))
      
      setSelectedClient(prev => ({
        ...prev,
        workout_plan: { text: workoutPlanText },
        nutrition_plan: { text: nutritionPlanText }
      }))
    } catch (err) {
      console.error('Error saving plans:', err)
      toast.error('Failed to save workout/diet plans.')
    } finally {
      setSavingPlans(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!selectedClient) return
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          phone: editPhone,
          fitness_level: editLevel,
          subscription_status: editStatus
        })
        .eq('id', selectedClient.id)

      if (error) throw error

      toast.success('Client profile updated successfully!')
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id 
          ? { ...c, full_name: editName, phone: editPhone, fitness_level: editLevel, subscription_status: editStatus }
          : c
      ))

      setSelectedClient(prev => ({
        ...prev,
        full_name: editName,
        phone: editPhone,
        fitness_level: editLevel,
        subscription_status: editStatus
      }))
      
      setIsEditingProfile(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDeleteClient = async (id, name) => {
    if (!window.confirm(`Are you absolutely sure you want to completely remove client ${name}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success(`Client ${name} has been removed.`)
      setClients(prev => prev.filter(c => c.id !== id))
      if (selectedClient?.id === id) {
        setSelectedClient(null)
      }
    } catch (err) {
      console.error('Error deleting client:', err)
      toast.error('Failed to remove client.')
    }
  }

  const filteredClients = clients.filter(c => {
    const matchesSearch = (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm)

    if (!matchesSearch) return false

    if (statusFilter === 'pending') return c.subscription_status === 'pending'
    if (statusFilter === 'active') return c.subscription_status === 'active'
    if (statusFilter === 'rejected') return c.subscription_status === 'rejected'
    return true
  })

  return (
    <div className="space-y-6 font-dmsans select-none relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            CLIENT DIRECTORY
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            Monitor real active subscribers, design custom workout plans & configure client diets.
          </p>
        </div>
        <button
          onClick={fetchClients}
          className="p-2.5 rounded-lg border border-[#1F1F1F] bg-[#111111] text-[#666666] hover:text-[#E8FF00] hover:border-[#E8FF00]/30 transition-colors cursor-pointer outline-none align-middle"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search and Filter Row */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
          <input
            type="text"
            placeholder="Search real clients by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-[#1F1F1F] rounded-xl py-3 pl-11 pr-4 text-sm text-[#F5F5F5] placeholder-[#666666] focus:border-[#E8FF00]/40 outline-none transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none ${
              statusFilter === 'all' ? 'bg-[#E8FF00] text-[#0A0A0A]' : 'bg-[#111111] border border-[#1F1F1F] text-[#666666] hover:text-[#F5F5F5]'
            }`}
          >
            All ({clients.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none flex items-center gap-1.5 ${
              statusFilter === 'pending' ? 'bg-[#FF8C00] text-black' : 'bg-[#111111] border border-[#1F1F1F] text-[#FF8C00]/80 hover:text-[#FF8C00]'
            }`}
          >
            Pending ({clients.filter(c => c.subscription_status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none flex items-center gap-1.5 ${
              statusFilter === 'active' ? 'bg-[#00E676] text-black' : 'bg-[#111111] border border-[#1F1F1F] text-[#00E676]/80 hover:text-[#00E676]'
            }`}
          >
            Active ({clients.filter(c => c.subscription_status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none flex items-center gap-1.5 ${
              statusFilter === 'rejected' ? 'bg-[#FF3A2D] text-[#F5F5F5]' : 'bg-[#111111] border border-[#1F1F1F] text-[#FF3A2D]/80 hover:text-[#FF3A2D]'
            }`}
          >
            Rejected ({clients.filter(c => c.subscription_status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Main Grid: List + Detail Drawer Side-by-Side if selected */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Client Rows list */}
        <div className={`space-y-3 ${selectedClient ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {loading ? (
            <div className="text-center py-12 text-sm text-[#666666] font-bold uppercase animate-pulse">
              Syncing client directory with database...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#666666] font-bold uppercase">
              No subscriber accounts found.
            </div>
          ) : (
            filteredClients.map((client) => (
              <Card 
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`p-4 cursor-pointer hover:border-[#E8FF00]/30 transition-all ${
                  selectedClient?.id === client.id ? 'border-[#E8FF00] shadow-[0_0_10px_rgba(232,255,0,0.03)]' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">{client.full_name || 'Fitness Member'}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] font-bold uppercase">
                      <span>{client.phone || 'NO PHONE'}</span>
                      <span>•</span>
                      <span>{client.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-none border-[#1F1F1F] pt-2.5 sm:pt-0">
                    <Badge variant={client.fitness_level}>{client.fitness_level}</Badge>
                    <Badge variant={client.subscription_status}>{client.subscription_status}</Badge>
                    
                    {client.subscription_status === 'pending' && (
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleQuickApprove(client)}
                          className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E8FF00] text-black hover:bg-[#d4eb00] transition-colors cursor-pointer outline-none"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleQuickReject(client)}
                          className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-[#FF3A2D] text-[#FF3A2D] hover:bg-[#FF3A2D]/10 transition-colors cursor-pointer outline-none"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <button className="p-1 rounded hover:bg-[#1C1C1C] text-[#666666] hover:text-[#E8FF00] transition-colors cursor-pointer outline-none">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Right Side: Detail Panel & Plan Editors */}
        {selectedClient && (
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Client Card Record */}
            <div className="bg-[#111111] border border-[#E8FF00]/20 rounded-xl p-6 space-y-6 shadow-2xl relative">
              <button 
                onClick={() => setSelectedClient(null)}
                className="absolute top-4 right-4 text-xs font-bold text-[#666666] hover:text-[#F5F5F5] uppercase tracking-wider outline-none cursor-pointer"
              >
                Close [X]
              </button>

              <div className="space-y-1 border-b border-[#1F1F1F] pb-4">
                <span className="text-[10px] text-[#E8FF00] font-bold uppercase tracking-wider block">CLIENT RECORD</span>
                <h2 className="font-bebas text-3xl text-[#F5F5F5] tracking-wide uppercase">{selectedClient.full_name || 'Fitness Member'}</h2>
                <span className="text-xs text-[#666666] font-semibold">{selectedClient.email}</span>
              </div>

              {selectedClient.subscription_status === 'pending' && (
                <div className="bg-[#FF8C00]/10 border border-[#FF8C00]/25 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#FF8C00] font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={16} />
                    <span>Pending Subscription Review</span>
                  </div>
                  <p className="text-[11px] text-[#A0A0A0] font-medium leading-relaxed">
                    This client has submitted a payment confirmation and is waiting to be approved or rejected.
                  </p>
                  
                  {selectedClient.payment_screenshot_url && (
                    <div className="border border-[#1F1F1F] rounded-lg overflow-hidden bg-black/40 p-2.5 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-[#666666] uppercase">Payment Slip:</span>
                      <a 
                        href={selectedClient.payment_screenshot_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] font-bold text-[#E8FF00] hover:underline uppercase flex items-center gap-1 cursor-pointer outline-none"
                      >
                        View Screenshot <Eye size={12} />
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button 
                      onClick={() => handleQuickApprove(selectedClient)}
                      variant="primary"
                      className="flex-1 font-bebas uppercase tracking-wider text-xs py-2 bg-[#E8FF00] text-black hover:bg-[#d4eb00]"
                    >
                      Approve Client
                    </Button>
                    <Button 
                      onClick={() => handleQuickReject(selectedClient)}
                      variant="outline"
                      className="flex-1 font-bebas uppercase tracking-wider text-xs py-2 text-[#FF3A2D] hover:bg-[#FF3A2D]/10 hover:border-[#FF3A2D]/20"
                    >
                      Reject Request
                    </Button>
                  </div>
                </div>
              )}

              {!isEditingProfile ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-[#666666]">
                    <div>
                      <span className="block uppercase text-[10px]">Experience Level</span>
                      <span className="text-[#F5F5F5] mt-1 block capitalize">{selectedClient.fitness_level}</span>
                    </div>
                    <div>
                      <span className="block uppercase text-[10px]">Subscription Plan</span>
                      <span className="text-[#F5F5F5] mt-1 block">
                        {selectedClient.plan_duration ? `${selectedClient.plan_duration} Months` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="block uppercase text-[10px]">Enroll Date</span>
                      <span className="text-[#F5F5F5] mt-1 block">
                        {selectedClient.updated_at ? new Date(selectedClient.updated_at).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block uppercase text-[10px]">Phone Number</span>
                      <span className="text-[#F5F5F5] mt-1 block">{selectedClient.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#1F1F1F] pt-4 flex gap-3">
                    <Button 
                      onClick={() => setIsEditingProfile(true)}
                      variant="primary" 
                      className="flex-1 font-bebas uppercase tracking-wider text-xs py-2"
                    >
                      <Edit3 size={14} className="mr-1.5" /> Edit Profile
                    </Button>
                    <Button 
                      onClick={() => handleDeleteClient(selectedClient.id, selectedClient.full_name)}
                      variant="outline" 
                      className="font-bebas uppercase tracking-wider text-xs py-2 text-[#FF3A2D] hover:bg-[#FF3A2D]/10 hover:border-[#FF3A2D]/20"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#666666] uppercase">Full Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#666666] uppercase">Phone</label>
                    <input 
                      type="text" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#666666] uppercase">Fitness Level</label>
                      <select 
                        value={editLevel}
                        onChange={(e) => setEditLevel(e.target.value)}
                        className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#666666] uppercase">Subscription Status</label>
                      <select 
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={savingProfile}
                      className="flex-1 font-bebas text-xs uppercase py-2"
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile'}
                    </Button>
                    <Button 
                      onClick={() => setIsEditingProfile(false)} 
                      variant="outline"
                      className="font-bebas text-xs uppercase py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Custom Workout & Diet Plans Injector */}
            <Card className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-2">
                <div>
                  <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide uppercase">Customized Plans</h3>
                  <span className="text-[9px] text-[#666666] font-semibold uppercase tracking-wider block">These plans will override standard plans in their client portal</span>
                </div>
                <Button 
                  onClick={handleSavePlans} 
                  disabled={savingPlans}
                  className="font-bebas uppercase tracking-wider text-xs py-1.5 px-4"
                >
                  <Save size={14} className="mr-1" /> {savingPlans ? 'Saving...' : 'Save Plans'}
                </Button>
              </div>

              {/* Workout Plan Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#E8FF00] uppercase tracking-wider">
                  <Dumbbell size={14} />
                  <span>Custom Workout Plan</span>
                </div>
                <textarea
                  value={workoutPlanText}
                  onChange={(e) => setWorkoutPlanText(e.target.value)}
                  placeholder={"Flat dumbbell press 3 6:8 1\nLat pull down 3 8:10 1\nShoulder press 2 8:10 1"}
                  className="w-full h-32 bg-[#161616] border border-[#1F1F1F] rounded-lg p-3 text-xs text-[#F5F5F5] placeholder-[#444444] outline-none focus:border-[#E8FF00]/40 transition-colors"
                />
                {/* Live workout preview */}
                {workoutPlanText.trim() && (() => {
                  const wp = parseWorkoutPlan({ text: workoutPlanText })
                  if (!wp || !wp.exercises?.length) return null
                  return (
                    <div className="rounded-lg border border-[#E8FF00]/10 bg-[#0A0A0A] p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                      <span className="text-[8px] font-bold text-[#E8FF00] uppercase tracking-widest block">LIVE PREVIEW — {wp.exercises.length} EXERCISES</span>
                      {wp.exercises.slice(0, 6).map((ex, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-[#111111] border border-[#1A1A1A]">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${ex.dotColor || 'bg-[#E8FF00]'}`} />
                            <span className="text-[10px] text-[#EAEAEA] font-semibold truncate max-w-[140px]">{ex.name}</span>
                          </div>
                          <span className="text-[8px] font-bold text-[#555] uppercase">{ex.sets}×{ex.reps}</span>
                        </div>
                      ))}
                      {wp.exercises.length > 6 && <span className="text-[8px] text-[#555] font-bold">+{wp.exercises.length - 6} more...</span>}
                    </div>
                  )
                })()}
              </div>

              {/* Diet Plan Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4DA6FF] uppercase tracking-wider">
                  <Apple size={14} />
                  <span>Custom Diet & Nutrition Plan</span>
                </div>
                <textarea
                  value={nutritionPlanText}
                  onChange={(e) => setNutritionPlanText(e.target.value)}
                  placeholder={"Daily Targets:\nCalories: 2500 kcal | Protein: 180g | Carbs: 250g | Fat: 70g\n\nMEAL 1: Breakfast (7:00 AM)\n• Oats — 70g\n• Whey Protein — 1 Scoop"}
                  className="w-full h-32 bg-[#161616] border border-[#1F1F1F] rounded-lg p-3 text-xs text-[#F5F5F5] placeholder-[#444444] outline-none focus:border-[#4DA6FF]/40 transition-colors"
                />
                {/* Live nutrition preview */}
                {nutritionPlanText.trim() && (() => {
                  const np = parseNutritionPlan({ text: nutritionPlanText })
                  if (!np) return null
                  return (
                    <div className="rounded-lg border border-[#4DA6FF]/10 bg-[#0A0A0A] p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                      <span className="text-[8px] font-bold text-[#4DA6FF] uppercase tracking-widest block">LIVE PREVIEW</span>
                      <div className="flex gap-2 text-[9px] font-bold">
                        <span className="text-[#F5F5F5]">{np.calories} kcal</span>
                        <span className="text-[#FF3A2D]">P:{np.macros?.protein || 0}g</span>
                        <span className="text-[#4DA6FF]">C:{np.macros?.carbs || 0}g</span>
                        <span className="text-[#34D399]">F:{np.macros?.fat || 0}g</span>
                      </div>
                      {np.meals?.slice(0, 3).map((meal, i) => (
                        <div key={i} className="px-2 py-1 rounded bg-[#111111] border border-[#1A1A1A]">
                          <span className="text-[10px] text-[#4DA6FF] font-bold uppercase">{meal.name}</span>
                          {meal.foods?.length > 0 && (
                            <div className="pl-2 mt-0.5 space-y-0.5 border-l border-[#1F1F1F]">
                              {meal.foods.map((f, fi) => (
                                <div key={fi} className="flex justify-between text-[9px] text-[#AAA]">
                                  <span>• {f.name}</span>
                                  <span className="text-[#666]">{f.qty}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageClients
