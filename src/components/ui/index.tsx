import type { ReactNode } from 'react'
import { cn, formatNumber } from '@/lib/utils'

export function StatCard({
  label, value, icon, trend, accent = 'navy',
}: {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: string; positive?: boolean }
  accent?: 'navy' | 'accent' | 'green' | 'amber' | 'red'
}) {
  const accentMap = {
    navy: 'bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
    accent: 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {typeof value === 'number' ? formatNumber(value) : value}
          </div>
        </div>
        {icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accentMap[accent])}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={cn(
          'mt-3 text-xs font-medium',
          trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        )}>
          {trend.value}
        </div>
      )}
    </div>
  )
}

export function PageHeader({
  title, subtitle, actions, breadcrumbs,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: { label: string; to?: string }[]
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'font-medium text-slate-700 dark:text-slate-300' : ''}>{b.label}</span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function Badge({
  children, variant = 'default',
}: {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'critical' | 'neutral'
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    critical: 'bg-red-600 text-white',
    info: 'bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300',
    neutral: 'bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
  }
  return <span className={cn('badge', variants[variant])}>{children}</span>
}

export function EmptyState({
  icon, title, description, action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-accent-500" />
      <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

export function Card({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <div className={cn('card p-5', className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

export function severityBadge(sev: string): ReactNode {
  const map: Record<string, 'info' | 'warning' | 'danger' | 'critical' | 'neutral'> = {
    Informational: 'info',
    Low: 'neutral',
    Medium: 'warning',
    High: 'danger',
    Critical: 'critical',
  }
  return <Badge variant={map[sev] ?? 'default'}>{sev}</Badge>
}

export function statusBadge(status: string): ReactNode {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'critical'> = {
    Draft: 'neutral',
    Planned: 'info',
    Approved: 'success',
    Active: 'success',
    Completed: 'neutral',
    Cancelled: 'danger',
    Postponed: 'warning',
    Extended: 'warning',
    Shortened: 'warning',
    Relocated: 'warning',
    Archived: 'neutral',
    New: 'info',
    Acknowledged: 'neutral',
    Resolved: 'success',
    Dismissed: 'neutral',
    Paid: 'success',
    Unpaid: 'danger',
    'Partially paid': 'warning',
    Overdue: 'danger',
    Open: 'danger',
    Pending: 'warning',
    Available: 'success',
    'In use': 'info',
    Idle: 'warning',
    Damaged: 'danger',
    Missing: 'critical',
    Returned: 'success',
  }
  return <Badge variant={map[status] ?? 'default'}>{status}</Badge>
}
