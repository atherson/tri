import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Search } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { AssetAssignment } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function Assignments() {
  const { data: assignments, loading } = useSupabaseQuery<AssetAssignment>(TABLES.assignments, {
    select: '*, asset:equipment_assets(*), event:events(*), contract:rental_contracts(*)',
    order: { column: 'created_at', ascending: false },
  })
  const [search, setSearch] = useState('')

  const filtered = assignments.filter(a => {
    if (!search) return true
    const s = search.toLowerCase()
    return a.asset?.asset_code.toLowerCase().includes(s) || a.asset?.name.toLowerCase().includes(s) || a.assigned_to?.toLowerCase().includes(s)
  })

  if (loading) return <LoadingState label="Loading assignments..." />

  return (
    <div>
      <PageHeader title="Asset Assignments" subtitle={`${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`} />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search by asset or assignee..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Package className="h-10 w-10" />} title="No assignments found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="pb-3 pr-4 font-medium">Asset</th>
                <th className="pb-3 pr-4 font-medium">Event</th>
                <th className="pb-3 pr-4 font-medium">Contract</th>
                <th className="pb-3 pr-4 font-medium">Qty</th>
                <th className="pb-3 pr-4 font-medium">Required Period</th>
                <th className="pb-3 pr-4 font-medium">Assigned To</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b hover:bg-slate-50 dark:hover:bg-navy-800/50">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{a.asset?.asset_code ?? 'Quantity-based'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{a.asset?.name ?? `${a.quantity} units`}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {a.event && <Link to={`/events/${a.event_id}`} className="text-accent-600 hover:underline">{a.event.name}</Link>}
                  </td>
                  <td className="py-3 pr-4">
                    {a.contract && <Link to={`/contracts/${a.contract_id}`} className="text-accent-600 hover:underline">{a.contract.contract_number}</Link>}
                  </td>
                  <td className="py-3 pr-4">{a.quantity}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(a.required_start)} → {formatDate(a.required_end)}</td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{a.assigned_to ?? '—'}</td>
                  <td className="py-3 pr-4">{statusBadge(a.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
