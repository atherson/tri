import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  console.error('Missing Supabase env vars. Check .env for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: { persistSession: false },
})

export const TABLES = {
  events: 'events',
  venues: 'venues',
  suppliers: 'suppliers',
  categories: 'equipment_categories',
  assets: 'equipment_assets',
  requirements: 'equipment_requirements',
  contracts: 'rental_contracts',
  rentalItems: 'rental_items',
  assignments: 'asset_assignments',
  movements: 'asset_movements',
  alerts: 'synchronization_alerts',
  approvals: 'approval_requests',
  incidents: 'incidents',
  invoices: 'invoices',
  payments: 'payments',
  auditLogs: 'audit_logs',
  settings: 'organization_settings',
} as const
