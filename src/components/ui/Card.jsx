import React from 'react'

export function Card({
  children,
  className = '',
  hoverGlow = false,
  onClick = null,
  ...props
}) {
  const isClickable = onClick !== null
  const hoverStyles = hoverGlow 
    ? 'hover:border-[#E8FF00]/40 hover:shadow-[0_0_15px_rgba(232,255,0,0.12)]' 
    : ''
  const cursorStyles = isClickable ? 'cursor-pointer hover:-translate-y-1' : ''
  
  return (
    <div
      onClick={onClick}
      className={`bg-[#161616] border border-[#1F1F1F] rounded-xl p-5 transition-all duration-200 ${hoverStyles} ${cursorStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
export default Card
