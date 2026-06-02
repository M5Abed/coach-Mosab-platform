import React from 'react'

export function Badge({
  children,
  variant = 'default', // beginner, intermediate, advanced, active, pending, inactive, expired, approved, rejected, info, default, accent
  className = '',
}) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-dmsans uppercase tracking-wide border'
  
  const variants = {
    default: 'bg-[#161616] text-[#F5F5F5] border-[#1F1F1F]',
    beginner: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/25',
    intermediate: 'bg-[#4DA6FF]/10 text-[#4DA6FF] border-[#4DA6FF]/25',
    advanced: 'bg-[#FF3A2D]/10 text-[#FF3A2D] border-[#FF3A2D]/25',
    active: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/25',
    approved: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/25',
    pending: 'bg-[#FF8C00]/10 text-[#FF8C00] border-[#FF8C00]/25',
    inactive: 'bg-[#666666]/10 text-[#666666] border-[#666666]/25',
    expired: 'bg-[#FF3A2D]/10 text-[#FF3A2D] border-[#FF3A2D]/25',
    rejected: 'bg-[#FF3A2D]/10 text-[#FF3A2D] border-[#FF3A2D]/25',
    info: 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/25',
    accent: 'bg-[#E8FF00]/15 text-[#E8FF00] border-[#E8FF00]/30'
  }

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}
export default Badge
