'use client'

import { ClipboardCheck, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { ApprovalRequest } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState, Card } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function Approvals() {
  const { data: approvals, loading } = useSupabaseQuery<ApprovalRequest>(TABLES.approvals, {
    order: { column: 'submitted_at', ascending: false },
  })

  if (loading) return <LoadingState label="Loading approvals..." />

  const pending = approvals.filter(a => a.status === 'Pending')

  return (
    <div>
      <PageHeader title="Approval Requests" subtitle={`${pending.length} pending approval${pending.length !== 1 ? 's' : ''}`} />

      {approvals.length === 0 ? (
        <EmptyState icon={<ClipboardCheck className="h-10 w-10" />} title="No approval requests" description="Approval requests are created when schedule changes, contract adjustments, or cost changes need sign-off." />
      ) : (
        <div className="space-y-3">
          {approvals.map(a => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {a.status === 'Approved' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : a.status === 'Rejected' ? <XCircle className="h-5 w-5 text-red-500" />
                      : <Clock className="h-5 w-5 text-amber-500" />}
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{a.request_type}</h3>
                  </div>
                  {a.reason && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{a.reason}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-4">
                    <div>Requester: {a.requester}</div>
                    <div>Approver: {a.approver ?? '—'}</div>
                    <div>Submitted: {formatDate(a.submitted_at, true)}</div>
                    <div>Amount: {formatCurrency(a.affected_amount)}</div>
                  </div>
                  {a.comments && <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600 dark:bg-navy-800 dark:text-slate-400">{a.comments}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {statusBadge(a.status)}
                  {a.status === 'Pending' && (
                    <div className="flex gap-1.5">
                      <button className="btn-primary text-xs px-3 py-1.5">Approve</button>
                      <button className="btn-secondary text-xs px-3 py-1.5">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
