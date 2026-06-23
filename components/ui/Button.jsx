'use client'

import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-sm',
  secondary: 'bg-[#1c1c1c] hover:bg-[#262626] text-[#f5f5f5] border border-[#333333]',
  ghost:     'bg-transparent hover:bg-[#1c1c1c] text-[#a3a3a3] hover:text-[#f5f5f5]',
  danger:    'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-sm',
  outline:   'bg-transparent border border-[#333333] hover:border-[#4f46e5] text-[#f5f5f5]',
}

const sizes = {
  xs:  'h-6  px-2   text-xs  gap-1',
  sm:  'h-8  px-3   text-sm  gap-1.5',
  md:  'h-9  px-4   text-sm  gap-2',
  lg:  'h-10 px-5   text-base gap-2',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  className,
  disabled,
  children,
  icon,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] font-medium',
        'transition-all duration-150 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]/60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
