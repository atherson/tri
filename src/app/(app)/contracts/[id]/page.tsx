'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { FileText, DollarSign, TrendingDown, Clock, AlertTriangle, Package } from 'lucide-react'
import { useSupabaseSingle, useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { RentalContract, RentalItem, AssetMovement, AssetAssignment } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState, Card, StatCard } from '@/components/ui'
import { formatCurrency, formatDate, hoursBetween } from '@/lib/utils'
import { computeContractCost } from '@/lib/costEngine'
import { useSyncData } from '@/hooks/useSyncData'

export default function ContractDetail() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data: contract, loading } = useSupabaseSingle<RentalContract>(TABLES.contracts, id, '*, supplier:suppliers(*), event:events(*)')
  const { data: rentalItems } = useSupabaseQuery<RentalItem>(TABLES.rentalItems, {
    select: '*, category:equipment_categories(*), asset:equipment_assets(*)',
  })
  const { data: movements } = useSupabaseQuery<AssetMovement>(TABLES.movements, {
    select: '*, asset:equipment_assets(*)',
    order: { column: 'created_at', ascending: false },
  })
  const { data: assignments } = useSupabaseQuery<AssetAssignment>(TABLES.assignments, {
    select: '*, asset:equipment_assets(*)',
  })
  const { allAlerts } = useSyncData()
  const [tab, setTab] = useState<'overview' | 'items' | 'cost' | 'alerts' | 'assignments'>('overview')

  if (loading) return <LoadingState label="Loading contract..." />
  if (!contract) return <EmptyState title="Contract not found" />

  const items = rentalItems.filter(i => i.contract_id === contract.id)
  const contractMovements = movements.filter(m => m.contract_id === contract.id)
  const contractAssignments = assignments.filter(a => a.contract_id === contract.id)
  const contractAlerts = allAlerts.filter(a => a.contract_id === contract.id)
  const cost = computeContractCost(contract, items, contractMovements)

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'items', label: `Rental Items (${items.length})` },
    { key: 'cost', label: 'Cost Breakdown' },
    { key: 'assignments', label: `Assignments (${contractAssignments.length})` },
    { key: 'alerts', label: `Alerts (${contractAlerts.length})` },
  ] as const

  return (
    <div>
      <PageHeader
        title={contract.title}
        subtitle={`${contract.contract_number} · ${contract.supplier?.name}`}
        breadcrumbs={[{ label: 'Contracts', to: '/contracts' }, { label: contract.contract_number }]}
        actions={statusBadge(contract.contract_status)}
      />

      <div className="mb-6 flex flex-wrap gap-1 border-b">
        {tabs.map(t => (
          <button key={t.key} className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? 'border-b-2 border-accent-500 text-accent-600 dark:text-accent-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Estimated Total" value={formatCurrency(contract.estimated_total)} icon={<DollarSign className="h-5 w-5" />} accent="navy" />
            <StatCard label="Actual Total" value={formatCurrency(cost.actualTotal)} icon={<TrendingDown className="h-5 w-5" />} accent="accent" />
            <StatCard label="Idle Cost" value={formatCurrency(cost.idleCost)} icon={<Clock className="h-5 w-5" />} accent="amber" />
            <StatCard label="Potential Savings" value={formatCurrency(cost.potentialSavings)} icon={<AlertTriangle className="h-5 w-5" />} accent="green" />
          </div>

          <Card title="Contract Details">
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Event</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{contract.event?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Billing Model</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{contract.billing_model}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Contract Start</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{formatDate(contract.contract_start, true)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Contract End</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{formatDate(contract.contract_end, true)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Delivery Date</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{contract.delivery_date ? formatDate(contract.delivery_date, true) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Collection Date</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{contract.collection_date ? formatDate(contract.collection_date, true) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Deposit</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(contract.deposit)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Payment Status</dt><dd>{statusBadge(contract.payment_status)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Grace Period</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{contract.grace_period_hours}h</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Min Duration</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{contract.minimum_duration_hours}h</dd></div>
            </dl>
            {contract.notes && <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-navy-800 dark:text-slate-300">{contract.notes}</div>}
          </Card>
        </div>
      )}

      {tab === 'items' && (
        <Card title="Rental Items">
          {items.length === 0 ? <EmptyState icon={<Package className="h-8 w-8" />} title="No rental items" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-slate-500 dark:text-slate-400">
                    <th className="pb-2 pr-4">Description</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">Qty</th>
                    <th className="pb-2 pr-4">Rate</th>
                    <th className="pb-2 pr-4">Rental Period</th>
                    <th className="pb-2 pr-4">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">{item.description}</td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{item.category?.name ?? '—'}</td>
                      <td className="py-2 pr-4">{item.quantity}</td>
                      <td className="py-2 pr-4">{formatCurrency(item.unit_rate)}</td>
                      <td className="py-2 pr-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.rental_start)} → {formatDate(item.rental_end)}</td>
                      <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">{formatCurrency(item.estimated_line_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'cost' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Subtotal" value={formatCurrency(cost.subtotal)} accent="navy" />
            <StatCard label="Tax" value={formatCurrency(cost.tax)} accent="navy" />
            <StatCard label="Discount" value={formatCurrency(cost.discount)} accent="green" />
            <StatCard label="Grand Total" value={formatCurrency(cost.grandTotal)} accent="accent" />
          </div>

          <Card title="Line Item Cost Breakdown">
            <div className="space-y-4">
              {cost.lines.map((l, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{l.description}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(l.actualCost ?? l.plannedCost)}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-4">
                    <div>Qty: {l.quantity}</div>
                    <div>Rate: {formatCurrency(l.unitRate)}</div>
                    <div>Planned: {l.plannedDurationHours.toFixed(1)}h</div>
                    <div>Actual: {l.actualDurationHours ? `${l.actualDurationHours.toFixed(1)}h` : '—'}</div>
                  </div>
                  <div className="mt-2 rounded bg-slate-50 p-2 font-mono text-xs text-slate-600 dark:bg-navy-800 dark:text-slate-400">
                    Formula: {l.formula}
                  </div>
                  {l.idleCost > 0 && (
                    <div className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Idle cost: {formatCurrency(l.idleCost)} (unused rental time)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'assignments' && (
        <Card title="Asset Assignments">
          {contractAssignments.length === 0 ? <EmptyState icon={<Package className="h-8 w-8" />} title="No assignments" /> : (
            <div className="space-y-2">
              {contractAssignments.map(a => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.asset?.asset_code ?? 'Quantity-based'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {a.asset?.name ?? `${a.quantity} units`} · {a.assigned_to ?? 'Unassigned'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(a.required_start)} → {formatDate(a.required_end)}</span>
                    {statusBadge(a.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          {contractAlerts.length === 0 ? <EmptyState icon={<AlertTriangle className="h-8 w-8" />} title="No alerts for this contract" /> : (
            contractAlerts.map(a => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.title}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{a.description}</div>
                    <div className="mt-2 text-xs text-slate-400">Detected: {a.detected_condition}</div>
                    <div className="mt-1 text-xs text-accent-600 dark:text-accent-400">Action: {a.recommended_action}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${a.severity === 'Critical' ? 'bg-red-600 text-white' : a.severity === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'}`}>{a.severity}</span>
                    {a.potential_savings > 0 && <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Save {formatCurrency(a.potential_savings)}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
