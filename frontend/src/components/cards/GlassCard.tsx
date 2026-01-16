import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const GlassCard = ({ children, className, hover = true }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6',
        hover && 'transition-all duration-300 hover:bg-[rgba(30,41,59,0.7)] hover:border-indigo-500/30 hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  )
}
