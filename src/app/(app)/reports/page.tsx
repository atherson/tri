'use client'

import { useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { useSyncData } from '@/hooks/useSyncData'
import { PageHeader, Card, StatCard, LoadingState } from '@/components/ui'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'

export default function Reports() {
  const { events, contracts, rentalItems, assignments, movements, allAlerts, costSummaries, loading } = useSyncData()
  const [report, setReport] = useState<'costs' | 'utilization' | 'savings' | 'supplier'>('costs')

  if (loading) return <LoadingState label="Loading reports..." />

  const totalEstimated = Array.from(costSummaries.values()).reduce((s, c) => s + c.totalEstimated, 0)
  const totalActual = Array.from(costSummaries.values()).reduce((s, c) => s + c.totalActual, 0)
  const totalSavings = Array.from(costSummaries.values()).reduce((s, c) => s + c.totalPotentialSavings, 0)

  const reports = [
    { key: 'costs', label: 'Rental Costs' },
    { key: 'utilization', label: 'Equipment Utilization' },
    { key: 'savings', label: 'Savings Analysis' },
    { key: 'supplier', label: 'Supplier Spending' },
  ] as const

  const costByEvent = events.map(ev => {
    const cs = costSummaries.get(ev.id)
    return { name: ev.event_code, estimated: cs?.totalEstimated ?? 0, actual: cs?.totalActual ?? 0, budget: ev.budget }
  })

  const utilizationData = assignments.map(a => {
    const reqHours = (new Date(a.required_end).getTime() - new Date(a.required_start).getTime()) / 36e5
    const assetMovements = movements.filter(m => m.asset_id === a.asset_id)
    const inUse = assetMovements.filter(m => ['Marked in use', 'Installed'].includes(m.movement_type))
    const out = assetMovements.filter(m => ['Checked out', 'Collected', 'Returned'].includes(m.movement_type))
    let usedHours = 0
    if (inUse.length > 0 && out.length > 0) {
      usedHours = (new Date(out[out.length - 1].created_at).getTime() - new Date(inUse[0].created_at).getTime()) / 36e5
    }
    return {
      name: a.asset?.asset_code ?? 'N/A',
      utilization: reqHours > 0 ? Math.min(100, (usedHours / reqHours) * 100) : 0,
      idle: reqHours > 0 ? Math.max(0, 100 - (usedHours / reqHours) * 100) : 100,
    }
  })

  const supplierSpending: Record<string, number> = {}
  for (const c of contracts) {
    const supplierName = c.supplier?.name ?? 'Unknown'
    supplierSpending[supplierName] = (supplierSpending[supplierName] ?? 0) + c.estimated_total
  }
  const supplierData = Object.entries(supplierSpending).map(([name, value]) => ({ name, value }))
  const supplierColors = ['#3a5fa0', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Filterable operational and financial reports" />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Estimated" value={formatCurrency(totalEstimated)} accent="navy" />
        <StatCard label="Total Actual" value={formatCurrency(totalActual)} accent="accent" />
        <StatCard label="Potential Savings" value={formatCurrency(totalSavings)} accent="green" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {reports.map(r => (
          <button key={r.key} className={`badge cursor-pointer ${r.key === report ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'}`} onClick={() => setReport(r.key)}>{r.label}</button>
        ))}
      </div>

      {report === 'costs' && (
        <Card title="Rental Cost by Event" actions={<button className="btn-ghost text-xs"><Download className="h-3.5 w-3.5" /> Export CSV</button>}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={costByEvent}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="estimated" name="Estimated" fill="#3a5fa0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="budget" name="Budget" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {report === 'utilization' && (
        <Card title="Equipment Utilization Rate" actions={<button className="btn-ghost text-xs"><Download className="h-3.5 w-3.5" /> Export CSV</button>}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => formatPercent(v)} />
              <Legend />
              <Bar dataKey="utilization" name="Utilized" fill="#06b6d4" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="idle" name="Idle" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {report === 'savings' && (
        <div className="space-y-4">
          <Card title="Potential vs Confirmed Savings">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={events.map(ev => {
                const cs = costSummaries.get(ev.id)
                return { name: ev.event_code, potential: cs?.totalPotentialSavings ?? 0, confirmed: cs?.totalConfirmedSavings ?? 0 }
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="potential" name="Potential" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="confirmed" name="Confirmed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Alerts Driving Savings">
            <div className="space-y-2">
              {allAlerts.filter(a => a.potential_savings > 0).slice(0, 10).map(a => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{a.alert_type}</div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(a.potential_savings)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {report === 'supplier' && (
        <Card title="Spending by Supplier">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={supplierData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {supplierData.map((_, i) => <Cell key={i} fill={supplierColors[i % supplierColors.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {supplierData.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: supplierColors[i % supplierColors.length] }} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
