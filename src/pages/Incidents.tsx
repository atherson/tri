import { useState } from 'react'
import { ShieldAlert, Search } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { Incident } from '@/types'
import { PageHeader, severityBadge, statusBadge, LoadingState, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

const categoryFilters = ['All', 'Damaged', 'Missing', 'Late delivery', 'Wrong equipment', 'Insufficient quantity', 'Malfunction', 'Safety issue']

export default function Incidents() {
  const { data: incidents, loading } = useSupabaseQuery<Incident>(TABLES.incidents, {
    select: '*, event:events(*), asset:equipment_assets(*)',
    order: { column: 'occurred_at', ascending: false },
  })
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = incidents.filter(i => {
    const matchFilter = filter === 'All' || i.category === filter
    const matchSearch = !search || i.incident_number.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  if (loading) return <LoadingState label="Loading incidents..." />

  return (
    <div>
      <PageHeader title="Incidents" subtitle={`${incidents.length} incident${incidents.length !== 1 ? 's' : ''}`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categoryFilters.map(s => (
            <button key={s} className={`badge cursor-pointer ${s === filter ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ShieldAlert className="h-10 w-10" />} title="No incidents found" />
      ) : (
        <div className="space-y-3">
          {filtered.map(i => (
            <div key={i.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{i.incident_number}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{i.category}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{i.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-4">
                    <div>Event: {i.event?.name ?? '—'}</div>
                    <div>Asset: {i.asset?.asset_code ?? '—'}</div>
                    <div>Reported by: {i.reported_by}</div>
                    <div>Occurred: {formatDate(i.occurred_at, true)}</div>
                  </div>
                  {i.resolution_notes && <div className="mt-2 rounded bg-emerald-50 p-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{i.resolution_notes}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {severityBadge(i.severity)}
                  {statusBadge(i.status)}
                  {i.estimated_cost_impact > 0 && <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Est. impact: {formatCurrency(i.estimated_cost_impact)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
