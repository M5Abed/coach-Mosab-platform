import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { toast } from '../../store/toastStore'
import { Plus, Trash2, GripVertical, Save, Dumbbell, RefreshCw } from 'lucide-react'

export function WorkoutBuilder() {
  const [clientsList, setClientsList] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loadingClients, setLoadingClients] = useState(true)

  const [title, setTitle] = useState('FOUNDATION STRENGTH SHRED')
  const [level, setLevel] = useState('beginner')
  const [duration, setDuration] = useState('8 Weeks')
  const [daysPerWeek, setDaysPerWeek] = useState(3)

  // Current exercises list
  const [exercises, setExercises] = useState([
    { id: 1, name: 'Barbell Flat Bench Press', sets: 4, reps: '8-10', rest: '90s', difficulty: 'Hard', day: 1 },
    { id: 2, name: 'Incline Dumbbell Flyes', sets: 3, reps: '12', rest: '75s', difficulty: 'Medium', day: 1 }
  ])

  // New exercise inputs
  const [exName, setExName] = useState('')
  const [exSets, setExSets] = useState(4)
  const [exReps, setExReps] = useState('10')
  const [exRest, setExRest] = useState('90s')
  const [exDifficulty, setExDifficulty] = useState('Medium')
  const [exDay, setExDay] = useState(1)

  useEffect(() => {
    if (exDay > daysPerWeek) {
      setExDay(1)
    }
  }, [daysPerWeek, exDay])

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'subscriber')
        if (error) throw error
        if (data) {
          setClientsList(data)
          if (data.length > 0) {
            setSelectedClientId(data[0].id)
          }
        }
      } catch (err) {
        toast.error('Failed to load subscribers: ' + err.message)
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  const handleAddExercise = (e) => {
    e.preventDefault()
    if (!exName) {
      toast.error('Please enter the exercise name.')
      return
    }

    const newEx = {
      id: Date.now(),
      name: exName,
      sets: exSets,
      reps: exReps,
      rest: exRest,
      difficulty: exDifficulty,
      day: exDay
    }

    setExercises([...exercises, newEx])
    setExName('')
    toast.success('Exercise added to list.')
  }

  const handleDeleteExercise = (id) => {
    setExercises(prev => prev.filter(ex => ex.id !== id))
  }

  const handleSave = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client to assign this plan.')
      return
    }
    if (!title) {
      toast.error('Please enter a Plan Title.')
      return
    }

    // Format training routine and exercises beautifully grouped by day
    let formattedText = `TRAINING PROGRAM: ${title.toUpperCase()}\n🏋️ Level: ${level.toUpperCase()} | 📅 Duration: ${duration} | 💪 Schedule: ${daysPerWeek} Days/Week\n\nEXERCISES IN PROGRAM:\n`

    if (exercises.length === 0) {
      formattedText += `\n• No exercises added to list yet.`
    } else {
      for (let dayNum = 1; dayNum <= daysPerWeek; dayNum++) {
        const dayExercises = exercises.filter(ex => (ex.day || 1) === dayNum)
        formattedText += `\nDAY ${dayNum}:\n`
        if (dayExercises.length === 0) {
          formattedText += `   • No exercises scheduled for this day\n`
        } else {
          dayExercises.forEach((ex, idx) => {
            formattedText += `   ${idx + 1}. ${ex.name.toUpperCase()}\n`
            formattedText += `      • ${ex.sets} Sets x ${ex.reps} Reps | Rest: ${ex.rest} | Intensity: ${ex.difficulty}\n`
          })
        }
      }
    }

    try {
      const workoutPlanData = {
        text: formattedText,
        title: title,
        level: level,
        duration: duration,
        daysPerWeek: Number(daysPerWeek),
        exercises: exercises
      }

      const { error } = await supabase
        .from('profiles')
        .update({ workout_plan: workoutPlanData })
        .eq('id', selectedClientId)

      if (error) throw error

      const clientName = clientsList.find(c => c.id === selectedClientId)?.full_name || 'Client'
      toast.success(`Workout plan successfully built and assigned to ${clientName}!`)
    } catch (err) {
      toast.error('Failed to save workout plan: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
            CREATE WORKOUT PLAN
          </h1>
          <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
            Configure weekly schedules, exercises, sets, reps and load types.
          </p>
        </div>
        <Button onClick={handleSave} className="font-bebas uppercase tracking-wider text-sm py-2 px-6">
          <Save size={16} className="mr-1.5" /> Save Workout Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Plan Setup & Exercises stack */}
        <div className="lg:col-span-8 space-y-6">
          {/* Plan Settings */}
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2">PLAN CONFIGURATION</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Target Client</label>
                {loadingClients ? (
                  <div className="flex items-center gap-2 text-xs text-[#666666] py-2.5">
                    <RefreshCw size={12} className="animate-spin" /> Loading...
                  </div>
                ) : (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                  >
                    {clientsList.length === 0 ? (
                      <option value="">No active subscribers</option>
                    ) : (
                      clientsList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name || c.email}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Plan Title</label>
                <input
                  type="text"
                  placeholder="e.g. FOUNDATION STRENGTH SHRED"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Experience Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Duration (Weeks)</label>
                <input
                  type="text"
                  placeholder="e.g. 8 Weeks"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Days Per Week</label>
                <select
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <option key={d} value={d}>{d} Days</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Exercise list order grouped by Day */}
          <div className="space-y-6">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">EXERCISES IN PLAN ({exercises.length})</h3>
            
            {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map((dayNum) => {
              const dayExercises = exercises.filter(ex => (ex.day || 1) === dayNum)
              return (
                <div key={dayNum} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#1F1F1F] pb-1">
                    <span className="font-bebas text-lg text-[#E8FF00] tracking-wider">DAY {dayNum}</span>
                    <span className="text-[10px] text-[#666666] font-bold">({dayExercises.length} Exercises)</span>
                  </div>
                  {dayExercises.length === 0 ? (
                    <p className="text-xs text-[#666666] italic py-1">No exercises added for Day {dayNum} yet.</p>
                  ) : (
                    dayExercises.map((ex) => (
                      <Card key={ex.id} className="p-4 flex items-center justify-between gap-4 bg-[#141414]">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <GripVertical className="text-[#666666] cursor-grab shrink-0" size={18} />
                          <div className="min-w-0">
                            <h4 className="font-bebas text-lg text-[#F5F5F5] tracking-wide truncate">{ex.name}</h4>
                            <div className="flex items-center gap-3 text-[10px] text-[#666666] font-bold uppercase mt-0.5">
                              <span>{ex.sets} Sets · {ex.reps} Reps</span>
                              <span>•</span>
                              <span>Rest: {ex.rest}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant={ex.difficulty.toLowerCase()}>{ex.difficulty}</Badge>
                          <button
                            onClick={() => handleDeleteExercise(ex.id)}
                            className="p-1 rounded hover:bg-[#1C1C1C] text-[#666666] hover:text-[#FF3A2D] transition-colors cursor-pointer outline-none"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Side: Add exercise form */}
        <div className="lg:col-span-4">
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2">ADD EXERCISE</h3>
            
            <form onSubmit={handleAddExercise} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Exercise Name</label>
                <div className="relative">
                  <Dumbbell className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. Overhead Shoulder Press"
                    value={exName}
                    onChange={(e) => setExName(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#F5F5F5] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Sets</label>
                  <input
                    type="number"
                    value={exSets}
                    onChange={(e) => setExSets(Number(e.target.value) || 1)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Reps</label>
                  <input
                    type="text"
                    placeholder="8-10 or 12"
                    value={exReps}
                    onChange={(e) => setExReps(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Rest Suggestion</label>
                  <input
                    type="text"
                    placeholder="90s"
                    value={exRest}
                    onChange={(e) => setExRest(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Difficulty</label>
                  <select
                    value={exDifficulty}
                    onChange={(e) => setExDifficulty(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Target Day</label>
                <select
                  value={exDay}
                  onChange={(e) => setExDay(Number(e.target.value))}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                >
                  {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="outline" className="w-full font-bebas uppercase tracking-wider text-sm py-2.5">
                <Plus size={16} className="mr-1" /> Add to List
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default WorkoutBuilder
