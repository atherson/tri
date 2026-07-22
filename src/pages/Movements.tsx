import { useState } from 'react'
import { Wrench, Search } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { AssetMovement } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

const movementFilters = ['All', 'Dispatched', 'Delivered', 'Checked in', 'Installed', 'Marked in use', 'Marked idle', 'Checked out', 'Collected', 'Returned', 'Damaged', 'Missing']

export default function Movements() {
  const { data: movements, loading } = useSupabaseQuery<AssetMovement>(TABLES.movements, {
    select: '*, asset:equipment_assets(*)',
    order: { column: 'created_at', ascending: false },
  })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  const filtered = movements.filter(m => {
    const matchSearch = !search || m.asset?.asset_code.toLowerCase().includes(search.toLowerCase()) || m.asset?.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || m.movement_type === typeFilter
    return matchSearch && matchType
  })

  if (loading) return <LoadingState label="Loading movements..." />

  return (
    <div>
      <PageHeader title="Equipment Movements" subtitle={`${movements.length} movement${movements.length !== 1 ? 's' : ''} recorded`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by asset code or name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {movementFilters.map(s => (
            <button key={s} className={`badge cursor-pointer ${s === typeFilter ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'}`} onClick={() => setTypeFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Wrench className="h-10 w-10" />} title="No movements found" />
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="card flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-900/30">
                <Wrench className="h-5 w-5 text-accent-600 dark:text-accent-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{m.asset?.asset_code}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{m.asset?.name}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {m.movement_type} · {m.previous_status ?? '—'} → {m.new_status}
                </div>
                {m.notes && <div className="mt-0.5 text-xs text-slate-400">{m.notes}</div>}
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <div>{m.user_name}</div>
                <div>{formatDate(m.created_at, true)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
