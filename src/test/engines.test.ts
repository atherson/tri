import { describe, it, expect } from 'vitest'
import { runSynchronization } from '@/lib/syncEngine'
import { computeEventCost, computeContractCost, computeBillableUnits } from '@/lib/costEngine'
import type { Event, RentalContract, RentalItem, AssetMovement, OrganizationSettings } from '@/types'

const settings: OrganizationSettings = {
  id: 'test', setup_allowance_hours: 24, idle_threshold_hours: 48,
  grace_period_hours: 24, early_rental_threshold_hours: 12,
  late_rental_threshold_hours: 6, budget_warning_percent: 80, currency: 'KES',
}

const baseEvent: Event = {
  id: 'ev1', name: 'Test Event', event_code: 'EVT-TEST', description: null,
  client_name: 'Test', event_type: 'Conference', venue_id: 'v1',
  setup_start: '2025-08-10T08:00:00+03:00', event_start: '2025-08-11T16:00:00+03:00',
  event_end: '2025-08-12T23:00:00+03:00', dismantle_end: '2025-08-13T12:00:00+03:00',
  expected_attendance: 1000, budget: 1000000, status: 'Shortened', priority: 'High',
  notes: null, created_at: '', updated_at: '',
}

const baseContract: RentalContract = {
  id: 'c1', contract_number: 'RC-001', supplier_id: 's1', event_id: 'ev1',
  title: 'Test Contract', contract_start: '2025-08-09T08:00:00+03:00',
  contract_end: '2025-08-15T18:00:00+03:00', delivery_date: '2025-08-09T08:00:00+03:00',
  collection_date: '2025-08-15T10:00:00+03:00', billing_model: 'Daily', currency: 'KES',
  subtotal: 210000, tax: 33600, discount: 0, deposit: 50000, estimated_total: 243600,
  actual_final_cost: null, payment_status: 'Unpaid', contract_status: 'Active',
  cancellation_terms: null, extension_terms: null, late_return_charges: null,
  grace_period_hours: 24, minimum_duration_hours: 24, notes: null, created_at: '',
}

const baseItem: RentalItem = {
  id: 'i1', contract_id: 'c1', category_id: 'cat1', asset_id: 'a1',
  description: 'Speakers', quantity: 2, unit_rate: 15000,
  rental_start: '2025-08-09T08:00:00+03:00', rental_end: '2025-08-15T18:00:00+03:00',
  billable_units: 6, estimated_line_cost: 180000, actual_line_cost: null,
  utilization_status: null, notes: null,
}

describe('Synchronization Engine', () => {
  it('detects late rental end when contract ends after dismantle + grace', () => {
    const result = runSynchronization({
      event: baseEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })
    const lateAlert = result.alerts.find(a => a.alert_type === 'Late Rental End')
    expect(lateAlert).toBeDefined()
    expect(lateAlert!.potential_savings).toBeGreaterThan(0)
  })

  it('detects unnecessary rental days when event is shortened', () => {
    const result = runSynchronization({
      event: baseEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })
    const unnecessary = result.alerts.find(a => a.alert_type === 'Unnecessary Rental Days')
    expect(unnecessary).toBeDefined()
    expect(unnecessary!.potential_savings).toBeGreaterThan(0)
  })

  it('detects early rental start', () => {
    const result = runSynchronization({
      event: baseEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })
    const early = result.alerts.find(a => a.alert_type === 'Unnecessary Early Rental')
    expect(early).toBeDefined()
  })

  it('detects budget exceeded', () => {
    const lowBudgetEvent = { ...baseEvent, budget: 100000 }
    const result = runSynchronization({
      event: lowBudgetEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })
    const budget = result.alerts.find(a => a.alert_type === 'Budget Exceeded')
    expect(budget).toBeDefined()
    expect(budget!.severity).toBe('High')
  })

  it('detects rented but unassigned equipment', () => {
    const result = runSynchronization({
      event: baseEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })
    const unassigned = result.alerts.find(a => a.alert_type === 'Rented Unassigned')
    expect(unassigned).toBeDefined()
  })

  it('detects extension required when event extends beyond contract', () => {
    const extendedEvent = { ...baseEvent, status: 'Extended' as const, event_end: '2025-08-16T23:00:00+03:00' }
    const result = runSynchronization({
      event: extendedEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })
    const ext = result.alerts.find(a => a.alert_type === 'Extension Required')
    expect(ext).toBeDefined()
    expect(ext!.severity).toBe('Critical')
  })

  it('detects cancelled event with active rentals', () => {
    const cancelledEvent = { ...baseEvent, status: 'Cancelled' as const }
    const result = runSynchronization({
      event: cancelledEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })
    const cancel = result.alerts.find(a => a.alert_type === 'Cancelled Event Active Rental')
    expect(cancel).toBeDefined()
    expect(cancel!.severity).toBe('Critical')
  })

  it('generates summary with correct counts', () => {
    const result = runSynchronization({
      event: baseEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })
    expect(result.summary.total).toBe(result.alerts.length)
    expect(result.summary.critical + result.summary.high + result.summary.medium + result.summary.low + result.summary.informational).toBe(result.summary.total)
  })
})

describe('Cost Engine', () => {
  it('computes billable units for daily billing', () => {
    const { units, formula } = computeBillableUnits('Daily', '2025-08-09T08:00:00+03:00', '2025-08-15T18:00:00+03:00')
    expect(units).toBe(7) // 6 days 10 hours → ceil to 7
    expect(formula).toContain('days')
  })

  it('computes billable units for hourly billing', () => {
    const { units } = computeBillableUnits('Hourly', '2025-08-09T08:00:00+03:00', '2025-08-09T20:00:00+03:00')
    expect(units).toBe(12)
  })

  it('computes contract cost with line items', () => {
    const cost = computeContractCost(baseContract, [baseItem], [])
    expect(cost.lines).toHaveLength(1)
    expect(cost.lines[0].plannedCost).toBe(210000) // 7 days (ceil) * 15000 * 2
  })

  it('computes event cost summary with budget variance', () => {
    const summary = computeEventCost(1000000, [baseContract], [baseItem], [])
    expect(summary.totalEstimated).toBe(243600)
    expect(summary.budgetVariance).toBe(210000 - 1000000)
    expect(summary.budgetVariancePercent).toBeLessThan(0)
  })

  it('calculates idle cost from movements', () => {
    const movements: AssetMovement[] = [
      { id: 'm1', asset_id: 'a1', event_id: 'ev1', contract_id: 'c1', movement_type: 'Marked in use', previous_status: 'Installed', new_status: 'In use', previous_location: null, new_location: null, user_name: 'Test', notes: null, latitude: null, longitude: null, created_at: '2025-08-11T16:00:00+03:00' },
      { id: 'm2', asset_id: 'a1', event_id: 'ev1', contract_id: 'c1', movement_type: 'Checked out', previous_status: 'In use', new_status: 'Collected', previous_location: null, new_location: null, user_name: 'Test', notes: null, latitude: null, longitude: null, created_at: '2025-08-12T23:00:00+03:00' },
    ]
    const cost = computeContractCost(baseContract, [baseItem], movements)
    expect(cost.lines[0].actualDurationHours).toBeCloseTo(31, 0)
    expect(cost.lines[0].idleCost).toBeGreaterThan(0)
  })
})

describe('Nairobi Summer Music Festival Scenario', () => {
  it('detects unnecessary rental time after event shortened from 3 to 2 days', () => {
    // Event end changed from Aug 13 23:00 to Aug 12 23:00
    // Dismantle changed from Aug 14 12:00 to Aug 13 12:00
    // But rental remains Aug 9 to Aug 15
    const result = runSynchronization({
      event: baseEvent, contracts: [baseContract], rentalItems: [baseItem],
      assignments: [], movements: [], settings,
    })

    // Should detect unnecessary rental days
    const unnecessary = result.alerts.find(a => a.alert_type === 'Unnecessary Rental Days')
    expect(unnecessary).toBeDefined()

    // Should calculate potential savings
    expect(unnecessary!.potential_savings).toBeGreaterThan(0)

    // Should also detect late rental end
    const lateEnd = result.alerts.find(a => a.alert_type === 'Late Rental End')
    expect(lateEnd).toBeDefined()
  })
})
