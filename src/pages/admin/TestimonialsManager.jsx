import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useLanguageStore } from '../../store/languageStore'
import { toast } from '../../store/toastStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Trash2, AlertTriangle, Star, Plus, Quote, Pencil } from 'lucide-react'

export default function TestimonialsManager() {
  const { language } = useLanguageStore()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [goalEn, setGoalEn] = useState('')
  const [goalAr, setGoalAr] = useState('')
  const [rating, setRating] = useState(5)
  const [quoteEn, setQuoteEn] = useState('')
  const [quoteAr, setQuoteAr] = useState('')
  const [sortOrder, setSortOrder] = useState('0')

  // Editing state
  const [editingTestimonial, setEditingTestimonial] = useState(null)

  // Deletion modal states
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTestimonials(data || [])
    } catch (err) {
      console.error('Error fetching testimonials:', err)
      toast.error('Failed to load testimonials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTestimonial = async (e) => {
    e.preventDefault()

    if (!nameEn || !nameAr || !goalEn || !goalAr || !quoteEn || !quoteAr) {
      toast.error('Please fill in all the required fields.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name_en: nameEn,
        name_ar: nameAr,
        goal_en: goalEn,
        goal_ar: goalAr,
        rating: parseInt(rating, 10) || 5,
        quote_en: quoteEn,
        quote_ar: quoteAr,
        sort_order: parseInt(sortOrder, 10) || 0
      }

      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(payload)
          .eq('id', editingTestimonial.id)

        if (error) throw error
        toast.success('Testimonial updated successfully!')
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([payload])

        if (error) throw error
        toast.success('Testimonial added successfully!')
      }

      // Reset form
      handleCancelEdit()
      fetchTestimonials()
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Failed to save testimonial: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (item) => {
    setEditingTestimonial(item)
    setNameEn(item.name_en || '')
    setNameAr(item.name_ar || '')
    setGoalEn(item.goal_en || '')
    setGoalAr(item.goal_ar || '')
    setRating(item.rating || 5)
    setQuoteEn(item.quote_en || '')
    setQuoteAr(item.quote_ar || '')
    setSortOrder(String(item.sort_order || 0))
  }

  const handleCancelEdit = () => {
    setEditingTestimonial(null)
    setNameEn('')
    setNameAr('')
    setGoalEn('')
    setGoalAr('')
    setRating(5)
    setQuoteEn('')
    setQuoteAr('')
    setSortOrder('0')
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const id = deleteConfirm

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Testimonial deleted successfully!')
      setDeleteConfirm(null)
      fetchTestimonials()
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete testimonial: ' + err.message)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1F1F1F] pb-6">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] tracking-wide uppercase">
            Testimonials Manager
          </h1>
          <p className="text-sm text-[#666666] font-medium">
            Create and manage client stories, goals, and feedback displayed on the landing page
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Testimonials Grid ── */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="font-bebas text-2xl tracking-wide text-[#F5F5F5] uppercase">
            Published Testimonials ({testimonials.length})
          </h3>

          {loading ? (
            <div className="text-center py-12 text-[#666] font-medium animate-pulse">
              Loading testimonials...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-16 border border-[#1F1F1F] rounded-2xl bg-[#111111]/30 text-[#444] font-bold uppercase tracking-wider text-xs">
              No testimonials published yet
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {testimonials.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-[#111111] border border-[#1F1F1F] hover:border-[#E8FF00]/25 transition-all p-5 flex gap-4 items-start relative overflow-hidden group shadow-lg"
                >
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleEditClick(item)}
                      className="p-1.5 rounded-lg bg-[#E8FF00]/10 hover:bg-[#E8FF00] text-[#E8FF00] hover:text-[#0A0A0A] transition-all cursor-pointer border border-[#E8FF00]/20 hover:border-[#E8FF00]"
                      title="Edit Testimonial"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(item.id)}
                      className="p-1.5 rounded-lg bg-[#FF3A2D]/10 hover:bg-[#FF3A2D] text-[#FF3A2D] hover:text-white transition-all cursor-pointer border border-[#FF3A2D]/20 hover:border-[#FF3A2D]"
                      title="Delete Testimonial"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-[#161616] border border-[#1F1F1F] text-[#E8FF00]/70 shrink-0">
                    <Quote size={20} />
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <h4 className="font-bebas text-lg text-[#F5F5F5] tracking-wide">
                        {item.name_en} / {item.name_ar}
                      </h4>
                      <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 text-[#888] border-[#222]">
                        Sort: {item.sort_order}
                      </Badge>
                    </div>

                    <div className="flex gap-0.5 text-[#E8FF00]">
                      {Array(item.rating || 5).fill(0).map((_, i) => (
                        <Star key={i} size={13} fill="#E8FF00" className="text-[#E8FF00]" />
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium border-t border-[#1F1F1F]/40 pt-2.5">
                      <div className="space-y-1">
                        <span className="text-[#666] font-bold uppercase tracking-wider text-[9px]">Goal (English)</span>
                        <p className="text-[#A0A0A0]">{item.goal_en}</p>
                        <p className="text-[#F5F5F5] italic font-dmsans">"{item.quote_en}"</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-[#666] font-bold uppercase tracking-wider text-[9px] block">الهدف (العربية)</span>
                        <p className="text-[#A0A0A0]">{item.goal_ar}</p>
                        <p className="text-[#F5F5F5] italic font-dmsans">"{item.quote_ar}"</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Form Card ── */}
        <div className="lg:col-span-5">
          <Card className="bg-[#111111] border border-[#1F1F1F] p-6 shadow-xl space-y-6">
            <div>
              <h3 className="font-bebas text-2xl tracking-wide text-[#F5F5F5] uppercase">
                {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
              </h3>
              <p className="text-xs text-[#666666]">
                {editingTestimonial 
                  ? `Modify testimonial for ${editingTestimonial.name_en}` 
                  : 'Add a new bilingual client testimonial review'}
              </p>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Name (English)</label>
                  <input
                    type="text"
                    placeholder="Omar Karem"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">الاسم (العربية)</label>
                  <input
                    type="text"
                    placeholder="عمر كريم"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors text-right"
                    required
                  />
                </div>
              </div>

              {/* Goals */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Goal (English)</label>
                  <input
                    type="text"
                    placeholder="Fat Loss & Muscle Gain"
                    value={goalEn}
                    onChange={(e) => setGoalEn(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">الهدف (العربية)</label>
                  <input
                    type="text"
                    placeholder="خسارة دهون وبناء عضلات"
                    value={goalAr}
                    onChange={(e) => setGoalAr(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors text-right"
                    required
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2 bg-[#161616] border border-[#1F1F1F] rounded-lg p-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-[#E8FF00] hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        size={20}
                        fill={star <= rating ? '#E8FF00' : 'none'}
                        className={star <= rating ? 'text-[#E8FF00]' : 'text-[#444]'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#888] ml-2">({rating} Stars)</span>
                </div>
              </div>

              {/* Quotes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Quote (English)</label>
                <textarea
                  rows={3}
                  placeholder="Coach Mosab completely transformed my physique..."
                  value={quoteEn}
                  onChange={(e) => setQuoteEn(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none resize-none focus:border-[#E8FF00]/40 transition-colors font-sans"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">الرأي (العربية)</label>
                <textarea
                  rows={3}
                  placeholder="الكوتش مصعب غيّر جسمي تماماً في 12 أسبوعاً فقط..."
                  value={quoteAr}
                  onChange={(e) => setQuoteAr(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none resize-none focus:border-[#E8FF00]/40 transition-colors text-right font-sans"
                  required
                />
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors"
                />
              </div>

              <div className="flex gap-3">
                {editingTestimonial && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelEdit} 
                    className="flex-1 font-bebas uppercase tracking-wider text-base py-3"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 font-bebas uppercase tracking-wider text-base py-3"
                >
                  {saving ? 'Saving...' : editingTestimonial ? 'Save Changes' : 'Publish Testimonial'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-sm bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FF3A2D]/10 border border-[#FF3A2D]/25 mx-auto">
              <AlertTriangle size={26} className="text-[#FF3A2D]" />
            </div>

            {/* Text */}
            <div className="text-center space-y-1.5">
              <h3 className="font-bebas text-2xl tracking-wide text-[#F5F5F5] uppercase">
                Remove Testimonial
              </h3>
              <p className="text-sm text-[#888] leading-relaxed">
                Are you sure you want to permanently remove this testimonial?
                <br />
                <span className="text-xs text-[#FF3A2D]/80">This action cannot be undone.</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-sm font-bold text-[#888] hover:text-[#F5F5F5] hover:border-[#444] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#FF3A2D] hover:bg-[#e02d21] text-white text-sm font-bold transition-all cursor-pointer shadow-[0_0_16px_rgba(255,58,45,0.25)]"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
