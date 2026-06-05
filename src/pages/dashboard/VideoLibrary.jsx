import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Play, Radio, Clock, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function VideoLibrary() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  const liveSession = {
    active: false,
    title: 'LIVE COACH Q&A - WEEK 1 CHECK-IN & CORRECTIONS',
    scheduled: 'Now live',
    youtube_id: 'H2N1f1h4yA0'
  }

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setVideos(data || [])
      } catch (err) {
        console.error('Error fetching videos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  const categories = [
    {
      title: 'STRENGTH',
      videos: videos.filter(v => v.category === 'Strength')
    },
    {
      title: 'NUTRITION',
      videos: videos.filter(v => v.category === 'Nutrition')
    },
    {
      title: 'MOBILITY & RECOVERY',
      videos: videos.filter(v => v.category === 'Mobility')
    },
    {
      title: 'CARDIO & HIIT',
      videos: videos.filter(v => v.category === 'HIIT')
    }
  ].filter(cat => cat.videos.length > 0)

  const getYouTubeThumbnail = (id) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`

  return (
    <div className="space-y-8 font-dmsans select-none">
      {/* Header */}
      <div>
        <h1 className="font-bebas text-4xl md:text-5xl text-[#F5F5F5] uppercase tracking-wide">
          VIDEO INSTRUCTION LIBRARY
        </h1>
        <p className="text-sm text-[#666666] font-semibold uppercase tracking-wider">
          Watch form execution guides and coach Q&As.
        </p>
      </div>

      {/* Live Now Session Banner */}
      {liveSession.active && (
        <div className="bg-[#FF3A2D]/10 border border-[#FF3A2D]/30 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FF3A2D]/20 flex items-center justify-center text-[#FF3A2D] shrink-0 animate-pulse">
              <Radio size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FF3A2D] text-[#F5F5F5] font-bold text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider animate-bounce">LIVE NOW</span>
                <span className="text-xs text-[#666666] font-bold uppercase tracking-wider">{liveSession.scheduled}</span>
              </div>
              <h3 className="font-bebas text-xl md:text-2xl text-[#F5F5F5] tracking-wide mt-1">
                {liveSession.title}
              </h3>
            </div>
          </div>
          <Button variant="danger" onClick={() => navigate(`/dashboard/videos/${liveSession.youtube_id}`)} className="w-full md:w-auto px-8 uppercase font-bebas tracking-wide">
            ENTER STREAM
          </Button>
        </div>
      )}

      {/* Categorized grids */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#666666] font-bold uppercase animate-pulse">
            Loading video library...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#1F1F1F]/60 rounded-xl">
            <span className="text-xs text-[#666666] font-bold uppercase block mb-1">Library Empty</span>
            <span className="text-xs text-[#444444] font-medium block">No instructional videos are available right now.</span>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.title} className="space-y-4">
              <h3 className="font-bebas text-2xl text-[#F5F5F5] tracking-wider border-b border-[#1F1F1F] pb-2">
                {cat.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {cat.videos.map((vid) => (
                  <div 
                    key={vid.id}
                    onClick={() => navigate(`/dashboard/videos/${vid.youtube_id}`)}
                    className="bg-[#161616] border border-[#1F1F1F] rounded-lg overflow-hidden group cursor-pointer hover:border-[#E8FF00]/30 transition-colors"
                  >
                    <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                      <img 
                        src={getYouTubeThumbnail(vid.youtube_id)} 
                        alt={vid.title} 
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-40 transition-all duration-300"
                        loading="lazy"
                      />
                      <div className="absolute w-10 h-10 rounded-full bg-[#E8FF00] text-[#0A0A0A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                        <Play size={16} fill="#0A0A0A" className="ml-0.5" />
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/80 text-[10px] font-bold px-1.5 py-0.5 rounded text-[#F5F5F5]">
                        {vid.duration || '10:00'}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-[#666666] font-bold">
                        <Badge variant="accent" className="scale-90 origin-left">{vid.category}</Badge>
                        <span className="flex items-center gap-1"><Eye size={12} /> {vid.views} views</span>
                      </div>
                      <h4 className="font-bebas text-lg text-[#F5F5F5] group-hover:text-[#E8FF00] transition-colors truncate">
                        {vid.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default VideoLibrary
