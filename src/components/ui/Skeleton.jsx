import React from 'react'

export function Skeleton({
  className = '',
  variant = 'text', // text, circle, rect
  ...props
}) {
  const baseStyles = 'animate-pulse bg-[#1F1F1F] rounded-lg'
  const variants = {
    text: 'h-4 w-full',
    circle: 'rounded-full aspect-square',
    rect: 'w-full h-32'
  }

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
export default Skeleton
