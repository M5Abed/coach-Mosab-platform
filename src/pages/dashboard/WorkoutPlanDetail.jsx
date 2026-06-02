import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ChevronDown, ChevronUp, CheckCircle2, ArrowLeft } from 'lucide-react'

export function WorkoutPlanDetail() {
  const { planId } = useParams()
  const navigate = useNavigate()
  
  // State for expanded weeks accordion
  const [expandedWeeks, setExpandedWeeks] = useState({
    'week-1': true,
    'week-2': false,
    'week-3': false,
    'week-4': false
  })

  const toggleWeek = (weekId) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekId]: !prev[weekId]
    }))
  }

  const weeks = [
    {
      id: 'week-1',
      title: 'Week 1 - Acclimatization & Linear Loads',
      completed: true,
      days: [
        { id: 'day-1', name: 'Day 1 — Pull (Lats & Biceps Focus)', exercises: 6, duration: '55m', completed: true },
        { id: 'day-2', name: 'Day 2 — Push (Chest & Shoulders Focus)', exercises: 5, duration: '50m', completed: true },
        { id: 'day-3', name: 'Day 3 — Legs (Quads & Calves)', exercises: 5, duration: '60m', completed: false }
      ]
    },
    {
      id: 'week-2',
      title: 'Week 2 - Mechanical Exhaustion & Dropsets',
      completed: false,
      days: [
        { id: 'day-4', name: 'Day 1 — Pull (Traps & Midback Focus)', exercises: 6, duration: '55m', completed: false },
        { id: 'day-5', name: 'Day 2 — Push (Triceps & Upper Chest Focus)', exercises: 6, duration: '50m', completed: false },
        { id: 'day-6', name: 'Day 3 — Legs (Glutes & Hamstrings)', exercises: 5, duration: '60m', completed: false }
      ]
    },
    {
      id: 'week-3',
      title: 'Week 3 - Peak Intensitycompound Progressions',
      completed: false,
      days: [
        { id: 'day-7', name: 'Day 1 — Pull Intensity', exercises: 6, duration: '60m', completed: false },
        { id: 'day-8', name: 'Day 2 — Push Intensity', exercises: 6, duration: '55m', completed: false },
        { id: 'day-9', name: 'Day 3 — Leg Exertion', exercises: 6, duration: '65m', completed: false }
      ]
    }
  ]

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Top Navigation */}
      <div>
        <Link 
          to="/dashboard/workouts" 
          className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#F5F5F5] font-bold uppercase transition-colors outline-none cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Plans
        </Link>
      </div>

      {/* Hero Banner card */}
      <Card className="border-l-4 border-l-[#E8FF00] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] tracking-wide uppercase">
              FOUNDATION STRENGTH SHRED
            </h1>
            <p className="text-xs text-[#666666] font-bold uppercase tracking-widest">
              8 Weeks · 3 days per week · Beginner
            </p>
          </div>
          <Badge variant="beginner">Beginner</Badge>
        </div>

        <p className="text-sm text-[#666666] leading-relaxed italic border-t border-[#1F1F1F] pt-4">
          💬 "Coach Mosab's Tip: Pay close attention to warmups. Focus on the mind-muscle connection during the concentric phases. Keep hydrated."
        </p>
      </Card>

      {/* Week accordion list */}
      <div className="space-y-4">
        <h3 className="font-bebas text-xl text-[#F5F5F5] uppercase tracking-wider">Weekly Schedules</h3>

        {weeks.map((week) => (
          <div key={week.id} className="border border-[#1F1F1F] rounded-xl bg-[#111111] overflow-hidden">
            {/* Header toggle */}
            <div 
              onClick={() => toggleWeek(week.id)}
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-center gap-3">
                {week.completed ? (
                  <CheckCircle2 className="text-[#34D399]" size={20} />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#1F1F1F]" />
                )}
                <span className="font-bebas text-xl text-[#F5F5F5] tracking-wide">{week.title}</span>
              </div>
              
              <div className="flex items-center gap-4">
                {week.completed && <Badge variant="active" className="scale-90">Completed</Badge>}
                {expandedWeeks[week.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {/* Expands list of days */}
            {expandedWeeks[week.id] && (
              <div className="border-t border-[#1F1F1F] p-4 bg-[#0A0A0A]/50 space-y-3">
                {week.days.map((day) => (
                  <div 
                    key={day.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#161616] border border-[#1F1F1F] rounded-lg hover:border-[#E8FF00]/25 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {day.completed && <CheckCircle2 className="text-[#34D399]" size={16} />}
                        <span className="font-bebas text-lg text-[#F5F5F5] tracking-wide">{day.name}</span>
                      </div>
                      <p className="text-xs text-[#666666] font-semibold uppercase">
                        {day.exercises} Exercises · Estimated Time: {day.duration}
                      </p>
                    </div>

                    <Button 
                      onClick={() => navigate(`/dashboard/workouts/${planId}/${day.id}`)}
                      variant={day.completed ? 'secondary' : 'outline'}
                      size="sm"
                      className="font-bebas uppercase tracking-wider text-xs px-4"
                    >
                      {day.completed ? 'REVIEW WORKOUT' : 'START DAY'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WorkoutPlanDetail
