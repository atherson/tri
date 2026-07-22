import { Link } from 'react-router-dom'
import {
  CalendarDays, FileText, AlertTriangle, Package,
  TrendingDown, Clock, ShieldAlert, CheckCircle2, Boxes, Wrench,
} from 'lucide-react'
import { useSyncData } from '@/hooks/useSyncData'
import { useApp } from '@/providers/AppProvider'
import { StatCard, PageHeader, Card, severityBadge, statusBadge, LoadingState, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

export default function Dashboard() {
  const { role } = useApp()
  const { events, contracts, assignments, movements, allAlerts, costSummaries, loading } = useSyncData()

  if (loading) return <LoadingState label="Loading EventSync dashboard..." />

  const activeEvents = events.filter(e => ['Active', 'Approved', 'Planned'].includes(e.status))
  const assetsInUse = assignments.filter(a => a.status === 'In use').length
  const idleAssets = movements.filter(m => m.new_status === 'Idle').length
  const criticalAlerts = allAlerts.filter(a => a.severity === 'Critical')
  const highAlerts = allAlerts.filter(a => a.severity === 'High')

  const totalEstimated = Array.from(costSummaries.values()).reduce((s, c) => s + c.totalEstimated, 0)
  const totalActual = Array.from(costSummaries.values()).reduce((s, c) => s + c.totalActual, 0)
  const totalPotentialSavings = Array.from(costSummaries.values()).reduce((s, c) => s + c.totalPotentialSavings, 0)

  const costData = events.map(ev => {
    const cs = costSummaries.get(ev.id)
    return {
      name: ev.event_code,
      estimated: cs?.totalEstimated ?? 0,
      actual: cs?.totalActual ?? 0,
      budget: ev.budget,
    }
  })

  const alertSeverityData = [
    { name: 'Critical', value: allAlerts.filter(a => a.severity === 'Critical').length, fill: '#dc2626' },
    { name: 'High', value: allAlerts.filter(a => a.severity === 'High').length, fill: '#ea580c' },
    { name: 'Medium', value: allAlerts.filter(a => a.severity === 'Medium').length, fill: '#f59e0b' },
    { name: 'Low', value: allAlerts.filter(a => a.severity === 'Low').length, fill: '#64748b' },
  ].filter(d => d.value > 0)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back. You are viewing as ${role}.`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Events" value={activeEvents.length} icon={<CalendarDays className="h-5 w-5" />} accent="accent" />
        <StatCard label="Active Contracts" value={contracts.filter(c => c.contract_status === 'Active').length} icon={<FileText className="h-5 w-5" />} accent="navy" />
        <StatCard label="Assets In Use" value={assetsInUse} icon={<Package className="h-5 w-5" />} accent="green" />
        <StatCard label="Critical Alerts" value={criticalAlerts.length} icon={<AlertTriangle className="h-5 w-5" />} accent="red" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Estimated Cost" value={formatCurrency(totalEstimated)} icon={<TrendingDown className="h-5 w-5" />} accent="navy" />
        <StatCard label="Total Actual Cost" value={formatCurrency(totalActual)} icon={<TrendingDown className="h-5 w-5" />} accent="navy" />
        <StatCard label="Potential Savings" value={formatCurrency(totalPotentialSavings)} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard label="Idle Assets" value={idleAssets} icon={<Clock className="h-5 w-5" />} accent="amber" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Estimated vs Actual Cost by Event">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="estimated" name="Estimated" fill="#3a5fa0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="budget" name="Budget" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Alerts by Severity">
          {alertSeverityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={alertSeverityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {alertSeverityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<CheckCircle2 className="h-10 w-10" />} title="No alerts detected" description="All events are synchronized." />
          )}
        </Card>
      </div>

      {/* Recent alerts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Top Synchronization Alerts" actions={<Link to="/alerts" className="text-xs font-medium text-accent-600 hover:underline">View all</Link>}>
          {allAlerts.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="No alerts" />
          ) : (
            <div className="space-y-3">
              {allAlerts.slice(0, 5).map(alert => (
                <Link to="/alerts" key={alert.id} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-slate-50 dark:hover:bg-navy-800">
                  <div className="mt-0.5">
                    {alert.severity === 'Critical' ? <ShieldAlert className="h-5 w-5 text-red-500" />
                      : alert.severity === 'High' ? <AlertTriangle className="h-5 w-5 text-orange-500" />
                      : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{alert.title}</div>
                      {severityBadge(alert.severity)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{alert.alert_type}</div>
                    {alert.potential_savings > 0 && (
                      <div className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Potential savings: {formatCurrency(alert.potential_savings)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent Events" actions={<Link to="/events" className="text-xs font-medium text-accent-600 hover:underline">View all</Link>}>
          <div className="space-y-3">
            {events.slice(0, 5).map(ev => {
              const cs = costSummaries.get(ev.id)
              return (
                <Link to={`/events/${ev.id}`} key={ev.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-slate-50 dark:hover:bg-navy-800">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{ev.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {ev.event_code} · {formatDate(ev.event_start, true)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cs && cs.budgetVariance !== 0 && (
                      <span className={`text-xs font-medium ${cs.budgetVariance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {formatPercent(cs.budgetVariancePercent)}
                      </span>
                    )}
                    {statusBadge(ev.status)}
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link to="/events" className="card flex flex-col items-center gap-2 p-4 hover:border-accent-400 hover:shadow-md">
          <CalendarDays className="h-6 w-6 text-navy-600 dark:text-accent-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Events</span>
        </Link>
        <Link to="/contracts" className="card flex flex-col items-center gap-2 p-4 hover:border-accent-400 hover:shadow-md">
          <FileText className="h-6 w-6 text-navy-600 dark:text-accent-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Contracts</span>
        </Link>
        <Link to="/equipment" className="card flex flex-col items-center gap-2 p-4 hover:border-accent-400 hover:shadow-md">
          <Boxes className="h-6 w-6 text-navy-600 dark:text-accent-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Equipment</span>
        </Link>
        <Link to="/movements" className="card flex flex-col items-center gap-2 p-4 hover:border-accent-400 hover:shadow-md">
          <Wrench className="h-6 w-6 text-navy-600 dark:text-accent-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Movements</span>
        </Link>
      </div>
    </div>
  )
}
