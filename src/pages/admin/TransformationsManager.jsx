import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../store/toastStore'
import { Plus, Trash2, Calendar, Save, Upload, CheckCircle2, RefreshCw, AlertTriangle, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function AdminTransformationCard({ trans, setDeleteConfirm, onEditClick }) {
  const [activeAngle, setActiveAngle] = useState('front')

  const availableViews = useMemo(() => {
    const views = ['front']
    if (trans.before_side_url || trans.after_side_url) {
      views.push('side')
    }
    if (trans.before_back_url || trans.after_back_url) {
      views.push('back')
    }
    return views
  }, [trans])

  const beforeImage = useMemo(() => {
    if (activeAngle === 'side') return trans.before_side_url || trans.before_image_url
    if (activeAngle === 'back') return trans.before_back_url || trans.before_image_url
    return trans.before_image_url
  }, [activeAngle, trans])

  const afterImage = useMemo(() => {
    if (activeAngle === 'side') return trans.after_side_url || trans.after_image_url
    if (activeAngle === 'back') return trans.after_back_url || trans.after_image_url
    return trans.after_image_url
  }, [activeAngle, trans])

  return (
    <Card className="p-5 flex flex-col md:flex-row gap-5 items-stretch relative hover:border-[#E8FF00]/30 transition-all">
      {/* Before/After side-by-side vertical images */}
      <div className="flex flex-col gap-2.5 w-full md:w-[260px] shrink-0">
        <div className="flex gap-2">
          {/* Before Image */}
          <div className="flex-1 aspect-[2/3] bg-black border border-[#1F1F1F] rounded-lg overflow-hidden relative">
            <img 
              src={beforeImage} 
              alt="Before" 
              className="w-full h-full object-cover" 
            />
            <span className="absolute bottom-1.5 left-1.5 bg-black/75 border border-[#1F1F1F] text-[10px] font-bold text-[#FF3A2D] uppercase px-1.5 py-0.5 rounded tracking-wide">
              Before
            </span>
          </div>

          {/* After Image */}
          <div className="flex-1 aspect-[2/3] bg-black border border-[#1F1F1F] rounded-lg overflow-hidden relative">
            <img 
              src={afterImage} 
              alt="After" 
              className="w-full h-full object-cover" 
            />
            <span className="absolute bottom-1.5 left-1.5 bg-[#E8FF00]/90 border border-[#E8FF00]/30 text-[10px] font-bold text-black uppercase px-1.5 py-0.5 rounded tracking-wide">
              After
            </span>
          </div>
        </div>

        {/* Available Views Pills */}
        {availableViews.length > 1 && (
          <div className="flex justify-center gap-1.5 bg-[#161616] py-1 px-2 rounded-lg border border-[#1F1F1F]">
            {availableViews.map((angle) => (
              <button
                type="button"
                key={angle}
                onClick={() => setActiveAngle(angle)}
                className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded transition-colors cursor-pointer ${
                  activeAngle === angle
                    ? 'bg-[#E8FF00] text-black'
                    : 'text-[#666666] hover:text-[#F5F5F5]'
                }`}
              >
                {angle}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {trans.type_en && (
              <Badge variant="accent" className="text-[10px] font-bold py-0.5 px-2">
                {trans.type_en} {trans.type_ar ? `/ ${trans.type_ar}` : ''}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 text-[#888] border-[#222]">
              ⏱️ {trans.duration_en} / {trans.duration_ar}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-[#F5F5F5] font-medium leading-relaxed italic font-sans">
              " {trans.description_en} "
            </p>
            {trans.description_ar && (
              <p className="text-xs text-[#666666] leading-relaxed rtl:text-right font-medium font-sans">
                " {trans.description_ar} "
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-3">
          <span className="text-[10px] text-[#666666] font-bold uppercase">
            Order: {trans.sort_order}
          </span>
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => onEditClick(trans)}
              className="text-xs font-bold text-[#E8FF00] hover:text-[#E8FF00]/80 flex items-center gap-1 cursor-pointer outline-none"
            >
              <Pencil size={13} />
              <span>Edit Card</span>
            </button>
            <button 
              type="button"
              onClick={() => setDeleteConfirm(trans)}
              className="text-xs font-bold text-[#FF3A2D] hover:text-[#FF3A2D]/80 flex items-center gap-1 cursor-pointer outline-none"
            >
              <Trash2 size={13} />
              <span>Remove Card</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function TransformationsManager() {
  const [transformations, setTransformations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Editing state
  const [editingTransformation, setEditingTransformation] = useState(null)

  // Fields for adding/editing a transformation
  const [typeEn, setTypeEn] = useState('')
  const [typeAr, setTypeAr] = useState('')
  const [durationEn, setDurationEn] = useState('')
  const [durationAr, setDurationAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [sortOrder, setSortOrder] = useState('0')

  const [beforeFile, setBeforeFile] = useState(null)
  const [afterFile, setAfterFile] = useState(null)
  const [beforePreview, setBeforePreview] = useState(null)
  const [afterPreview, setAfterPreview] = useState(null)

  const [beforeSideFile, setBeforeSideFile] = useState(null)
  const [afterSideFile, setAfterSideFile] = useState(null)
  const [beforeSidePreview, setBeforeSidePreview] = useState(null)
  const [afterSidePreview, setAfterSidePreview] = useState(null)

  const [beforeBackFile, setBeforeBackFile] = useState(null)
  const [afterBackFile, setAfterBackFile] = useState(null)
  const [beforeBackPreview, setBeforeBackPreview] = useState(null)
  const [afterBackPreview, setAfterBackPreview] = useState(null)

  const fetchTransformations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transformations')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransformations(data || [])
    } catch (err) {
      console.error('Error fetching transformations:', err)
      toast.error('Failed to load transformations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransformations()
  }, [])

  const handleBeforeFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB maximum limit.')
      return
    }
    setBeforeFile(file)
    setBeforePreview(URL.createObjectURL(file))
  }

  const handleAfterFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB maximum limit.')
      return
    }
    setAfterFile(file)
    setAfterPreview(URL.createObjectURL(file))
  }

  // Upload an image file to the 'transformations' bucket and return public URL
  const uploadImage = async (file, type) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${type}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('transformations')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Upload error:', error)
      throw new Error(`Failed to upload ${type} image: ` + error.message)
    }

    const { data: publicUrlData } = supabase.storage
      .from('transformations')
      .getPublicUrl(fileName)

    return publicUrlData.publicUrl
  }

  const handleOptionalFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0]
    if (!file) {
      setFile(null)
      setPreview(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB maximum limit.')
      return
    }
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleEditClick = (trans) => {
    setEditingTransformation(trans)
    setTypeEn(trans.type_en || '')
    setTypeAr(trans.type_ar || '')
    setDurationEn(trans.duration_en || '')
    setDurationAr(trans.duration_ar || '')
    setDescriptionEn(trans.description_en || '')
    setDescriptionAr(trans.description_ar || '')
    setSortOrder(String(trans.sort_order || 0))
    setBeforePreview(trans.before_image_url || null)
    setAfterPreview(trans.after_image_url || null)
    setBeforeSidePreview(trans.before_side_url || null)
    setAfterSidePreview(trans.after_side_url || null)
    setBeforeBackPreview(trans.before_back_url || null)
    setAfterBackPreview(trans.after_back_url || null)
    setBeforeFile(null)
    setAfterFile(null)
    setBeforeSideFile(null)
    setAfterSideFile(null)
    setBeforeBackFile(null)
    setAfterBackFile(null)
  }

  const handleCancelEdit = () => {
    setEditingTransformation(null)
    setTypeEn('')
    setTypeAr('')
    setDurationEn('')
    setDurationAr('')
    setDescriptionEn('')
    setDescriptionAr('')
    setSortOrder('0')
    setBeforeFile(null)
    setAfterFile(null)
    setBeforePreview(null)
    setAfterPreview(null)
    setBeforeSideFile(null)
    setAfterSideFile(null)
    setBeforeSidePreview(null)
    setAfterSidePreview(null)
    setBeforeBackFile(null)
    setAfterBackFile(null)
    setBeforeBackPreview(null)
    setAfterBackPreview(null)
  }

  const handleSaveTransformation = async (e) => {
    e.preventDefault()
    if (!editingTransformation && (!beforeFile || !afterFile)) {
      toast.error('Please upload both BEFORE and AFTER images.')
      return
    }
    if (!durationEn || !durationAr) {
      toast.error('Please fill in both English and Arabic Duration fields.')
      return
    }

    setSaving(true)
    try {
      // 1. Upload or reuse images
      let beforeUrl = editingTransformation ? editingTransformation.before_image_url : null
      if (beforeFile) {
        beforeUrl = await uploadImage(beforeFile, 'before')
      }

      let afterUrl = editingTransformation ? editingTransformation.after_image_url : null
      if (afterFile) {
        afterUrl = await uploadImage(afterFile, 'after')
      }

      // 2. Upload optional files
      let beforeSideUrl = editingTransformation ? editingTransformation.before_side_url : null
      if (beforeSideFile) {
        beforeSideUrl = await uploadImage(beforeSideFile, 'before_side')
      }

      let afterSideUrl = editingTransformation ? editingTransformation.after_side_url : null
      if (afterSideFile) {
        afterSideUrl = await uploadImage(afterSideFile, 'after_side')
      }

      let beforeBackUrl = editingTransformation ? editingTransformation.before_back_url : null
      if (beforeBackFile) {
        beforeBackUrl = await uploadImage(beforeBackFile, 'before_back')
      }

      let afterBackUrl = editingTransformation ? editingTransformation.after_back_url : null
      if (afterBackFile) {
        afterBackUrl = await uploadImage(afterBackFile, 'after_back')
      }

      // 3. Save / Update record
      const payload = {
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        before_side_url: beforeSideUrl,
        after_side_url: afterSideUrl,
        before_back_url: beforeBackUrl,
        after_back_url: afterBackUrl,
        type_en: typeEn || null,
        type_ar: typeAr || null,
        duration_en: durationEn,
        duration_ar: durationAr,
        description_en: descriptionEn || null,
        description_ar: descriptionAr || null,
        sort_order: parseInt(sortOrder, 10) || 0
      }

      if (editingTransformation) {
        const { error } = await supabase
          .from('transformations')
          .update(payload)
          .eq('id', editingTransformation.id)

        if (error) throw error
        toast.success('Transformation card updated successfully!')
      } else {
        const { data, error } = await supabase
          .from('transformations')
          .insert([payload])
          .select()

        if (error) throw error
        toast.success('Transformation card added successfully!')
      }

      handleCancelEdit()
      fetchTransformations()
    } catch (err) {
      console.error('Error saving transformation:', err)
      toast.error(err.message || 'Failed to save transformation.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const { id, before_image_url, after_image_url, before_side_url, after_side_url, before_back_url, after_back_url } = deleteConfirm
    setDeleteConfirm(null)

    try {
      // 1. Delete from database
      const { error } = await supabase
        .from('transformations')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Try to clean up files in storage (optional, extract paths)
      try {
        const getPathFromUrl = (url) => {
          if (!url) return null
          const parts = url.split('/transformations/')
          return parts.length > 1 ? parts[1] : null
        }
        const files = []
        const urls = [before_image_url, after_image_url, before_side_url, after_side_url, before_back_url, after_back_url]
        urls.forEach(url => {
          const path = getPathFromUrl(url)
          if (path) files.push(path)
        })

        if (files.length > 0) {
          await supabase.storage.from('transformations').remove(files)
        }
      } catch (storageErr) {
        console.warn('Storage cleanup failed (non-blocking):', storageErr)
      }

      setTransformations(prev => prev.filter(t => t.id !== id))
      toast.success('Transformation removed successfully.')
    } catch (err) {
      console.error('Error deleting transformation:', err)
      toast.error('Failed to delete transformation.')
    }
  }

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div>
        <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
          TRANSFORMATIONS GALLERY MANAGER
        </h1>
        <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
          Upload and configure before/after client fitness results shown on the homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Existing list */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">
            PUBLISHED RESULTS ({transformations.length})
          </h3>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#666666] py-12">
              <RefreshCw className="animate-spin" size={16} />
              <span>Loading transformations...</span>
            </div>
          ) : transformations.length === 0 ? (
            <div className="text-sm text-[#666666] py-12">
              No transformation cards configured yet. Add one on the right.
            </div>
          ) : (
            <div className="space-y-4">
              {transformations.map((trans) => (
                <AdminTransformationCard
                  key={trans.id}
                  trans={trans}
                  setDeleteConfirm={setDeleteConfirm}
                  onEditClick={handleEditClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Add/Edit card */}
        <div className="lg:col-span-5">
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2 uppercase">
              {editingTransformation ? 'EDIT TRANSFORMATION CARD' : 'ADD TRANSFORMATION CARD'}
            </h3>
            
            <form onSubmit={handleSaveTransformation} className="space-y-4">
              
              {/* Before and After Image Uploads side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Before Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
                    Before (Front - {editingTransformation ? 'Optional to change' : 'Required'})
                  </label>
                  <div className="border-2 border-dashed border-[#1F1F1F] bg-[#161616] rounded-xl p-4 text-center hover:border-[#FF3A2D]/40 transition-colors relative cursor-pointer h-28 flex flex-col items-center justify-center overflow-hidden">
                    <input
                      type="file"
                      onChange={handleBeforeFileChange}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {beforePreview ? (
                      <img src={beforePreview} alt="Before Preview" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <div className="flex flex-col items-center text-[#666666]">
                        <Upload size={18} className="mb-0.5" />
                        <span className="text-[9px] font-bold uppercase">Upload</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* After Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">
                    After (Front - {editingTransformation ? 'Optional to change' : 'Required'})
                  </label>
                  <div className="border-2 border-dashed border-[#1F1F1F] bg-[#161616] rounded-xl p-4 text-center hover:border-[#E8FF00]/40 transition-colors relative cursor-pointer h-28 flex flex-col items-center justify-center overflow-hidden">
                    <input
                      type="file"
                      onChange={handleAfterFileChange}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {afterPreview ? (
                      <img src={afterPreview} alt="After Preview" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <div className="flex flex-col items-center text-[#666666]">
                        <Upload size={18} className="mb-0.5" />
                        <span className="text-[9px] font-bold uppercase">Upload</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Side View Image Uploads side-by-side */}
              <div className="grid grid-cols-2 gap-3 border-t border-[#1F1F1F]/40 pt-3">
                {/* Before Side Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Before (Side - Optional)</label>
                  <div className="border-2 border-dashed border-[#1F1F1F] bg-[#161616] rounded-xl p-4 text-center hover:border-[#FF3A2D]/40 transition-colors relative cursor-pointer h-24 flex flex-col items-center justify-center overflow-hidden">
                    <input
                      type="file"
                      onChange={(e) => handleOptionalFileChange(e, setBeforeSideFile, setBeforeSidePreview)}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {beforeSidePreview ? (
                      <img src={beforeSidePreview} alt="Before Side Preview" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <div className="flex flex-col items-center text-[#444444]">
                        <Upload size={16} className="mb-0.5" />
                        <span className="text-[9px] font-bold uppercase">Upload Side</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* After Side Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">After (Side - Optional)</label>
                  <div className="border-2 border-dashed border-[#1F1F1F] bg-[#161616] rounded-xl p-4 text-center hover:border-[#E8FF00]/40 transition-colors relative cursor-pointer h-24 flex flex-col items-center justify-center overflow-hidden">
                    <input
                      type="file"
                      onChange={(e) => handleOptionalFileChange(e, setAfterSideFile, setAfterSidePreview)}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {afterSidePreview ? (
                      <img src={afterSidePreview} alt="After Side Preview" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <div className="flex flex-col items-center text-[#444444]">
                        <Upload size={16} className="mb-0.5" />
                        <span className="text-[9px] font-bold uppercase">Upload Side</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Back View Image Uploads side-by-side */}
              <div className="grid grid-cols-2 gap-3 border-t border-[#1F1F1F]/40 pt-3">
                {/* Before Back Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Before (Back - Optional)</label>
                  <div className="border-2 border-dashed border-[#1F1F1F] bg-[#161616] rounded-xl p-4 text-center hover:border-[#FF3A2D]/40 transition-colors relative cursor-pointer h-24 flex flex-col items-center justify-center overflow-hidden">
                    <input
                      type="file"
                      onChange={(e) => handleOptionalFileChange(e, setBeforeBackFile, setBeforeBackPreview)}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {beforeBackPreview ? (
                      <img src={beforeBackPreview} alt="Before Back Preview" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <div className="flex flex-col items-center text-[#444444]">
                        <Upload size={16} className="mb-0.5" />
                        <span className="text-[9px] font-bold uppercase">Upload Back</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* After Back Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">After (Back - Optional)</label>
                  <div className="border-2 border-dashed border-[#1F1F1F] bg-[#161616] rounded-xl p-4 text-center hover:border-[#E8FF00]/40 transition-colors relative cursor-pointer h-24 flex flex-col items-center justify-center overflow-hidden">
                    <input
                      type="file"
                      onChange={(e) => handleOptionalFileChange(e, setAfterBackFile, setAfterBackPreview)}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {afterBackPreview ? (
                      <img src={afterBackPreview} alt="After Back Preview" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <div className="flex flex-col items-center text-[#444444]">
                        <Upload size={16} className="mb-0.5" />
                        <span className="text-[9px] font-bold uppercase">Upload Back</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Type Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Type (English - Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Fat Loss"
                    value={typeEn}
                    onChange={(e) => setTypeEn(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Type (Arabic - Optional)</label>
                  <input
                    type="text"
                    placeholder="مثال: خسارة دهون"
                    value={typeAr}
                    onChange={(e) => setTypeAr(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors text-right"
                  />
                </div>
              </div>

              {/* Duration Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Duration (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 Weeks"
                    value={durationEn}
                    onChange={(e) => setDurationEn(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Duration (Arabic)</label>
                  <input
                    type="text"
                    placeholder="مثال: 12 أسبوع"
                    value={durationAr}
                    onChange={(e) => setDurationAr(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none focus:border-[#E8FF00]/40 transition-colors text-right"
                    required
                  />
                </div>
              </div>

              {/* Description Inputs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Description (English)</label>
                <textarea
                  rows={2}
                  placeholder="Describe the client result/journey..."
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none resize-none focus:border-[#E8FF00]/40 transition-colors font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Description (Arabic)</label>
                <textarea
                  rows={2}
                  placeholder="وصف رحلة وتطور العميل..."
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2 px-3 text-sm text-[#F5F5F5] outline-none resize-none focus:border-[#E8FF00]/40 transition-colors text-right font-sans"
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
                {editingTransformation && (
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
                  {saving ? 'Saving...' : editingTransformation ? 'Save Changes' : 'Publish Transformation'}
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
                Remove Card
              </h3>
              <p className="text-sm text-[#888] leading-relaxed">
                Are you sure you want to permanently remove this transformation card?
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

export default TransformationsManager
