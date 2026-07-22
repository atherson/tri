/*
# EventSync Core Schema

## Purpose
Centralized event operations platform that connects event scheduling, rental contracts,
equipment assignments, asset tracking, synchronization alerts, and cost control.

## New Tables (all single-tenant demo — anon+authenticated CRUD)
1. `venues` — event locations with GPS, capacity, delivery notes
2. `suppliers` — rental equipment suppliers with categories and ratings
3. `equipment_categories` — equipment types with default rates and serialized flag
4. `equipment_assets` — individual serialized assets with QR codes, status, condition
5. `events` — events with setup/event/dismantle dates, budget, status, priority
6. `event_schedule_changes` — history of event date changes (never overwrite silently)
7. `equipment_requirements` — planned equipment needs per event before contracting
8. `rental_contracts` — contracts with billing model, costs, statuses, terms
9. `rental_items` — line items within contracts with rates and dates
10. `asset_assignments` — assignment of assets/quantities to events
11. `asset_movements` — full movement history (dispatched, delivered, installed, etc.)
12. `synchronization_alerts` — detected misalignment alerts with savings calculations
13. `approval_requests` — workflow approvals for changes and costs
14. `incidents` — damage, missing, late delivery reports
15. `invoices` — supplier invoices linked to contracts
16. `payments` — payments recorded against invoices
17. `audit_logs` — action audit trail
18. `organization_settings` — configurable sync thresholds

## Security
- RLS enabled on every table.
- Single-tenant demo: anon + authenticated CRUD allowed (data is intentionally shared).
*/

-- VENUES
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  region text NOT NULL,
  latitude double precision,
  longitude double precision,
  contact_person text,
  phone text,
  email text,
  capacity integer,
  delivery_notes text,
  setup_restrictions text,
  power_availability text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_venues" ON venues;
CREATE POLICY "anon_crud_venues" ON venues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  tax_number text,
  payment_terms text,
  category text NOT NULL,
  rating numeric(2,1),
  status text NOT NULL DEFAULT 'Active',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_suppliers" ON suppliers;
CREATE POLICY "anon_crud_suppliers" ON suppliers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- EQUIPMENT CATEGORIES
CREATE TABLE IF NOT EXISTS equipment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit_of_measurement text NOT NULL DEFAULT 'unit',
  default_daily_rate numeric(12,2) NOT NULL DEFAULT 0,
  default_replacement_cost numeric(12,2) NOT NULL DEFAULT 0,
  serialized boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_categories" ON equipment_categories;
CREATE POLICY "anon_crud_categories" ON equipment_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- EQUIPMENT ASSETS
CREATE TABLE IF NOT EXISTS equipment_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code text NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES equipment_categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  brand text,
  model text,
  serial_number text,
  status text NOT NULL DEFAULT 'Available',
  condition text NOT NULL DEFAULT 'Good',
  location text,
  daily_rate numeric(12,2) NOT NULL DEFAULT 0,
  replacement_cost numeric(12,2) NOT NULL DEFAULT 0,
  last_maintenance_date date,
  next_maintenance_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE equipment_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_assets" ON equipment_assets;
CREATE POLICY "anon_crud_assets" ON equipment_assets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_code text NOT NULL,
  description text,
  client_name text NOT NULL,
  event_type text NOT NULL,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  setup_start timestamptz NOT NULL,
  event_start timestamptz NOT NULL,
  event_end timestamptz NOT NULL,
  dismantle_end timestamptz NOT NULL,
  expected_attendance integer,
  budget numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft',
  priority text NOT NULL DEFAULT 'Medium',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_events" ON events;
CREATE POLICY "anon_crud_events" ON events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- EVENT SCHEDULE CHANGES
CREATE TABLE IF NOT EXISTS event_schedule_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field text NOT NULL,
  previous_value text NOT NULL,
  new_value text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE event_schedule_changes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_schedule_changes" ON event_schedule_changes;
CREATE POLICY "anon_crud_schedule_changes" ON event_schedule_changes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- EQUIPMENT REQUIREMENTS
CREATE TABLE IF NOT EXISTS equipment_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id uuid REFERENCES equipment_categories(id) ON DELETE SET NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1,
  required_from timestamptz NOT NULL,
  required_until timestamptz NOT NULL,
  priority text NOT NULL DEFAULT 'Medium',
  specifications text,
  preferred_supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  estimated_cost numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE equipment_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_requirements" ON equipment_requirements;
CREATE POLICY "anon_crud_requirements" ON equipment_requirements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- RENTAL CONTRACTS
CREATE TABLE IF NOT EXISTS rental_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  contract_start timestamptz NOT NULL,
  contract_end timestamptz NOT NULL,
  delivery_date timestamptz,
  collection_date timestamptz,
  billing_model text NOT NULL DEFAULT 'Daily',
  currency text NOT NULL DEFAULT 'KES',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  deposit numeric(14,2) NOT NULL DEFAULT 0,
  estimated_total numeric(14,2) NOT NULL DEFAULT 0,
  actual_final_cost numeric(14,2),
  payment_status text NOT NULL DEFAULT 'Unpaid',
  contract_status text NOT NULL DEFAULT 'Draft',
  cancellation_terms text,
  extension_terms text,
  late_return_charges text,
  grace_period_hours integer NOT NULL DEFAULT 24,
  minimum_duration_hours integer NOT NULL DEFAULT 24,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_contracts" ON rental_contracts;
CREATE POLICY "anon_crud_contracts" ON rental_contracts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- RENTAL ITEMS
CREATE TABLE IF NOT EXISTS rental_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES equipment_categories(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES equipment_assets(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_rate numeric(12,2) NOT NULL DEFAULT 0,
  rental_start timestamptz NOT NULL,
  rental_end timestamptz NOT NULL,
  billable_units numeric(12,2) NOT NULL DEFAULT 0,
  estimated_line_cost numeric(14,2) NOT NULL DEFAULT 0,
  actual_line_cost numeric(14,2),
  utilization_status text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE rental_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_rental_items" ON rental_items;
CREATE POLICY "anon_crud_rental_items" ON rental_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ASSET ASSIGNMENTS
CREATE TABLE IF NOT EXISTS asset_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  rental_item_id uuid REFERENCES rental_items(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES equipment_assets(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  required_start timestamptz NOT NULL,
  required_end timestamptz NOT NULL,
  assigned_to text,
  status text NOT NULL DEFAULT 'Reserved',
  current_location text,
  check_in_status text,
  check_out_status text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_assignments" ON asset_assignments;
CREATE POLICY "anon_crud_assignments" ON asset_assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ASSET MOVEMENTS
CREATE TABLE IF NOT EXISTS asset_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES equipment_assets(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE SET NULL,
  movement_type text NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  previous_location text,
  new_location text,
  user_name text NOT NULL DEFAULT 'System',
  notes text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE asset_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_movements" ON asset_movements;
CREATE POLICY "anon_crud_movements" ON asset_movements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- SYNCHRONIZATION ALERTS
CREATE TABLE IF NOT EXISTS synchronization_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'Medium',
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE SET NULL,
  rental_item_id uuid REFERENCES rental_items(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES equipment_assets(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  detected_condition text NOT NULL,
  recommended_action text NOT NULL DEFAULT 'Review and take corrective action.',
  estimated_financial_impact numeric(14,2) NOT NULL DEFAULT 0,
  potential_savings numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'New',
  assigned_to text,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE synchronization_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_alerts" ON synchronization_alerts;
CREATE POLICY "anon_crud_alerts" ON synchronization_alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- APPROVAL REQUESTS
CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL,
  requester text NOT NULL,
  approver text,
  status text NOT NULL DEFAULT 'Pending',
  reason text,
  affected_amount numeric(14,2) NOT NULL DEFAULT 0,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE SET NULL,
  alert_id uuid REFERENCES synchronization_alerts(id) ON DELETE SET NULL,
  comments text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_approvals" ON approval_requests;
CREATE POLICY "anon_crud_approvals" ON approval_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- INCIDENTS
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES equipment_assets(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'Medium',
  description text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  reported_by text NOT NULL DEFAULT 'System',
  assigned_to text,
  status text NOT NULL DEFAULT 'Open',
  resolution_notes text,
  estimated_cost_impact numeric(14,2) NOT NULL DEFAULT 0,
  final_cost_impact numeric(14,2),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_incidents" ON incidents;
CREATE POLICY "anon_crud_incidents" ON incidents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  contract_id uuid NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  amount_paid numeric(14,2) NOT NULL DEFAULT 0,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  approval_status text NOT NULL DEFAULT 'Pending',
  payment_status text NOT NULL DEFAULT 'Unpaid',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_invoices" ON invoices;
CREATE POLICY "anon_crud_invoices" ON invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  method text NOT NULL,
  reference text,
  payment_date date NOT NULL,
  recorded_by text NOT NULL DEFAULT 'System',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_payments" ON payments;
CREATE POLICY "anon_crud_payments" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL DEFAULT 'System',
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  previous_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_audit_logs" ON audit_logs;
CREATE POLICY "anon_crud_audit_logs" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ORGANIZATION SETTINGS
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_allowance_hours numeric(6,2) NOT NULL DEFAULT 24,
  idle_threshold_hours numeric(6,2) NOT NULL DEFAULT 48,
  grace_period_hours numeric(6,2) NOT NULL DEFAULT 24,
  early_rental_threshold_hours numeric(6,2) NOT NULL DEFAULT 12,
  late_rental_threshold_hours numeric(6,2) NOT NULL DEFAULT 6,
  budget_warning_percent numeric(5,2) NOT NULL DEFAULT 80,
  currency text NOT NULL DEFAULT 'KES'
);
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_settings" ON organization_settings;
CREATE POLICY "anon_crud_settings" ON organization_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_assets_category ON equipment_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_supplier ON equipment_assets(supplier_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON equipment_assets(status);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_contracts_event ON rental_contracts(event_id);
CREATE INDEX IF NOT EXISTS idx_contracts_supplier ON rental_contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON rental_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_items_contract ON rental_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_assignments_event ON asset_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_asset ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_movements_asset ON asset_movements(asset_id);
CREATE INDEX IF NOT EXISTS idx_movements_event ON asset_movements(event_id);
CREATE INDEX IF NOT EXISTS idx_alerts_event ON synchronization_alerts(event_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON synchronization_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON synchronization_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
