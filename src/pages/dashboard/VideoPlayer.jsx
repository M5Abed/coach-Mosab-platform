import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ArrowLeft, Clock, Eye, AlertTriangle } from 'lucide-react'

export function VideoPlayer() {
  const { videoId } = useParams()

  const videoDetails = {
    title: 'Proper Barbell Squat Mechanics & Concentric Drive',
    youtube_id: videoId || 'y7I6qX5tC_4',
    category: 'Strength',
    duration: '10:15',
    views: 340,
    equipment: ['Barbell', 'Squat Rack', 'Weight Plates'],
    description: 'Learn how to set up the bar on your upper back, descend with a neutral spine, achieve full depth, and drive back up through the heels. Coach Mosab outlines common errors like knee valgus and pelvic wink.',
    coachNote: '💬 "Make sure your bracing is 100% tight before descending. Inhale deep into your diaphragm, expand your abdomen, hold your breath, squat, and exhale only at the very top of the rep."'
  }

  const embedUrl = `https://www.youtube.com/embed/${videoDetails.youtube_id}?rel=0&modestbranding=1&autoplay=1`

  return (
    <div className="space-y-6 font-dmsans select-none">
      {/* Navigation header */}
      <div>
        <Link 
          to="/dashboard/videos"
          className="flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#F5F5F5] font-bold uppercase transition-colors outline-none cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Library
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Video Player */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative pb-[56.25%] h-0 bg-black rounded-xl overflow-hidden border border-[#1F1F1F] shadow-2xl">
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={videoDetails.title}
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-bebas text-2xl md:text-3xl text-[#F5F5F5] tracking-wide uppercase">
                {videoDetails.title}
              </h2>
              <div className="flex gap-2">
                <Badge variant="accent">{videoDetails.category}</Badge>
                <Badge variant="default" className="flex items-center gap-1"><Clock size={12} /> {videoDetails.duration}</Badge>
              </div>
            </div>

            <p className="text-sm text-[#666666] leading-relaxed">
              {videoDetails.description}
            </p>

            {/* Equipment Tags */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1F1F1F]">
              <span className="text-[10px] text-[#666666] font-bold uppercase mt-1">EQUIPMENT REQUIRED:</span>
              {videoDetails.equipment.map((eq) => (
                <span key={eq} className="bg-[#161616] border border-[#1F1F1F] rounded-full px-3 py-1 text-xs text-[#666666] font-semibold">{eq}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Side Panel Notes */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-l-4 border-l-[#E8FF00] space-y-3">
            <span className="text-[10px] text-[#E8FF00] font-bold uppercase tracking-wider block">💡 Coach's Specific instructions</span>
            <p className="text-xs text-[#666666] italic leading-relaxed">
              {videoDetails.coachNote}
            </p>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#FF8C00] font-bold uppercase tracking-wider">
              <AlertTriangle size={14} />
              <span>SAFETY NOTIFICATION</span>
            </div>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              Always inspect collar clips and barbell safety stops before executing heavy compound lifts. Ask someone in your gym to spot you if you are testing a new 1RM load.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
