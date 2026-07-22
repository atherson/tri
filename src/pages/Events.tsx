import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, CalendarDays } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { Event } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState, Card } from '@/components/ui'
import { formatDate, formatCurrency } from '@/lib/utils'

const statusFilters = ['All', 'Draft', 'Planned', 'Approved', 'Active', 'Shortened', 'Completed', 'Cancelled']

export default function Events() {
  const { data: events, loading } = useSupabaseQuery<Event>(TABLES.events, {
    select: '*, venue:venues(*)',
    order: { column: 'event_start', ascending: false },
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = events.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.event_code.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <LoadingState label="Loading events..." />

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle={`${events.length} event${events.length !== 1 ? 's' : ''} total`}
        actions={<Link to="/events" className="btn-primary"><Plus className="h-4 w-4" /> New Event</Link>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map(s => (
            <button
              key={s}
              className={`badge cursor-pointer ${s === statusFilter ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="No events found" description="Try adjusting your filters or create a new event." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(ev => (
            <Link to={`/events/${ev.id}`} key={ev.id} className="card p-5 hover:border-accent-400 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{ev.event_code}</div>
                  <h3 className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">{ev.name}</h3>
                </div>
                {statusBadge(ev.status)}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{ev.description}</p>
              <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(ev.event_start, true)} → {formatDate(ev.event_end, true)}
                </div>
                <div>Client: {ev.client_name}</div>
                <div>Venue: {ev.venue?.name ?? '—'}</div>
                <div className="flex items-center justify-between pt-1">
                  <span>Budget: {formatCurrency(ev.budget)}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{ev.priority}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
