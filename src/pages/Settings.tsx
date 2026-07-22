import { useState } from 'react'
import { Settings as SettingsIcon, Save, Database, RefreshCw } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES, supabase } from '@/lib/supabase'
import type { OrganizationSettings } from '@/types'
import { PageHeader, Card, LoadingState } from '@/components/ui'
import { seedDatabase } from '@/lib/seed'

export default function Settings() {
  const { data: settings, loading, refetch } = useSupabaseQuery<OrganizationSettings>(TABLES.settings)
  const [form, setForm] = useState<Partial<OrganizationSettings>>({})
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  const current = settings[0]
  const values = { ...current, ...form }

  if (loading) return <LoadingState label="Loading settings..." />

  const handleSave = async () => {
    if (!current) return
    setSaving(true)
    const { error } = await supabase.from(TABLES.settings).update(form).eq('id', current.id)
    setSaving(false)
    if (error) alert(`Error: ${error.message}`)
    else { refetch(); alert('Settings saved') }
  }

  const handleSeed = async () => {
    setSeeding(true)
    setSeedResult(null)
    const result = await seedDatabase()
    setSeeding(false)
    setSeedResult(`Inserted ${result.inserted} records. ${result.errors.length ? `Errors: ${result.errors.join(', ')}` : 'No errors.'}`)
    refetch()
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure synchronization thresholds and manage demo data" />

      <div className="space-y-6">
        <Card title="Synchronization Thresholds">
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            These thresholds control when the synchronization engine generates alerts. Adjust them to tune sensitivity.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Setup Allowance (hours before event setup)</label>
              <input type="number" className="input" value={values.setup_allowance_hours ?? 24} onChange={e => setForm(f => ({ ...f, setup_allowance_hours: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Idle Threshold (hours)</label>
              <input type="number" className="input" value={values.idle_threshold_hours ?? 48} onChange={e => setForm(f => ({ ...f, idle_threshold_hours: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Grace Period (hours after dismantle)</label>
              <input type="number" className="input" value={values.grace_period_hours ?? 24} onChange={e => setForm(f => ({ ...f, grace_period_hours: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Early Rental Threshold (hours)</label>
              <input type="number" className="input" value={values.early_rental_threshold_hours ?? 12} onChange={e => setForm(f => ({ ...f, early_rental_threshold_hours: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Late Rental Threshold (hours)</label>
              <input type="number" className="input" value={values.late_rental_threshold_hours ?? 6} onChange={e => setForm(f => ({ ...f, late_rental_threshold_hours: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Budget Warning (%)</label>
              <input type="number" className="input" value={values.budget_warning_percent ?? 80} onChange={e => setForm(f => ({ ...f, budget_warning_percent: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Currency</label>
              <input type="text" className="input" value={values.currency ?? 'KES'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </Card>

        <Card title="Demo Data Management">
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Load the complete demo scenario including the Nairobi Summer Music Festival with schedule changes, contracts, movements, and synchronization alerts.
          </p>
          <button className="btn-primary" onClick={handleSeed} disabled={seeding}>
            <RefreshCw className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} /> {seeding ? 'Seeding...' : 'Load Demo Data'}
          </button>
          {seedResult && (
            <div className="mt-4 rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-accent-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{seedResult}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
