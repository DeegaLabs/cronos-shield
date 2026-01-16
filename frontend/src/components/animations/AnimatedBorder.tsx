import { cn } from '@/lib/utils'

interface AnimatedBorderProps {
  children: React.ReactNode
  className?: string
}

export const AnimatedBorder = ({ children, className }: AnimatedBorderProps) => {
  return (
    <div className={cn('animated-border rounded-2xl', className)}>
      {children}
    </div>
  )
}
