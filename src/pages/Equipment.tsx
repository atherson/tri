import { useState } from 'react'
import { Search, Boxes, QrCode } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { EquipmentAsset } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState, Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'

const statusFilters = ['All', 'Available', 'In use', 'Idle', 'Delivered', 'Damaged', 'Missing', 'Returned']

export default function Equipment() {
  const { data: assets, loading } = useSupabaseQuery<EquipmentAsset>(TABLES.assets, {
    select: '*, category:equipment_categories(*), supplier:suppliers(*)',
    order: { column: 'asset_code', ascending: true },
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.asset_code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()) || (a.serial_number?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchStatus = statusFilter === 'All' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <LoadingState label="Loading equipment..." />

  return (
    <div>
      <PageHeader title="Equipment Inventory" subtitle={`${assets.length} asset${assets.length !== 1 ? 's' : ''}`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by code, name, or serial..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map(s => (
            <button key={s} className={`badge cursor-pointer ${s === statusFilter ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'}`} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Boxes className="h-10 w-10" />} title="No equipment found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(a => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100 dark:bg-navy-800">
                      <QrCode className="h-4 w-4 text-navy-600 dark:text-accent-400" />
                    </div>
                    <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">{a.asset_code}</div>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{a.name}</h3>
                </div>
                {statusBadge(a.status)}
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div>Category: {a.category?.name ?? '—'}</div>
                <div>Brand: {a.brand ?? '—'} {a.model ?? ''}</div>
                <div>Serial: {a.serial_number ?? 'N/A'}</div>
                <div>Condition: {a.condition}</div>
                <div>Location: {a.location ?? '—'}</div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Daily Rate</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(a.daily_rate)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Replacement</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(a.replacement_cost)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
