export type EventStatus =
  | 'Draft' | 'Planned' | 'Approved' | 'Active' | 'Postponed'
  | 'Extended' | 'Shortened' | 'Relocated' | 'Cancelled' | 'Completed' | 'Archived'

export type AssetStatus =
  | 'Available' | 'Reserved' | 'Scheduled' | 'In transit' | 'Delivered'
  | 'Checked in' | 'Installed' | 'In use' | 'Idle' | 'Awaiting dismantling'
  | 'Awaiting collection' | 'Collected' | 'Returned' | 'Damaged' | 'Missing'
  | 'Under maintenance' | 'Unavailable' | 'Retired'

export type AssetCondition = 'New' | 'Excellent' | 'Good' | 'Fair' | 'Damaged' | 'Unusable'

export type BillingModel =
  | 'Hourly' | 'Daily' | 'Weekly' | 'Fixed price' | 'Per item' | 'Per quantity' | 'Custom'

export type ContractStatus =
  | 'Draft' | 'Pending approval' | 'Approved' | 'Active' | 'Change requested'
  | 'Extended' | 'Shortened' | 'Cancelled' | 'Completed' | 'Disputed' | 'Archived'

export type PaymentStatus =
  | 'Unpaid' | 'Partially paid' | 'Paid' | 'Overdue' | 'Refunded' | 'Disputed'

export type AlertSeverity = 'Informational' | 'Low' | 'Medium' | 'High' | 'Critical'
export type AlertStatus = 'New' | 'Acknowledged' | 'Under review' | 'Action required' | 'Approved' | 'Resolved' | 'Dismissed'

export type MovementType =
  | 'Reserved' | 'Dispatched' | 'In transit' | 'Delivered' | 'Checked in'
  | 'Installed' | 'Activated' | 'Marked in use' | 'Marked idle' | 'Dismantled'
  | 'Checked out' | 'Collected' | 'Returned' | 'Transferred' | 'Damaged' | 'Missing'

export interface Venue {
  id: string
  name: string
  address: string
  region: string
  latitude: number | null
  longitude: number | null
  contact_person: string | null
  phone: string | null
  email: string | null
  capacity: number | null
  delivery_notes: string | null
  setup_restrictions: string | null
  power_availability: string | null
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  code: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  tax_number: string | null
  payment_terms: string | null
  category: string
  rating: number | null
  status: string
  notes: string | null
  created_at: string
}

export interface EquipmentCategory {
  id: string
  name: string
  description: string | null
  unit_of_measurement: string
  default_daily_rate: number
  default_replacement_cost: number
  serialized: boolean
  created_at: string
}

export interface EquipmentAsset {
  id: string
  asset_code: string
  name: string
  description: string | null
  category_id: string
  supplier_id: string | null
  brand: string | null
  model: string | null
  serial_number: string | null
  status: AssetStatus
  condition: AssetCondition
  location: string | null
  daily_rate: number
  replacement_cost: number
  last_maintenance_date: string | null
  next_maintenance_date: string | null
  notes: string | null
  created_at: string
  category?: EquipmentCategory
  supplier?: Supplier | null
}

export interface Event {
  id: string
  name: string
  event_code: string
  description: string | null
  client_name: string
  event_type: string
  venue_id: string
  setup_start: string
  event_start: string
  event_end: string
  dismantle_end: string
  expected_attendance: number | null
  budget: number
  status: EventStatus
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  notes: string | null
  created_at: string
  updated_at: string
  venue?: Venue
}

export interface EventScheduleChange {
  id: string
  event_id: string
  field: string
  previous_value: string
  new_value: string
  reason: string | null
  created_at: string
}

export interface EquipmentRequirement {
  id: string
  event_id: string
  category_id: string
  description: string | null
  quantity: number
  required_from: string
  required_until: string
  priority: 'Low' | 'Medium' | 'High'
  specifications: string | null
  preferred_supplier_id: string | null
  estimated_cost: number
  status: 'Draft' | 'Submitted' | 'Approved' | 'Partially fulfilled' | 'Fulfilled' | 'Rejected' | 'Cancelled'
  notes: string | null
  created_at: string
  category?: EquipmentCategory
}

export interface RentalContract {
  id: string
  contract_number: string
  supplier_id: string
  event_id: string
  title: string
  contract_start: string
  contract_end: string
  delivery_date: string | null
  collection_date: string | null
  billing_model: BillingModel
  currency: string
  subtotal: number
  tax: number
  discount: number
  deposit: number
  estimated_total: number
  actual_final_cost: number | null
  payment_status: PaymentStatus
  contract_status: ContractStatus
  cancellation_terms: string | null
  extension_terms: string | null
  late_return_charges: string | null
  grace_period_hours: number
  minimum_duration_hours: number
  notes: string | null
  created_at: string
  supplier?: Supplier
  event?: Event
  rental_items?: RentalItem[]
}

export interface RentalItem {
  id: string
  contract_id: string
  category_id: string
  asset_id: string | null
  description: string
  quantity: number
  unit_rate: number
  rental_start: string
  rental_end: string
  billable_units: number
  estimated_line_cost: number
  actual_line_cost: number | null
  utilization_status: string | null
  notes: string | null
  category?: EquipmentCategory
  asset?: EquipmentAsset | null
}

export interface AssetAssignment {
  id: string
  event_id: string
  contract_id: string
  rental_item_id: string | null
  asset_id: string | null
  quantity: number
  required_start: string
  required_end: string
  assigned_to: string | null
  status: string
  current_location: string | null
  check_in_status: string | null
  check_out_status: string | null
  asset?: EquipmentAsset | null
  event?: Event | null
  contract?: RentalContract | null
}

export interface AssetMovement {
  id: string
  asset_id: string
  event_id: string | null
  contract_id: string | null
  movement_type: MovementType
  previous_status: AssetStatus | null
  new_status: AssetStatus
  previous_location: string | null
  new_location: string | null
  user_name: string
  notes: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  asset?: EquipmentAsset
}

export interface SynchronizationAlert {
  id: string
  alert_type: string
  severity: AlertSeverity
  event_id: string | null
  contract_id: string | null
  rental_item_id: string | null
  asset_id: string | null
  title: string
  description: string
  detected_condition: string
  recommended_action: string
  estimated_financial_impact: number
  potential_savings: number
  status: AlertStatus
  assigned_to: string | null
  resolution_notes: string | null
  created_at: string
  resolved_at: string | null
  event?: Event | null
  contract?: RentalContract | null
  asset?: EquipmentAsset | null
}

export interface ApprovalRequest {
  id: string
  request_type: string
  requester: string
  approver: string | null
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
  reason: string | null
  affected_amount: number
  event_id: string | null
  contract_id: string | null
  alert_id: string | null
  comments: string | null
  submitted_at: string
  reviewed_at: string | null
}

export interface Incident {
  id: string
  incident_number: string
  event_id: string
  asset_id: string | null
  supplier_id: string | null
  category: string
  severity: AlertSeverity
  description: string
  occurred_at: string
  reported_by: string
  assigned_to: string | null
  status: 'Open' | 'Under investigation' | 'Resolved' | 'Closed'
  resolution_notes: string | null
  estimated_cost_impact: number
  final_cost_impact: number | null
  event?: Event
  asset?: EquipmentAsset | null
}

export interface Invoice {
  id: string
  invoice_number: string
  supplier_id: string
  contract_id: string
  event_id: string
  invoice_date: string
  due_date: string
  subtotal: number
  tax: number
  total: number
  amount_paid: number
  balance: number
  approval_status: string
  payment_status: PaymentStatus
  created_at: string
  supplier?: Supplier
  contract?: RentalContract
  event?: Event
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  method: string
  reference: string | null
  payment_date: string
  recorded_by: string
  notes: string | null
  invoice?: Invoice
}

export interface AuditLog {
  id: string
  user_name: string
  action: string
  entity_type: string
  entity_id: string | null
  previous_values: any
  new_values: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface OrganizationSettings {
  id: string
  setup_allowance_hours: number
  idle_threshold_hours: number
  grace_period_hours: number
  early_rental_threshold_hours: number
  late_rental_threshold_hours: number
  budget_warning_percent: number
  currency: string
}
