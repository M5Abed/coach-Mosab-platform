import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../store/toastStore'
import { Plus, Trash2, Video, Calendar, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function VideoManager() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [category, setCategory] = useState('Strength')
  const [scheduleDate, setScheduleDate] = useState('')

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
      toast.error('Failed to load videos from directory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleAddVideo = async (e) => {
    e.preventDefault()
    if (!title || !youtubeId) {
      toast.error('Please enter the Video Title and YouTube ID.')
      return
    }

    const newVid = {
      title,
      youtube_id: youtubeId,
      category,
      views: 0,
      active: true,
      scheduled: scheduleDate || null
    }

    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([newVid])
        .select()

      if (error) throw error
      setVideos(prev => [data[0], ...prev])
      setTitle('')
      setYoutubeId('')
      setScheduleDate('')
      toast.success('Video instruction added to unlisted directory!')
    } catch (err) {
      console.error('Error adding video:', err)
      toast.error(err.message || 'Failed to add video.')
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id)

      if (error) throw error
      setVideos(prev => prev.filter(v => v.id !== id))
      toast.success('Video removed from library.')
    } catch (err) {
      console.error('Error deleting video:', err)
      toast.error('Failed to delete video.')
    }
  }

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Header */}
      <div>
        <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
          VIDEO DIRECTORY MANAGER
        </h1>
        <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
          Upload unlisted YouTube instructional videos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Uploaded list */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide">PUBLISHED LECTURES ({videos.length})</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((vid) => (
              <Card key={vid.id} className="p-4 flex flex-col justify-between h-full hover:border-[#E8FF00]/30 transition-all">
                <div className="space-y-3">
                  <div className="aspect-video relative rounded-lg overflow-hidden bg-black flex items-center justify-center border border-[#1F1F1F]">
                    <img 
                      src={`https://img.youtube.com/vi/${vid.youtube_id}/mqdefault.jpg`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover opacity-60" 
                    />
                    <Badge variant="accent" className="absolute bottom-2 right-2 scale-90">{vid.category}</Badge>
                  </div>
                  <h4 className="font-bebas text-lg text-[#F5F5F5] tracking-wide leading-snug line-clamp-2">{vid.title}</h4>
                  <div className="text-[10px] text-[#666666] font-bold uppercase">
                    <span>Views: {vid.views}</span>
                    {vid.scheduled && <span className="text-[#FF8C00] block mt-1">📅 Scheduled: {vid.scheduled}</span>}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-[#1F1F1F]">
                  <Button 
                    onClick={() => handleDelete(vid.id)}
                    variant="outline" 
                    size="sm"
                    className="w-full uppercase font-bebas text-xs text-[#FF3A2D] hover:bg-[#FF3A2D]/10 hover:border-[#FF3A2D]/20 py-2"
                  >
                    Delete Video
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Side: Add new video */}
        <div className="lg:col-span-4">
          <Card className="space-y-4">
            <h3 className="font-bebas text-xl text-[#F5F5F5] tracking-wide border-b border-[#1F1F1F] pb-2 uppercase">ADD LECTURE</h3>
            
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Video Title</label>
                <input
                  type="text"
                  placeholder="e.g. Perfect Overhead Form Guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">YouTube Video ID (11 chars)</label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. y7I6qX5tC_4"
                    value={youtubeId}
                    onChange={(e) => setYoutubeId(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#F5F5F5] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Category Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 px-4 text-sm text-[#F5F5F5] outline-none cursor-pointer"
                >
                  <option value="Strength">Strength</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Mobility">Mobility & recovery</option>
                  <option value="HIIT">HIIT</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#666666] uppercase tracking-wider block">Schedule Publish (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={16} />
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-[#161616] border border-[#1F1F1F] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#F5F5F5] outline-none"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full font-bebas uppercase tracking-wider text-base py-3">
                <Plus size={16} className="mr-1" /> Add to Library
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default VideoManager
