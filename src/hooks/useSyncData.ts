import { useMemo } from 'react'
import { useSupabaseQuery } from '@/hooks/useSupabase'
import { TABLES } from '@/lib/supabase'
import { runSynchronization, type SyncResult } from '@/lib/syncEngine'
import { computeEventCost, type EventCostSummary } from '@/lib/costEngine'
import type {
  Event, RentalContract, RentalItem, AssetAssignment,
  AssetMovement, OrganizationSettings, SynchronizationAlert,
} from '@/types'

export function useSyncData() {
  const { data: events } = useSupabaseQuery<Event>(TABLES.events, {
    select: '*, venue:venues(*)',
    order: { column: 'event_start', ascending: false },
  })
  const { data: contracts } = useSupabaseQuery<RentalContract>(TABLES.contracts, {
    select: '*, supplier:suppliers(*), event:events(*)',
    order: { column: 'created_at', ascending: false },
  })
  const { data: rentalItems } = useSupabaseQuery<RentalItem>(TABLES.rentalItems, {
    select: '*, category:equipment_categories(*), asset:equipment_assets(*)',
  })
  const { data: assignments } = useSupabaseQuery<AssetAssignment>(TABLES.assignments, {
    select: '*, asset:equipment_assets(*)',
  })
  const { data: movements } = useSupabaseQuery<AssetMovement>(TABLES.movements, {
    select: '*, asset:equipment_assets(*)',
    order: { column: 'created_at', ascending: false },
  })
  const { data: settingsRows } = useSupabaseQuery<OrganizationSettings>(TABLES.settings)
  const { data: existingAlerts } = useSupabaseQuery<SynchronizationAlert>(TABLES.alerts, {
    order: { column: 'created_at', ascending: false },
  })

  const settings: OrganizationSettings = settingsRows[0] ?? {
    id: 'default', setup_allowance_hours: 24, idle_threshold_hours: 48,
    grace_period_hours: 24, early_rental_threshold_hours: 12,
    late_rental_threshold_hours: 6, budget_warning_percent: 80, currency: 'KES',
  }

  const syncResults = useMemo(() => {
    const results = new Map<string, SyncResult>()
    for (const ev of events) {
      const evContracts = contracts.filter(c => c.event_id === ev.id)
      const evItems = rentalItems.filter(i => evContracts.some(c => c.id === i.contract_id))
      const evAssignments = assignments.filter(a => a.event_id === ev.id)
      const evMovements = movements.filter(m => m.event_id === ev.id)
      const result = runSynchronization({
        event: ev, contracts: evContracts, rentalItems: evItems,
        assignments: evAssignments, movements: evMovements, settings,
      })
      results.set(ev.id, result)
    }
    return results
  }, [events, contracts, rentalItems, assignments, movements, settings])

  const allAlerts = useMemo(() => {
    const alerts: SynchronizationAlert[] = []
    for (const result of syncResults.values()) {
      alerts.push(...result.alerts)
    }
    return alerts.sort((a, b) => {
      const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, Informational: 4 }
      return (sevOrder[a.severity as keyof typeof sevOrder] ?? 5) - (sevOrder[b.severity as keyof typeof sevOrder] ?? 5)
    })
  }, [syncResults])

  const costSummaries = useMemo(() => {
    const summaries = new Map<string, EventCostSummary>()
    for (const ev of events) {
      const evContracts = contracts.filter(c => c.event_id === ev.id)
      const evItems = rentalItems.filter(i => evContracts.some(c => c.id === i.contract_id))
      const evMovements = movements.filter(m => m.event_id === ev.id)
      const summary = computeEventCost(ev.budget, evContracts, evItems, evMovements)
      summary.eventId = ev.id
      summaries.set(ev.id, summary)
    }
    return summaries
  }, [events, contracts, rentalItems, movements])

  const loading = events.length === 0 && contracts.length === 0

  return {
    events, contracts, rentalItems, assignments, movements, settings,
    syncResults, allAlerts, costSummaries, existingAlerts, loading,
  }
}
