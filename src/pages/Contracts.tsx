import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, FileText } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { RentalContract } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusFilters = ['All', 'Draft', 'Pending approval', 'Approved', 'Active', 'Completed', 'Cancelled']

export default function Contracts() {
  const { data: contracts, loading } = useSupabaseQuery<RentalContract>(TABLES.contracts, {
    select: '*, supplier:suppliers(*), event:events(*)',
    order: { column: 'created_at', ascending: false },
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = contracts.filter(c => {
    const matchSearch = !search || c.contract_number.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || c.contract_status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <LoadingState label="Loading contracts..." />

  return (
    <div>
      <PageHeader
        title="Rental Contracts"
        subtitle={`${contracts.length} contract${contracts.length !== 1 ? 's' : ''} total`}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by contract number or title..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map(s => (
            <button key={s} className={`badge cursor-pointer ${s === statusFilter ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'}`} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText className="h-10 w-10" />} title="No contracts found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="pb-3 pr-4 font-medium">Contract</th>
                <th className="pb-3 pr-4 font-medium">Supplier</th>
                <th className="pb-3 pr-4 font-medium">Event</th>
                <th className="pb-3 pr-4 font-medium">Period</th>
                <th className="pb-3 pr-4 font-medium">Billing</th>
                <th className="pb-3 pr-4 font-medium">Estimated</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b hover:bg-slate-50 dark:hover:bg-navy-800/50">
                  <td className="py-3 pr-4">
                    <Link to={`/contracts/${c.id}`} className="font-medium text-accent-600 hover:underline">{c.contract_number}</Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{c.title}</div>
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{c.supplier?.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{c.event?.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(c.contract_start)} → {formatDate(c.contract_end)}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{c.billing_model}</td>
                  <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">{formatCurrency(c.estimated_total)}</td>
                  <td className="py-3 pr-4">{statusBadge(c.contract_status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
