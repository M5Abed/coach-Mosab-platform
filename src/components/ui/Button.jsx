import React from 'react'

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'accentGhost'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  loading = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-dmsans font-bold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none'
  
  const variants = {
    primary: 'bg-[#E8FF00] text-[#0A0A0A] hover:bg-[#d6eb00] accent-glow-hover border border-transparent',
    secondary: 'bg-[#161616] text-[#F5F5F5] hover:bg-[#1f1f1f] border border-[#1F1F1F]',
    ghost: 'bg-transparent text-[#F5F5F5] hover:bg-[#111111] border border-transparent',
    danger: 'bg-[#FF3A2D] text-[#F5F5F5] hover:bg-[#e02e22] border border-transparent',
    success: 'bg-[#34D399] text-[#0A0A0A] hover:bg-[#2bc089] border border-transparent',
    outline: 'bg-transparent text-[#F5F5F5] hover:bg-[#161616] border border-[#1F1F1F]',
    accentGhost: 'bg-transparent text-[#E8FF00] border border-[#E8FF00] hover:bg-[#E8FF00] hover:text-[#0A0A0A] accent-glow-hover'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base uppercase font-bebas tracking-wider'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}
export default Button
