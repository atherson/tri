'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  CalendarDays, MapPin, User, DollarSign, Clock, AlertTriangle,
  FileText, Package, Wrench, TrendingDown, CheckCircle2, History,
} from 'lucide-react'
import { useSupabaseSingle, useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { Event, EventScheduleChange, RentalContract, RentalItem, AssetAssignment, AssetMovement } from '@/types'
import { PageHeader, statusBadge, severityBadge, LoadingState, EmptyState, Card, StatCard } from '@/components/ui'
import { formatCurrency, formatDate, hoursBetween, daysBetween } from '@/lib/utils'
import { useSyncData } from '@/hooks/useSyncData'
import { computeEventCost } from '@/lib/costEngine'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'

export default function EventDetail() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data: event, loading: evLoading } = useSupabaseSingle<Event>(TABLES.events, id, '*, venue:venues(*)')
  const { data: scheduleChanges } = useSupabaseQuery<EventScheduleChange>('event_schedule_changes', {
    filters: { event_id: id }, order: { column: 'created_at', ascending: false },
  })
  const { data: contracts } = useSupabaseQuery<RentalContract>(TABLES.contracts, {
    filters: { event_id: id }, select: '*, supplier:suppliers(*)',
  })
  const { data: rentalItems } = useSupabaseQuery<RentalItem>(TABLES.rentalItems, {
    select: '*, category:equipment_categories(*)',
  })
  const { data: assignments } = useSupabaseQuery<AssetAssignment>(TABLES.assignments, {
    filters: { event_id: id }, select: '*, asset:equipment_assets(*)',
  })
  const { data: movements } = useSupabaseQuery<AssetMovement>(TABLES.movements, {
    filters: { event_id: id }, select: '*, asset:equipment_assets(*)',
    order: { column: 'created_at', ascending: false },
  })
  const { allAlerts, costSummaries } = useSyncData()
  const [tab, setTab] = useState<'overview' | 'schedule' | 'contracts' | 'alerts' | 'cost' | 'movements'>('overview')

  if (evLoading) return <LoadingState label="Loading event..." />
  if (!event) return <EmptyState title="Event not found" />

  const evAlerts = allAlerts.filter(a => a.event_id === event.id)
  const evContracts = contracts.filter(c => c.event_id === event.id)
  const evItems = rentalItems.filter(i => evContracts.some(c => c.id === i.contract_id))
  const evMovements = movements.filter(m => m.event_id === event.id)
  const costSummary = costSummaries.get(event.id) ?? computeEventCost(event.budget, evContracts, evItems, evMovements)

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'schedule', label: 'Schedule History' },
    { key: 'contracts', label: 'Contracts' },
    { key: 'alerts', label: `Alerts (${evAlerts.length})` },
    { key: 'cost', label: 'Cost Summary' },
    { key: 'movements', label: `Movements (${evMovements.length})` },
  ] as const

  return (
    <div>
      <PageHeader
        title={event.name}
        subtitle={`${event.event_code} · ${event.client_name}`}
        breadcrumbs={[{ label: 'Events', to: '/events' }, { label: event.event_code }]}
        actions={statusBadge(event.status)}
      />

      <div className="mb-6 flex flex-wrap gap-1 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? 'border-b-2 border-accent-500 text-accent-600 dark:text-accent-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Budget" value={formatCurrency(event.budget)} icon={<DollarSign className="h-5 w-5" />} accent="navy" />
            <StatCard label="Estimated Cost" value={formatCurrency(costSummary.totalEstimated)} icon={<TrendingDown className="h-5 w-5" />} accent="accent" />
            <StatCard label="Actual Cost" value={formatCurrency(costSummary.totalActual)} icon={<DollarSign className="h-5 w-5" />} accent="navy" />
            <StatCard label="Potential Savings" value={formatCurrency(costSummary.totalPotentialSavings)} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Event Details">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Type</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{event.event_type}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Venue</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{event.venue?.name ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Expected Attendance</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{event.expected_attendance ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Priority</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{event.priority}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Setup Start</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{formatDate(event.setup_start, true)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Event Start</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{formatDate(event.event_start, true)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Event End</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{formatDate(event.event_end, true)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Dismantle End</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{formatDate(event.dismantle_end, true)}</dd></div>
              </dl>
              {event.notes && (
                <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  {event.notes}
                </div>
              )}
            </Card>

            <Card title="Synchronization Impact">
              {evAlerts.length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="No sync issues detected" />
              ) : (
                <div className="space-y-2">
                  {evAlerts.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <AlertTriangle className={`mt-0.5 h-4 w-4 ${a.severity === 'Critical' ? 'text-red-500' : a.severity === 'High' ? 'text-orange-500' : 'text-amber-500'}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{a.alert_type}</div>
                      </div>
                      {severityBadge(a.severity)}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <Card title="Schedule Change History">
          {scheduleChanges.length === 0 ? (
            <EmptyState icon={<History className="h-8 w-8" />} title="No schedule changes recorded" />
          ) : (
            <div className="space-y-3">
              {scheduleChanges.map(sc => (
                <div key={sc.id} className="flex items-start gap-3 rounded-lg border p-4">
                  <History className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Changed <span className="text-accent-600 dark:text-accent-400">{sc.field}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      From <span className="line-through">{formatDate(sc.previous_value, true)}</span>
                      {' '}to <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(sc.new_value, true)}</span>
                    </div>
                    {sc.reason && <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">Reason: {sc.reason}</div>}
                    <div className="mt-1 text-xs text-slate-400">{formatDate(sc.created_at, true)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'contracts' && (
        <div className="space-y-3">
          {evContracts.length === 0 ? (
            <EmptyState icon={<FileText className="h-8 w-8" />} title="No contracts for this event" />
          ) : (
            evContracts.map(c => (
              <Link href={`/contracts/${c.id}`} key={c.id} className="card flex items-center justify-between p-4 hover:border-accent-400">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.contract_number}</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{c.title}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {c.supplier?.name} · {formatDate(c.contract_start)} → {formatDate(c.contract_end)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(c.estimated_total)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{c.billing_model}</div>
                  </div>
                  {statusBadge(c.contract_status)}
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          {evAlerts.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="No alerts for this event" />
          ) : (
            evAlerts.map(a => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.title}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{a.description}</div>
                    <div className="mt-2 text-xs text-slate-400">Detected: {a.detected_condition}</div>
                    <div className="mt-1 text-xs text-accent-600 dark:text-accent-400">Action: {a.recommended_action}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {severityBadge(a.severity)}
                    {a.potential_savings > 0 && (
                      <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Save {formatCurrency(a.potential_savings)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'cost' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Budget" value={formatCurrency(event.budget)} icon={<DollarSign className="h-5 w-5" />} accent="navy" />
            <StatCard label="Estimated Total" value={formatCurrency(costSummary.totalEstimated)} icon={<TrendingDown className="h-5 w-5" />} accent="accent" />
            <StatCard label="Actual Total" value={formatCurrency(costSummary.totalActual)} icon={<DollarSign className="h-5 w-5" />} accent="navy" />
            <StatCard
              label="Budget Variance"
              value={formatCurrency(costSummary.budgetVariance)}
              icon={<AlertTriangle className="h-5 w-5" />}
              accent={costSummary.budgetVariance > 0 ? 'red' : 'green'}
              trend={{ value: `${costSummary.budgetVariancePercent.toFixed(1)}%`, positive: costSummary.budgetVariance <= 0 }}
            />
          </div>

          <Card title="Cost Breakdown by Contract">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costSummary.contracts.map(c => ({ name: c.contractNumber, estimated: c.estimatedTotal, actual: c.actualTotal, idle: c.idleCost }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="estimated" name="Estimated" fill="#3a5fa0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="idle" name="Idle Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Line Item Breakdown">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-slate-500 dark:text-slate-400">
                    <th className="pb-2 pr-4">Description</th>
                    <th className="pb-2 pr-4">Qty</th>
                    <th className="pb-2 pr-4">Rate</th>
                    <th className="pb-2 pr-4">Planned</th>
                    <th className="pb-2 pr-4">Actual</th>
                    <th className="pb-2 pr-4">Idle Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {costSummary.contracts.flatMap(c => c.lines).map((l, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">{l.description}</td>
                      <td className="py-2 pr-4">{l.quantity}</td>
                      <td className="py-2 pr-4">{formatCurrency(l.unitRate)}</td>
                      <td className="py-2 pr-4">{formatCurrency(l.plannedCost)}</td>
                      <td className="py-2 pr-4">{l.actualCost ? formatCurrency(l.actualCost) : '—'}</td>
                      <td className="py-2 pr-4">{l.idleCost > 0 ? <span className="text-amber-600">{formatCurrency(l.idleCost)}</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'movements' && (
        <Card title="Equipment Movements">
          {evMovements.length === 0 ? (
            <EmptyState icon={<Wrench className="h-8 w-8" />} title="No movements recorded" />
          ) : (
            <div className="space-y-2">
              {evMovements.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-50 dark:bg-accent-900/30">
                    <Wrench className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {m.asset?.asset_code} — {m.movement_type}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {m.previous_status} → {m.new_status} · {m.user_name} · {formatDate(m.created_at, true)}
                    </div>
                    {m.notes && <div className="mt-0.5 text-xs text-slate-400">{m.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
