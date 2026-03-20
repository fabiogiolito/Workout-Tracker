import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean | string
  right?: ReactNode
}

export function PageHeader({ title, subtitle, back, right }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-start justify-between pt-14 pb-6">
      <div className="flex items-start gap-3">
        {back && (
          <button
            onClick={() => typeof back === 'string' ? navigate(back) : navigate(-1)}
            className="mt-0.5 -ml-1 p-1 text-neutral-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="mt-1">{right}</div>}
    </div>
  )
}
