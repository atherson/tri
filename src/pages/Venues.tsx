import { Building2, MapPin, Phone, Mail } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { Venue } from '@/types'
import { PageHeader, LoadingState, EmptyState } from '@/components/ui'

export default function Venues() {
  const { data: venues, loading } = useSupabaseQuery<Venue>(TABLES.venues, {
    order: { column: 'name', ascending: true },
  })

  if (loading) return <LoadingState label="Loading venues..." />

  return (
    <div>
      <PageHeader title="Venues" subtitle={`${venues.length} venue${venues.length !== 1 ? 's' : ''}`} />

      {venues.length === 0 ? (
        <EmptyState icon={<Building2 className="h-10 w-10" />} title="No venues found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venues.map(v => (
            <div key={v.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 dark:bg-navy-800">
                  <Building2 className="h-5 w-5 text-navy-600 dark:text-accent-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{v.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3 w-3" /> {v.address}, {v.region}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {v.phone ?? '—'}</div>
                <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {v.email ?? '—'}</div>
                <div>Capacity: {v.capacity ?? '—'}</div>
                <div>Power: {v.power_availability ?? '—'}</div>
              </div>
              {v.delivery_notes && (
                <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  {v.delivery_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
