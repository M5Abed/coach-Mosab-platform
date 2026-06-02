import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { Dumbbell, Calendar, Clock, Zap, Target, GripVertical, Activity, Play } from 'lucide-react'
import { parseWorkoutPlan } from '../../utils/planParser'

/* ── Stat pill ─────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 bg-[#0A0A0A] rounded-xl p-4 border border-[#1F1F1F] hover:border-[#2F2F2F] hover:bg-[#111111] transition-all duration-300">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{label}</p>
        <p className="font-bebas text-lg text-[#F5F5F5] tracking-wide leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  )
}

/* ── Exercise card ─────────────────────────────────────────── */
function ExerciseCard({ exercise, index }) {
  if (!exercise) return null
  const difficultyMap = {
    easy: { variant: 'beginner', color: '#34D399' },
    medium: { variant: 'pending', color: '#FF8C00' },
    hard: { variant: 'advanced', color: '#FF3A2D' },
  }
  const diffStr = String(exercise.difficulty || 'medium').toLowerCase()
  const diff = difficultyMap[diffStr] || difficultyMap.medium

  return (
    <Card className="p-0 overflow-hidden border border-[#1F1F1F] hover:border-[#2F2F2F] transition-all duration-300 group hover:translate-x-1">
      <div className="flex items-stretch">
        {/* Numbered index strip */}
        <div
          className="w-14 flex flex-col items-center justify-center shrink-0 transition-colors group-hover:bg-[#E8FF00]/5"
          style={{ backgroundColor: `${diff.color}08`, borderRight: `1px solid ${diff.color}20` }}
        >
          <span className="font-bebas text-2xl tracking-wide group-hover:scale-110 transition-transform" style={{ color: diff.color }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Exercise details */}
        <div className="flex-1 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <GripVertical className="text-[#333333] shrink-0" size={16} />
            <div className="min-w-0">
              <h4 className="font-bebas text-lg text-[#F5F5F5] tracking-wide truncate leading-tight group-hover:text-[#E8FF00] transition-colors">
                {exercise.name || 'Exercise'}
              </h4>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <Target size={11} className="text-[#E8FF00]" />
                  <span className="text-[11px] font-bold text-[#888888]">
                    {exercise.sets || 3} Sets × {exercise.reps || 10} Reps
                  </span>
                </div>
                {exercise.rest && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-[#4DA6FF]" />
                    <span className="text-[11px] font-bold text-[#888888]">
                      Rest: {exercise.rest}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Badge variant={diff.variant}>{exercise.difficulty || 'Medium'}</Badge>
        </div>
      </div>
    </Card>
  )
}

/* ══ Main Workouts Page ═══════════════════════════════════════ */
export function Workouts() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const rawPlan = user?.workout_plan
  const plan = useMemo(() => parseWorkoutPlan(rawPlan), [rawPlan])

  // Check for structured data vs nothing
  const hasStructuredData = plan && Array.isArray(plan.exercises) && plan.exercises.length > 0

  return (
    <div className="space-y-6 font-dmsans select-none animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            MY WORKOUT PLAN
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            Your personalized training routines from Coach Mosab.
          </p>
        </div>
        {plan && (
          <Badge variant="accent" className="font-bebas uppercase tracking-wider text-xs">ACTIVE CUSTOM PLAN</Badge>
        )}
      </div>

      {hasStructuredData ? (
        <>
          {/* ── Plan overview stats ── */}
          <Card className="bg-[#111111] border border-[#1F1F1F] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#E8FF00]/3 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8FF00]/10 border border-[#E8FF00]/20 flex items-center justify-center text-[#E8FF00]">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="font-bebas text-xl text-[#F5F5F5] tracking-wide uppercase">
                    {plan.title || 'CUSTOM TRAINING PROGRAM'}
                  </h2>
                  <p className="text-[10px] text-[#666666] font-bold uppercase tracking-wider">
                    Built by Coach Mosab
                  </p>
                </div>
              </div>

              <Button
                onClick={() => navigate('/dashboard/workouts/active/today')}
                className="font-bebas uppercase tracking-wider text-sm py-2.5 px-6 shadow-md shadow-[#E8FF00]/5 hover:shadow-[#E8FF00]/15 transition-all duration-300 flex items-center gap-1.5"
              >
                <Play size={14} fill="currentColor" /> Start Workout Session
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatPill
                icon={Zap}
                label="Level"
                value={(plan.level || 'Custom').toUpperCase()}
                color="#E8FF00"
              />
              <StatPill
                icon={Calendar}
                label="Duration"
                value={plan.duration || 'Ongoing'}
                color="#4DA6FF"
              />
              <StatPill
                icon={Dumbbell}
                label="Exercises"
                value={Array.isArray(plan.exercises) ? plan.exercises.length : 0}
                color="#A78BFA"
              />
              <StatPill
                icon={Clock}
                label="Days / Week"
                value={plan.daysPerWeek || '—'}
                color="#34D399"
              />
            </div>
          </Card>

          {/* ── Exercise list ── */}
          {plan.exercises && Array.isArray(plan.exercises) && plan.exercises.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide uppercase">
                EXERCISE LINEUP ({plan.exercises.length})
              </h3>
              <div className="space-y-3">
                {plan.exercises.map((ex, idx) => (
                  <ExerciseCard key={ex.id || idx} exercise={ex} index={idx} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* No Plan Assigned */
        <Card className="border border-[#1F1F1F] bg-[#111111] p-8 text-center space-y-4 max-w-xl mx-auto mt-8 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-[#1F1F1F] flex items-center justify-center text-[#666666] mx-auto border border-[#2F2F2F]">
            <Dumbbell size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bebas text-2xl text-[#F5F5F5] tracking-wide uppercase">
              NO WORKOUT PLAN ASSIGNED
            </h3>
            <p className="text-xs text-[#666666] font-semibold max-w-sm mx-auto leading-relaxed">
              Coach Mosab is currently analyzing your level and details. Your personalized training routine will appear here once it is assigned!
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default Workouts;
