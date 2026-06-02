import React from 'react'

export function ProgressRing({
  radius = 60,
  stroke = 8,
  progress = 0, // 0 to 100
  strokeColor = '#E8FF00',
  trackColor = '#1F1F1F',
  children,
  className = '',
}) {
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  // Cap progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Track circle */}
        <circle
          stroke={trackColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Animated fill circle */}
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out-in' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      {children && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  )
}
export default ProgressRing
