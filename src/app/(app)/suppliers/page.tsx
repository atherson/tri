'use client'

import { Truck, Phone, Mail, Star } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { Supplier } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState } from '@/components/ui'

export default function Suppliers() {
  const { data: suppliers, loading } = useSupabaseQuery<Supplier>(TABLES.suppliers, {
    order: { column: 'name', ascending: true },
  })

  if (loading) return <LoadingState label="Loading suppliers..." />

  return (
    <div>
      <PageHeader title="Suppliers" subtitle={`${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''}`} />

      {suppliers.length === 0 ? (
        <EmptyState icon={<Truck className="h-10 w-10" />} title="No suppliers found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map(s => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 dark:bg-navy-800">
                    <Truck className="h-5 w-5 text-navy-600 dark:text-accent-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{s.name}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{s.code} · {s.category}</div>
                  </div>
                </div>
                {statusBadge(s.status)}
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div>{s.contact_person ?? '—'}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {s.phone ?? '—'}</div>
                <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {s.email ?? '—'}</div>
                <div>Payment Terms: {s.payment_terms ?? '—'}</div>
              </div>
              {s.rating && (
                <div className="mt-3 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
