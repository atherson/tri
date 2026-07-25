'use client'

import { useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { AuditLog } from '@/types'
import { PageHeader, LoadingState, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function AuditLogs() {
  const { data: logs, loading } = useSupabaseQuery<AuditLog>(TABLES.auditLogs, {
    order: { column: 'created_at', ascending: false },
  })
  const [search, setSearch] = useState('')

  const filtered = logs.filter(l => !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.user_name.toLowerCase().includes(search.toLowerCase()) || l.entity_type?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingState label="Loading audit logs..." />

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle={`${logs.length} log entr${logs.length !== 1 ? 'y' : 'ies'}`} />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search by action, user, or entity..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-10 w-10" />} title="No audit logs found" />
      ) : (
        <div className="space-y-2">
          {filtered.map(l => (
            <div key={l.id} className="card flex items-start gap-3 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100 dark:bg-navy-800">
                <ScrollText className="h-4 w-4 text-navy-600 dark:text-accent-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-navy-100 px-1.5 py-0.5 font-mono text-xs text-navy-700 dark:bg-navy-800 dark:text-accent-300">{l.action}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{l.user_name}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {l.entity_type ?? '—'} {l.entity_id ? `· ${l.entity_id.slice(0, 8)}...` : ''}
                </div>
                {l.new_values && (
                  <div className="mt-1 rounded bg-slate-50 p-2 font-mono text-xs text-slate-600 dark:bg-navy-800 dark:text-slate-400">
                    {JSON.stringify(l.new_values)}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{formatDate(l.created_at, true)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
