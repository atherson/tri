'use client'

import { useState } from 'react'
import { Receipt, Search } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { Invoice } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState, StatCard } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function Invoices() {
  const { data: invoices, loading } = useSupabaseQuery<Invoice>(TABLES.invoices, {
    select: '*, supplier:suppliers(*), contract:rental_contracts(*), event:events(*)',
    order: { column: 'invoice_date', ascending: false },
  })
  const [search, setSearch] = useState('')

  const filtered = invoices.filter(i => !search || i.invoice_number.toLowerCase().includes(search.toLowerCase()) || i.supplier?.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingState label="Loading invoices..." />

  const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0)
  const totalPaid = invoices.reduce((s, i) => s + i.amount_paid, 0)
  const overdueCount = invoices.filter(i => i.payment_status === 'Overdue').length

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`} />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Outstanding" value={formatCurrency(totalOutstanding)} accent="amber" />
        <StatCard label="Total Paid" value={formatCurrency(totalPaid)} accent="green" />
        <StatCard label="Overdue" value={overdueCount} accent="red" />
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search by invoice number or supplier..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Receipt className="h-10 w-10" />} title="No invoices found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="pb-3 pr-4 font-medium">Invoice</th>
                <th className="pb-3 pr-4 font-medium">Supplier</th>
                <th className="pb-3 pr-4 font-medium">Event</th>
                <th className="pb-3 pr-4 font-medium">Issued</th>
                <th className="pb-3 pr-4 font-medium">Due</th>
                <th className="pb-3 pr-4 font-medium">Total</th>
                <th className="pb-3 pr-4 font-medium">Balance</th>
                <th className="pb-3 pr-4 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} className="border-b hover:bg-slate-50 dark:hover:bg-navy-800/50">
                  <td className="py-3 pr-4 font-mono text-xs text-slate-800 dark:text-slate-200">{i.invoice_number}</td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{i.supplier?.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{i.event?.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(i.invoice_date)}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(i.due_date)}</td>
                  <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">{formatCurrency(i.total)}</td>
                  <td className="py-3 pr-4 font-medium text-amber-600 dark:text-amber-400">{formatCurrency(i.balance)}</td>
                  <td className="py-3 pr-4">{statusBadge(i.payment_status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
