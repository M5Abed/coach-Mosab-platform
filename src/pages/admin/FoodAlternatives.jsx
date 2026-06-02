import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { toast } from '../../store/toastStore'
import { Plus, Trash2, Save, ArrowLeftRight, Beef, Wheat, Droplets, X } from 'lucide-react'

const CATEGORIES = [
  { key: 'Protein', icon: Beef, color: '#FF3A2D' },
  { key: 'Carbs', icon: Wheat, color: '#4DA6FF' },
  { key: 'Fats', icon: Droplets, color: '#34D399' },
]

export function FoodAlternatives() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Protein')

  // New item form
  const [newFood, setNewFood] = useState('')
  const [newAlts, setNewAlts] = useState([''])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('food_alternatives')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) toast.error('Failed to load alternatives')
    else setItems(data || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newFood.trim()) return toast.error('Enter the original food name.')
    const validAlts = newAlts.filter(a => a.trim())
    if (validAlts.length === 0) return toast.error('Add at least one alternative.')
    setSaving(true)
    const maxSort = items.length > 0 ? Math.max(...items.map(i => i.sort_order || 0)) + 1 : 1
    const { data, error } = await supabase
      .from('food_alternatives')
      .insert({ category: activeCategory, original_food: newFood.trim(), alternatives: validAlts, sort_order: maxSort })
      .select()
    if (error) toast.error('Failed to save.')
    else {
      toast.success('Alternative added!')
      setItems(prev => [...prev, data[0]])
      setNewFood('')
      setNewAlts([''])
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('food_alternatives').delete().eq('id', id)
    if (error) toast.error('Failed to delete.')
    else {
      toast.success('Removed.')
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  const filteredItems = items.filter(i => i.category === activeCategory)
  const catMeta = CATEGORIES.find(c => c.key === activeCategory)

  return (
    <div className="space-y-6 font-dmsans animate-fade-in">
      {/* Header */}
      <div className="border-b border-[#1F1F1F] pb-4">
        <h1 className="font-bebas text-4xl text-[#F5F5F5] uppercase tracking-wide">Food Alternatives</h1>
        <p className="text-sm text-[#666] font-semibold uppercase tracking-wider mt-0.5">
          Global reference — visible to all subscribers on their Nutrition page
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bebas text-sm tracking-wide uppercase transition-all cursor-pointer outline-none ${
              activeCategory === cat.key
                ? 'text-black'
                : 'bg-[#0A0A0A] border border-[#1F1F1F] text-[#666] hover:text-[#F5F5F5]'
            }`}
            style={activeCategory === cat.key ? { backgroundColor: cat.color } : {}}>
            <cat.icon size={14} />
            {cat.key}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-[#555] text-sm font-semibold">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <Card className="py-10 text-center">
              <ArrowLeftRight size={28} className="mx-auto mb-2" style={{ color: catMeta?.color }} />
              <p className="text-sm text-[#666] font-semibold">No {activeCategory.toLowerCase()} alternatives yet. Add one →</p>
            </Card>
          ) : (
            filteredItems.map(item => (
              <Card key={item.id} className="p-0 overflow-hidden border border-[#1F1F1F] hover:border-[#2A2A2A] transition-all group">
                <div className="flex items-stretch">
                  {/* Original food */}
                  <div className="flex items-center gap-2.5 px-4 py-3 min-w-[160px] border-r border-[#1F1F1F]"
                    style={{ borderLeft: `3px solid ${catMeta?.color}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${catMeta?.color}12`, border: `1px solid ${catMeta?.color}25` }}>
                      {catMeta && <catMeta.icon size={14} style={{ color: catMeta.color }} />}
                    </div>
                    <span className="font-bebas text-base text-[#F5F5F5] tracking-wide leading-tight">{item.original_food}</span>
                  </div>
                  {/* Alternatives */}
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 flex-wrap">
                    <ArrowLeftRight size={12} className="text-[#444] shrink-0" />
                    {item.alternatives.map((alt, i) => (
                      <Badge key={i} className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2"
                        style={{ backgroundColor: `${catMeta?.color}12`, color: catMeta?.color, border: `1px solid ${catMeta?.color}25` }}>
                        {alt}
                      </Badge>
                    ))}
                  </div>
                  {/* Delete */}
                  <button onClick={() => handleDelete(item.id)}
                    className="px-3 text-[#333] hover:text-[#FF3A2D] hover:bg-[#FF3A2D]/5 transition-all cursor-pointer outline-none opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Add new */}
        <Card className="h-fit space-y-4 sticky top-4">
          <h3 className="font-bebas text-lg tracking-wide uppercase" style={{ color: catMeta?.color }}>
            Add {activeCategory} Alternative
          </h3>

          <div className="space-y-1.5">
            <label className="text-[9px] text-[#666] font-bold uppercase tracking-wider block">Original Food</label>
            <input type="text" value={newFood} onChange={(e) => setNewFood(e.target.value)}
              placeholder="e.g. Chicken Breast"
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-2 px-3 text-xs text-[#F5F5F5] placeholder-[#444] outline-none focus:border-[#333]" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-[#666] font-bold uppercase tracking-wider block">Alternatives</label>
            <div className="space-y-1.5">
              {newAlts.map((alt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input type="text" value={alt} onChange={(e) => {
                    const copy = [...newAlts]; copy[i] = e.target.value; setNewAlts(copy)
                  }} placeholder={`Alternative ${i + 1}`}
                    className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-1.5 px-3 text-xs text-[#F5F5F5] placeholder-[#444] outline-none" />
                  {newAlts.length > 1 && (
                    <button onClick={() => setNewAlts(prev => prev.filter((_, fi) => fi !== i))}
                      className="text-[#444] hover:text-[#FF3A2D] cursor-pointer outline-none"><X size={12} /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setNewAlts(prev => [...prev, ''])}
                className="text-[9px] font-bold uppercase tracking-wider cursor-pointer outline-none hover:text-[#F5F5F5] transition-colors"
                style={{ color: catMeta?.color }}>
                + Add Another
              </button>
            </div>
          </div>

          <Button onClick={handleAdd} disabled={saving} className="w-full font-bebas uppercase tracking-wider text-sm py-2.5">
            <Save size={14} className="mr-1.5" /> {saving ? 'Saving...' : 'Save Alternative'}
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default FoodAlternatives
