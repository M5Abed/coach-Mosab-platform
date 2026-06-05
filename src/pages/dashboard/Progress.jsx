import React, { useState, useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { toast } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { getUserStats } from '../../utils/userStats'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, Flame, Plus, Scale, Dumbbell, Calendar, Upload, ZoomIn } from 'lucide-react'

export function Progress() {
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [zoomedPhoto, setZoomedPhoto] = useState(null)
  
  const user = useAuthStore((state) => state.user)
  const stats = useMemo(() => getUserStats(user?.id), [user?.id])

  const checkInsKey = `coach_mosab_checkins_${user?.id}`
  const pbsKey = `coach_mosab_pbs_${user?.id}`

  // Dynamically load check-ins
  const [checkIns, setCheckIns] = useState(() => {
    const saved = localStorage.getItem(checkInsKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return []
  })

  // Dynamically load personal bests
  const [personalBests, setPersonalBests] = useState(() => {
    const saved = localStorage.getItem(pbsKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return []
  })

  // Check-in & optional PR input states
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState(null)
  const [prExercise, setPrExercise] = useState('')
  const [prLoad, setPrLoad] = useState('')
  const [prReps, setPrReps] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Chronologically sorted weight tracking chart data
  const weightData = useMemo(() => {
    return [...checkIns]
      .reverse()
      .map(c => ({
        date: new Date(c.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        weight: c.weight
      }))
  }, [checkIns])

  // Real weight shed calculator
  const weightShedText = useMemo(() => {
    if (checkIns.length < 2) return '0.0 kg'
    const initialWeight = checkIns[checkIns.length - 1].weight
    const currentWeight = checkIns[0].weight
    const diff = (currentWeight - initialWeight).toFixed(1)
    return diff <= 0 ? `${diff} kg` : `+${diff} kg`
  }, [checkIns])

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) setPhoto(file)
  }

  const handleCheckInSubmit = (e) => {
    e.preventDefault()
    if (!weight) {
      toast.error('Please input your current weight.')
      return
    }

    setSubmitting(true)

    // Duplicate guard: prevent multiple check-ins on the same day
    const todayStr = (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}` })()
    if (checkIns.some(c => c.date === todayStr)) {
      toast.error('You have already submitted a check-in today.')
      setSubmitting(false)
      return
    }

    setTimeout(() => {
      const newCheckIn = {
        id: Date.now(),
        date: (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}` })(),
        weight: parseFloat(weight),
        notes,
        photoUrl: photo ? URL.createObjectURL(photo) : null
      }

      const updatedCheckIns = [newCheckIn, ...checkIns]
      setCheckIns(updatedCheckIns)
      localStorage.setItem(checkInsKey, JSON.stringify(updatedCheckIns))

      // Check and add personal best if specified
      if (prExercise && prLoad && prReps) {
        const newPr = {
          exercise: prExercise.trim(),
          load: `${prLoad} kg`,
          reps: parseInt(prReps) || 5,
          date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        }
        const updatedPbs = [newPr, ...personalBests]
        setPersonalBests(updatedPbs)
        localStorage.setItem(pbsKey, JSON.stringify(updatedPbs))
      }

      setShowCheckInModal(false)
      setWeight('')
      setNotes('')
      setPhoto(null)
      setPrExercise('')
      setPrLoad('')
      setPrReps('')
      setSubmitting(false)
      toast.success('Check-in log updated successfully!')
    }, 1500)
  }

  // Calendar Heatmap: Past 84 days (12 weeks)
  const heatmapDays = useMemo(() => {
    const list = []
    const today = new Date()
    for (let i = 83; i >= 0; i--) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dateStr = (() => { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
      const isActive = stats.completedDates.includes(dateStr)
      list.push({
        active: isActive,
        level: isActive ? 3 : 0,
        date: dateStr
      })
    }
    return list
  }, [stats.completedDates])

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            PROGRESS & CHECK-INS
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            Track weight, muscle achievements, and log check-ins.
          </p>
        </div>
        <Button onClick={() => setShowCheckInModal(true)} className="font-bebas uppercase tracking-wider text-sm py-2 px-5">
          <Plus size={16} className="mr-1.5" /> Add Check-In
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#E8FF00]/10 text-[#E8FF00] border border-[#E8FF00]/25">
            <Scale size={24} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">Total Weight Shed</span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">{weightShedText}</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/25">
            <Flame size={24} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">Active Streak</span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">{stats.streak} Days</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#4DA6FF]/10 text-[#4DA6FF] border border-[#4DA6FF]/25">
            <Dumbbell size={24} />
          </div>
          <div>
            <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider block">PRs Established</span>
            <span className="font-bebas text-2xl text-[#F5F5F5]">{personalBests.length} {personalBests.length === 1 ? 'record' : 'records'}</span>
          </div>
        </Card>
      </div>

      {/* Main Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Weight Line Chart */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">WEIGHT TRACKING HISTORY (KG)</h3>
            {weightData.length > 0 ? (
              <div className="h-64 md:h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                    <XAxis dataKey="date" stroke="#666666" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#666666" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ bg: '#161616', borderColor: '#1F1F1F', borderRadius: 8 }}
                      labelStyle={{ color: '#E8FF00', fontWeight: 'bold', fontFamily: 'Bebas Neue' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#E8FF00" 
                      strokeWidth={3}
                      dot={{ fill: '#E8FF00', stroke: '#0A0A0A', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 md:h-72 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1F1F1F] rounded-xl bg-[#111111]/20 space-y-2">
                <Scale size={32} className="text-[#666666] animate-pulse" />
                <p className="text-xs text-[#888888] font-bold uppercase tracking-wider">No weight data available</p>
                <p className="text-xs text-[#666666] font-semibold max-w-xs leading-relaxed">
                  Start by adding your very first weekly check-in log above to begin plotting your visual weight progression graph dynamically!
                </p>
              </div>
            )}
          </Card>

          {/* Streak Heatmap mockup */}
          <Card className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">STREAK TRACK HEATMAP</h3>
              <span className="text-[10px] text-[#666666] font-bold">PAST 12 WEEKS ACTIVITY</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {heatmapDays.map((day, idx) => (
                <div 
                  key={idx}
                  className={`w-4 h-4 rounded-sm transition-colors border border-[#0A0A0A]/40 ${
                    day.active 
                      ? day.level === 3 
                        ? 'bg-[#E8FF00]' 
                        : 'bg-[#E8FF00]/50'
                      : 'bg-[#161616] border-[#1F1F1F]'
                  }`}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Personal Bests */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">PERSONAL BEST RECORDS</h3>
            {personalBests.length > 0 ? (
              <div className="space-y-3">
                {personalBests.map((pb, idx) => (
                  <div key={idx} className="p-3 bg-[#111111]/85 border border-[#1F1F1F] rounded-lg flex justify-between items-center hover:border-[#4DA6FF]/35 transition-all duration-300">
                    <div>
                      <span className="text-xs font-bold text-[#F5F5F5] block">{pb.exercise}</span>
                      <span className="text-[10px] text-[#666666]">Logged: {pb.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bebas text-lg text-[#E8FF00] tracking-wide block">{pb.load}</span>
                      <span className="text-[9px] text-[#666666] font-bold uppercase">{pb.reps} reps</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1F1F1F] rounded-xl bg-[#111111]/20 space-y-2 min-h-[180px]">
                <Dumbbell size={24} className="text-[#666666] animate-pulse" />
                <p className="text-xs text-[#888888] font-bold uppercase tracking-wider">No PRs recorded yet</p>
                <p className="text-xs text-[#666666] font-semibold max-w-[200px] leading-relaxed">
                  Log your lifting records inside the check-in modal to celebrate your strength milestones!
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Check-in Log Timeline */}
      <div className="space-y-4">
        <h3 className="font-bebas text-2xl text-[#F5F5F5] uppercase tracking-wider">Check-In Timeline Logs</h3>
        
        {checkIns.length > 0 ? (
          <div className="space-y-4">
            {checkIns.map((log) => (
              <Card key={log.id} className="p-5 flex flex-col md:flex-row gap-5 items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3.5 border-b border-[#1F1F1F]/60 pb-2">
                    <span className="font-bebas text-[#E8FF00] text-lg flex items-center gap-1"><Scale size={16} /> {log.weight} kg</span>
                    <span className="text-xs text-[#666666] font-bold uppercase flex items-center gap-1"><Calendar size={14} /> {log.date}</span>
                  </div>
                  <p className="text-xs text-[#666666] leading-relaxed font-semibold">
                    {log.notes}
                  </p>
                </div>

                {log.photoUrl && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#1F1F1F] group shrink-0 self-center sm:self-start">
                    <img src={log.photoUrl} alt="Check-in" className="w-full h-full object-cover blur-[1.5px] group-hover:blur-0 transition-all duration-300" />
                    <div 
                      onClick={() => setZoomedPhoto(log.photoUrl)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#E8FF00] transition-opacity cursor-pointer"
                    >
                      <ZoomIn size={18} />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-[#1F1F1F] bg-[#111111]/40 p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[#666666] mx-auto border border-[#2F2F2F]">
              <Calendar size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bebas text-lg text-[#F5F5F5] tracking-wide uppercase">No Check-in Logs Found</h4>
              <p className="text-xs text-[#666666] font-semibold max-w-sm mx-auto leading-relaxed">
                You have not submitted any weekly check-ins yet. Make your first log using the button above to record your current status and progress pictures!
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Add Checkin Modal */}
      <Modal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        title="WEEKLY LOG CHECK-IN"
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Current Weight (KG)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 84.5"
              className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Muscle Status & Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How do you feel? Soreness? Hunger? Sleep details..."
              className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Upload Progress Photo (Optional)</label>
            <div className="border border-dashed border-[#1F1F1F] bg-[#161616] rounded-xl p-6 text-center relative cursor-pointer">
              <input
                type="file"
                onChange={handlePhotoUpload}
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {photo ? (
                <div className="text-xs text-[#34D399] font-bold">✓ {photo.name} uploaded</div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-xs text-[#666666]">
                  <Upload size={24} />
                  <span>Tap to choose file</span>
                </div>
              )}
            </div>
          </div>

          {/* Optional PR Form Section */}
          <div className="border-t border-[#1F1F1F] pt-4 mt-2 space-y-3">
            <span className="text-[10px] font-bold text-[#E8FF00] uppercase tracking-wider block">Record a Personal Best (Optional)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider block">Exercise</label>
                <input
                  type="text"
                  value={prExercise}
                  onChange={(e) => setPrExercise(e.target.value)}
                  placeholder="e.g. Bench Press"
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-xs text-[#F5F5F5] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider block">Load (KG)</label>
                <input
                  type="number"
                  value={prLoad}
                  onChange={(e) => setPrLoad(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-xs text-[#F5F5F5] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider block">Reps</label>
                <input
                  type="number"
                  value={prReps}
                  onChange={(e) => setPrReps(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-xs text-[#F5F5F5] outline-none"
                />
              </div>
            </div>
          </div>

          <Button type="submit" loading={submitting} className="w-full font-bebas uppercase tracking-wider text-base py-3">
            SUBMIT CHECK-IN
          </Button>
        </form>
      </Modal>

      {/* Image Preview Zoom modal */}
      <Modal
        isOpen={!!zoomedPhoto}
        onClose={() => setZoomedPhoto(null)}
        title="PROGRESS PHOTO PREVIEW"
      >
        <div className="flex items-center justify-center">
          <img src={zoomedPhoto} alt="Zoomed progress" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
        </div>
      </Modal>
    </div>
  )
}

export default Progress
