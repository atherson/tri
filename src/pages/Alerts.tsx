import { useState } from 'react'
import { AlertTriangle, Search, CheckCircle2, ShieldAlert, Filter } from 'lucide-react'
import { useSyncData } from '@/hooks/useSyncData'
import { PageHeader, severityBadge, statusBadge, LoadingState, EmptyState, Card, StatCard } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AlertSeverity, AlertStatus } from '@/types'

const severityFilters: (AlertSeverity | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low', 'Informational']
const statusFilters: (AlertStatus | 'All')[] = ['All', 'New', 'Acknowledged', 'Resolved', 'Dismissed']

export default function Alerts() {
  const { allAlerts, loading } = useSyncData()
  const [search, setSearch] = useState('')
  const [sevFilter, setSevFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const filtered = allAlerts.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.alert_type.toLowerCase().includes(search.toLowerCase())
    const matchSev = sevFilter === 'All' || a.severity === sevFilter
    const matchStatus = statusFilter === 'All' || a.status === statusFilter
    return matchSearch && matchSev && matchStatus
  })

  if (loading) return <LoadingState label="Loading alerts..." />

  const totalSavings = allAlerts.reduce((s, a) => s + a.potential_savings, 0)
  const criticalCount = allAlerts.filter(a => a.severity === 'Critical').length
  const resolvedCount = allAlerts.filter(a => a.status === 'Resolved').length

  return (
    <div>
      <PageHeader title="Synchronization Alerts" subtitle={`${allAlerts.length} alert${allAlerts.length !== 1 ? 's' : ''} detected`} />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Alerts" value={allAlerts.length} icon={<AlertTriangle className="h-5 w-5" />} accent="navy" />
        <StatCard label="Critical" value={criticalCount} icon={<ShieldAlert className="h-5 w-5" />} accent="red" />
        <StatCard label="Potential Savings" value={formatCurrency(totalSavings)} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search alerts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {severityFilters.map(s => (
            <button key={s} className={`badge cursor-pointer ${s === sevFilter ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'}`} onClick={() => setSevFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <span className="flex items-center gap-1 text-xs text-slate-500"><Filter className="h-3 w-3" /> Status:</span>
        {statusFilters.map(s => (
          <button key={s} className={`badge cursor-pointer ${s === statusFilter ? 'bg-accent-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'}`} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="h-10 w-10" />} title="No alerts match your filters" description="All clear — or try adjusting filters." />
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {a.severity === 'Critical' ? <ShieldAlert className="h-5 w-5 text-red-500" />
                      : a.severity === 'High' ? <AlertTriangle className="h-5 w-5 text-orange-500" />
                      : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{a.description}</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded bg-slate-50 p-2 dark:bg-navy-800">
                      <span className="font-medium text-slate-500 dark:text-slate-400">Detected: </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{a.detected_condition}</span>
                    </div>
                    <div className="rounded bg-accent-50 p-2 dark:bg-accent-900/20">
                      <span className="font-medium text-accent-700 dark:text-accent-400">Action: </span>
                      <span className="text-accent-800 dark:text-accent-300">{a.recommended_action}</span>
                    </div>
                  </div>
                  {a.event && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Event: {a.event.name} ({a.event.event_code})
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {severityBadge(a.severity)}
                  {statusBadge(a.status)}
                  {a.potential_savings > 0 && (
                    <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Save {formatCurrency(a.potential_savings)}
                    </div>
                  )}
                  {a.estimated_financial_impact > 0 && !a.potential_savings && (
                    <div className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Impact {formatCurrency(a.estimated_financial_impact)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
