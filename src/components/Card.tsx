import { cn } from '../lib/utils'

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  subtitle?: string
  rightAction?: React.ReactNode
}

export default function Card({ title, subtitle, rightAction, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden', className)}
      {...props}
    >
      {(title || rightAction) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {rightAction}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
