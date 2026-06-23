import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-[#1c1c1c] text-[#a3a3a3] border border-[#333333]',
  accent:  'bg-[#1e1b4b] text-[#818cf8] border border-[#4f46e5]/30',
  success: 'bg-[#064e3b] text-[#10b981] border border-[#10b981]/30',
  warning: 'bg-[#451a03] text-[#f59e0b] border border-[#f59e0b]/30',
  danger:  'bg-[#450a0a] text-[#ef4444] border border-[#ef4444]/30',
}

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
