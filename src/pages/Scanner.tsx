import { useState } from 'react'
import { ScanLine, QrCode, Search } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import type { EquipmentAsset } from '@/types'
import { PageHeader, statusBadge, LoadingState, EmptyState, Card } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function Scanner() {
  const { data: assets, loading } = useSupabaseQuery<EquipmentAsset>(TABLES.assets, {
    select: '*, category:equipment_categories(*), supplier:suppliers(*)',
    order: { column: 'asset_code', ascending: true },
  })
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<EquipmentAsset | null>(null)

  const filtered = assets.filter(a => !search || a.asset_code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingState label="Loading scanner..." />

  return (
    <div>
      <PageHeader title="QR Scanner" subtitle="Scan or search for an asset to view details and record movements" />

      <div className="mb-6 rounded-xl border-2 border-dashed border-accent-300 bg-accent-50/50 p-8 text-center dark:bg-accent-900/10 dark:border-accent-700">
        <ScanLine className="mx-auto h-12 w-12 text-accent-500" />
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Camera-based QR scanning would activate here on a mobile device with camera permissions.</p>
        <p className="mt-1 text-xs text-slate-500">For this demo, search for an asset below to simulate a scan.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search asset code or name to simulate scan..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-2">
            {filtered.slice(0, 10).map(a => (
              <button key={a.id} onClick={() => setSelected(a)} className={`card flex w-full items-center gap-3 p-3 text-left hover:border-accent-400 ${selected?.id === a.id ? 'border-accent-500 ring-1 ring-accent-400' : ''}`}>
                <QrCode className="h-5 w-5 text-navy-600 dark:text-accent-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.asset_code}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{a.name}</div>
                </div>
                {statusBadge(a.status)}
              </button>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <Card title="Scanned Asset Details">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-navy-100 dark:bg-navy-800">
                  <QrCode className="h-8 w-8 text-navy-600 dark:text-accent-400" />
                </div>
                <div>
                  <div className="text-sm font-mono text-slate-500 dark:text-slate-400">{selected.asset_code}</div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{selected.name}</h3>
                  {statusBadge(selected.status)}
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Category</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{selected.category?.name ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Brand/Model</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{selected.brand} {selected.model}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Serial</dt><dd className="font-mono text-slate-800 dark:text-slate-200">{selected.serial_number ?? 'N/A'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Condition</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{selected.condition}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Location</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{selected.location ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Daily Rate</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(selected.daily_rate)}</dd></div>
              </dl>
              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Quick Actions (Authenticated)</div>
                <div className="flex flex-wrap gap-2">
                  {['Check In', 'Install', 'Mark In Use', 'Mark Idle', 'Check Out', 'Report Damage'].map(action => (
                    <button key={action} className="btn-secondary text-xs">{action}</button>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState icon={<QrCode className="h-10 w-10" />} title="No asset selected" description="Search and select an asset to simulate a QR scan." />
          )}
        </div>
      </div>
    </div>
  )
}
