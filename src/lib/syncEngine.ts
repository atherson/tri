import type {
  Event, RentalContract, RentalItem, AssetAssignment,
  AssetMovement, SynchronizationAlert, OrganizationSettings, AssetStatus,
} from '@/types'
import { hoursBetween } from '@/lib/utils'

export interface SyncContext {
  event: Event
  contracts: RentalContract[]
  rentalItems: RentalItem[]
  assignments: AssetAssignment[]
  movements: AssetMovement[]
  settings: OrganizationSettings
}

export interface SyncResult {
  alerts: SynchronizationAlert[]
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    informational: number
    potentialSavings: number
    estimatedImpact: number
  }
}

const newAlert = (
  ctx: SyncContext,
  partial: Partial<SynchronizationAlert> & {
    alert_type: string; severity: SynchronizationAlert['severity']
    title: string; description: string; detected_condition: string
  },
): SynchronizationAlert => ({
  id: crypto.randomUUID(),
  alert_type: partial.alert_type,
  severity: partial.severity,
  event_id: ctx.event.id,
  contract_id: partial.contract_id ?? null,
  rental_item_id: partial.rental_item_id ?? null,
  asset_id: partial.asset_id ?? null,
  title: partial.title,
  description: partial.description,
  detected_condition: partial.detected_condition,
  recommended_action: partial.recommended_action ?? 'Review and take corrective action.',
  estimated_financial_impact: partial.estimated_financial_impact ?? 0,
  potential_savings: partial.potential_savings ?? 0,
  status: 'New',
  assigned_to: partial.assigned_to ?? null,
  resolution_notes: null,
  created_at: new Date().toISOString(),
  resolved_at: null,
  event: ctx.event,
  contract: partial.contract ?? null,
  asset: partial.asset ?? null,
})

const lineRate = (item: RentalItem): number => item.unit_rate * item.quantity

const billableHours = (item: RentalItem): number => {
  const start = new Date(item.rental_start).getTime()
  const end = new Date(item.rental_end).getTime()
  return Math.max(0, (end - start) / 36e5)
}

export function runSynchronization(ctx: SyncContext): SyncResult {
  const alerts: SynchronizationAlert[] = []
  const { event, contracts, rentalItems, assignments, movements, settings } = ctx

  const eventSetup = new Date(event.setup_start)
  const eventStart = new Date(event.event_start)
  const eventEnd = new Date(event.event_end)
  const dismantleEnd = new Date(event.dismantle_end)

  // 1. Rental starts too early
  for (const c of contracts) {
    const cStart = new Date(c.contract_start)
    const allowedSetup = new Date(eventSetup.getTime() - settings.setup_allowance_hours * 36e5)
    if (cStart < allowedSetup) {
      const excess = hoursBetween(cStart, allowedSetup)
      const rate = rentalItems.filter(i => i.contract_id === c.id).reduce((s, i) => s + lineRate(i), 0)
      const impact = excess * rate
      alerts.push(newAlert(ctx, {
        alert_type: 'Early Rental Start',
        severity: 'Medium',
        contract_id: c.id, contract: c,
        title: `Contract ${c.contract_number} starts too early`,
        description: `Rental begins ${excess.toFixed(1)}h before the allowed setup window (${settings.setup_allowance_hours}h before event setup).`,
        detected_condition: `contract_start ${cStart.toISOString()} < setup - ${settings.setup_allowance_hours}h`,
        recommended_action: 'Negotiate a later delivery time or reduce billing for the unused early period.',
        estimated_financial_impact: impact,
        potential_savings: impact,
      }))
    }
  }

  // 2. Rental ends too late (after dismantle + grace)
  for (const c of contracts) {
    const cEnd = new Date(c.contract_end)
    const allowedEnd = new Date(dismantleEnd.getTime() + settings.grace_period_hours * 36e5)
    if (cEnd > allowedEnd) {
      const excess = hoursBetween(allowedEnd, cEnd)
      const rate = rentalItems.filter(i => i.contract_id === c.id).reduce((s, i) => s + lineRate(i), 0)
      const savings = excess * rate
      alerts.push(newAlert(ctx, {
        alert_type: 'Late Rental End',
        severity: 'High',
        contract_id: c.id, contract: c,
        title: `Contract ${c.contract_number} ends after dismantling + grace`,
        description: `Rental ends ${excess.toFixed(1)}h after event dismantling plus ${settings.grace_period_hours}h grace period.`,
        detected_condition: `contract_end ${cEnd.toISOString()} > dismantle_end + ${settings.grace_period_hours}h`,
        recommended_action: 'Schedule earlier collection or request a contract shortening to avoid unnecessary rental days.',
        estimated_financial_impact: savings,
        potential_savings: savings,
      }))
    }
  }

  // 3. Event shortened but rental unchanged
  if (['Shortened', 'Completed'].includes(event.status) || true) {
    for (const c of contracts) {
      const cEnd = new Date(c.contract_end)
      const cStart = new Date(c.contract_start)
      const rentalEnd = cEnd
      if (rentalEnd > dismantleEnd) {
        const unnecessary = hoursBetween(dismantleEnd, rentalEnd)
        if (unnecessary > settings.late_rental_threshold_hours) {
          const rate = rentalItems.filter(i => i.contract_id === c.id).reduce((s, i) => s + lineRate(i), 0)
          const savings = (unnecessary / 24) * rate
          alerts.push(newAlert(ctx, {
            alert_type: 'Unnecessary Rental Days',
            severity: 'High',
            contract_id: c.id, contract: c,
            title: `Unnecessary rental time on ${c.contract_number}`,
            description: `Event ends/dismantles ${unnecessary.toFixed(1)}h before the rental contract ends. This equipment is not needed for that period.`,
            detected_condition: `dismantle_end < contract_end by ${unnecessary.toFixed(1)}h`,
            recommended_action: 'Shorten the contract to align with the actual dismantling end and record confirmed savings.',
            estimated_financial_impact: savings,
            potential_savings: savings,
          }))
        }
      }
      // also check rental start too early relative to setup
      if (cStart < eventSetup) {
        const early = hoursBetween(cStart, eventSetup)
        if (early > settings.early_rental_threshold_hours) {
          const rate = rentalItems.filter(i => i.contract_id === c.id).reduce((s, i) => s + lineRate(i), 0)
          const savings = (early / 24) * rate
          alerts.push(newAlert(ctx, {
            alert_type: 'Unnecessary Early Rental',
            severity: 'Medium',
            contract_id: c.id, contract: c,
            title: `Rental starts before setup on ${c.contract_number}`,
            description: `Rental begins ${early.toFixed(1)}h before event setup starts. Equipment sits idle before it can be used.`,
            detected_condition: `contract_start < setup_start by ${early.toFixed(1)}h`,
            recommended_action: 'Shift delivery closer to setup or negotiate a reduced early billing period.',
            estimated_financial_impact: savings,
            potential_savings: savings,
          }))
        }
      }
    }
  }

  // 4. Event extended but contract not updated
  if (['Extended', 'Active'].includes(event.status)) {
    for (const c of contracts) {
      const cEnd = new Date(c.contract_end)
      if (eventEnd > cEnd) {
        const gap = hoursBetween(cEnd, eventEnd)
        alerts.push(newAlert(ctx, {
          alert_type: 'Extension Required',
          severity: 'Critical',
          contract_id: c.id, contract: c,
          title: `Contract ${c.contract_number} must be extended`,
          description: `Event now ends ${gap.toFixed(1)}h after the contract end date. Equipment is needed beyond the contracted period.`,
          detected_condition: `event_end > contract_end by ${gap.toFixed(1)}h`,
          recommended_action: 'Request a contract extension from the supplier before the current end date.',
          estimated_financial_impact: 0,
          potential_savings: 0,
        }))
      }
    }
  }

  // 5. Event postponed but rental unchanged
  if (event.status === 'Postponed') {
    for (const c of contracts) {
      alerts.push(newAlert(ctx, {
        alert_type: 'Postponed Event Rental',
        severity: 'High',
        contract_id: c.id, contract: c,
        title: `Rental ${c.contract_number} not updated after postponement`,
        description: 'The event has been postponed but the rental contract dates remain unchanged.',
        detected_condition: 'event.status = Postponed and contract dates unchanged',
        recommended_action: 'Reschedule delivery and collection dates with the supplier.',
      }))
    }
  }

  // 6. Event cancelled while rentals remain active
  if (event.status === 'Cancelled') {
    for (const c of contracts) {
      if (['Active', 'Approved'].includes(c.contract_status)) {
        alerts.push(newAlert(ctx, {
          alert_type: 'Cancelled Event Active Rental',
          severity: 'Critical',
          contract_id: c.id, contract: c,
          title: `Active rental ${c.contract_number} on cancelled event`,
          description: 'The event is cancelled but one or more rental contracts are still active. Cancellation charges may apply.',
          detected_condition: 'event.status = Cancelled and contract_status in (Active, Approved)',
          recommended_action: 'Cancel contracts immediately and review cancellation terms to minimize charges.',
          estimated_financial_impact: c.estimated_total * 0.3,
        }))
      }
    }
  }

  // 7. Event relocated but delivery destination unchanged — simplified: warn on all contracts
  if (event.status === 'Relocated') {
    for (const c of contracts) {
      alerts.push(newAlert(ctx, {
        alert_type: 'Relocated Event Delivery',
        severity: 'Medium',
        contract_id: c.id, contract: c,
        title: `Delivery destination may be wrong for ${c.contract_number}`,
        description: 'The event has been relocated. Confirm the delivery address with all suppliers.',
        detected_condition: 'event.status = Relocated',
        recommended_action: 'Update delivery instructions and notify suppliers of the new venue.',
      }))
    }
  }

  // 8 & 9. Idle equipment — asset delivered but never used, or idle too long
  const assetLastMovement = new Map<string, AssetMovement>()
  for (const m of movements) {
    assetLastMovement.set(m.asset_id, m)
  }
  for (const a of assignments) {
    if (!a.asset_id) continue
    const last = assetLastMovement.get(a.asset_id)
    if (!last) continue
    if (last.new_status === 'Idle' || last.new_status === 'Delivered') {
      const idleHours = hoursBetween(last.created_at, new Date())
      if (idleHours > settings.idle_threshold_hours) {
        const item = rentalItems.find(i => i.id === a.rental_item_id)
        const rate = item ? lineRate(item) : 0
        const idleCost = (idleHours / 24) * rate
        alerts.push(newAlert(ctx, {
          alert_type: 'Idle Equipment',
          severity: 'Medium',
          asset_id: a.asset_id, asset: a.asset,
          contract_id: a.contract_id,
          rental_item_id: a.rental_item_id,
          title: `Asset ${a.asset?.asset_code ?? a.asset_id.slice(0, 8)} idle for ${idleHours.toFixed(1)}h`,
          description: `Equipment has been ${last.new_status.toLowerCase()} for longer than the ${settings.idle_threshold_hours}h threshold.`,
          detected_condition: `last movement ${last.movement_type} at ${last.created_at}, idle ${idleHours.toFixed(1)}h`,
          recommended_action: 'Put the equipment into use, return it, or release it to avoid idle rental costs.',
          estimated_financial_impact: idleCost,
          potential_savings: idleCost,
        }))
      }
    }
    if (last.new_status === 'Delivered' && !movements.some(m => m.asset_id === a.asset_id && ['Installed', 'In use', 'Marked in use', 'Activated'].includes(m.movement_type))) {
      alerts.push(newAlert(ctx, {
        alert_type: 'Delivered Not Used',
        severity: 'Low',
        asset_id: a.asset_id, asset: a.asset,
        contract_id: a.contract_id,
        title: `Asset ${a.asset?.asset_code ?? a.asset_id.slice(0, 8)} delivered but not in use`,
        description: 'Equipment was delivered but has not been marked as installed or in use.',
        detected_condition: 'last movement = Delivered, no subsequent Installed/In use movement',
        recommended_action: 'Confirm installation or return the equipment if it is not needed.',
      }))
    }
  }

  // 10. Equipment awaiting collection after event end
  for (const a of assignments) {
    if (!a.asset_id) continue
    const last = assetLastMovement.get(a.asset_id)
    if (!last) continue
    if (['Awaiting collection', 'Awaiting dismantling'].includes(last.new_status) && new Date() > eventEnd) {
      const overdue = hoursBetween(eventEnd, new Date())
      alerts.push(newAlert(ctx, {
        alert_type: 'Awaiting Collection After Event',
        severity: 'High',
        asset_id: a.asset_id, asset: a.asset,
        contract_id: a.contract_id,
        title: `Asset ${a.asset?.asset_code ?? a.asset_id.slice(0, 8)} awaiting collection after event end`,
        description: `Event ended ${overdue.toFixed(1)}h ago but equipment is still awaiting collection.`,
        detected_condition: `last status ${last.new_status}, event_end passed ${overdue.toFixed(1)}h ago`,
        recommended_action: 'Schedule collection immediately to avoid late return charges.',
      }))
    }
  }

  // 11. Overdue returns — contract ended, not returned
  for (const c of contracts) {
    const cEnd = new Date(c.contract_end)
    if (cEnd < new Date() && c.contract_status === 'Active') {
      const overdue = hoursBetween(cEnd, new Date())
      const rate = rentalItems.filter(i => i.contract_id === c.id).reduce((s, i) => s + lineRate(i), 0)
      const lateCost = (overdue / 24) * rate
      alerts.push(newAlert(ctx, {
        alert_type: 'Overdue Return',
        severity: 'Critical',
        contract_id: c.id, contract: c,
        title: `Contract ${c.contract_number} is overdue for return`,
        description: `Contract ended ${overdue.toFixed(1)}h ago but equipment has not been returned. Late return charges may apply.`,
        detected_condition: `contract_end < now by ${overdue.toFixed(1)}h, status still Active`,
        recommended_action: 'Confirm return with the supplier and review late return charges in the contract.',
        estimated_financial_impact: lateCost,
      }))
    }
  }

  // 12. Contract nearing expiry while event active
  for (const c of contracts) {
    const cEnd = new Date(c.contract_end)
    const hoursLeft = hoursBetween(new Date(), cEnd)
    if (hoursLeft > 0 && hoursLeft < 24 && event.status === 'Active') {
      alerts.push(newAlert(ctx, {
        alert_type: 'Contract Nearing Expiry',
        severity: 'High',
        contract_id: c.id, contract: c,
        title: `Contract ${c.contract_number} expires in ${hoursLeft.toFixed(1)}h while event is active`,
        description: 'The event is still active but the rental contract is about to expire.',
        detected_condition: `contract_end in ${hoursLeft.toFixed(1)}h, event.status = Active`,
        recommended_action: 'Extend the contract before it expires to avoid gaps in equipment availability.',
      }))
    }
  }

  // 13. Assignment beyond contract end
  for (const a of assignments) {
    const reqEnd = new Date(a.required_end)
    const c = contracts.find(c => c.id === a.contract_id)
    if (c && reqEnd > new Date(c.contract_end)) {
      const excess = hoursBetween(new Date(c.contract_end), reqEnd)
      alerts.push(newAlert(ctx, {
        alert_type: 'Assignment Beyond Contract',
        severity: 'Medium',
        asset_id: a.asset_id, asset: a.asset,
        contract_id: a.contract_id, contract: c,
        title: `Assignment for ${a.asset?.asset_code ?? 'asset'} extends beyond contract end`,
        description: `The assignment requires the asset for ${excess.toFixed(1)}h beyond the contract end date.`,
        detected_condition: `required_end > contract_end by ${excess.toFixed(1)}h`,
        recommended_action: 'Extend the contract or shorten the assignment.',
      }))
    }
  }

  // 14. Rented but unassigned equipment
  for (const item of rentalItems) {
    const assigned = assignments.filter(a => a.rental_item_id === item.id).reduce((s, a) => s + a.quantity, 0)
    if (assigned < item.quantity) {
      const unassigned = item.quantity - assigned
      alerts.push(newAlert(ctx, {
        alert_type: 'Rented Unassigned',
        severity: 'Low',
        rental_item_id: item.id,
        contract_id: item.contract_id,
        title: `${unassigned} unit(s) of ${item.description} rented but not assigned`,
        description: `Contracted quantity is ${item.quantity} but only ${assigned} are assigned to the event.`,
        detected_condition: `assigned ${assigned} < contracted ${item.quantity}`,
        recommended_action: 'Assign the remaining units or release them from the contract.',
      }))
    }
  }

  // 15. Requirements exceed contract quantity
  // (simplified: handled in UI by comparing requirement totals vs contract totals)

  // 16. Contract quantity exceeds actual need (event shortened)
  if (event.status === 'Shortened') {
    for (const c of contracts) {
      const items = rentalItems.filter(i => i.contract_id === c.id)
      const totalQty = items.reduce((s, i) => s + i.quantity, 0)
      alerts.push(newAlert(ctx, {
        alert_type: 'Quantity Exceeds Need',
        severity: 'Medium',
        contract_id: c.id, contract: c,
        title: `Contract ${c.contract_number} quantity may exceed shortened event needs`,
        description: `The event was shortened. Review whether all ${totalQty} contracted units are still required.`,
        detected_condition: 'event.status = Shortened',
        recommended_action: 'Reduce the contracted quantity if some equipment is no longer needed.',
      }))
    }
  }

  // 17. Duplicate assignments for serialized assets
  const assetAssignments = new Map<string, AssetAssignment[]>()
  for (const a of assignments) {
    if (!a.asset_id) continue
    const list = assetAssignments.get(a.asset_id) ?? []
    list.push(a)
    assetAssignments.set(a.asset_id, list)
  }
  for (const [assetId, list] of assetAssignments) {
    if (list.length > 1) {
      const asset = list[0].asset
      alerts.push(newAlert(ctx, {
        alert_type: 'Duplicate Assignment',
        severity: 'High',
        asset_id: assetId, asset,
        title: `Asset ${asset?.asset_code ?? assetId.slice(0, 8)} assigned ${list.length} times`,
        description: 'A serialized asset has multiple overlapping assignments. Serialized assets cannot be in two places at once.',
        detected_condition: `${list.length} assignments for serialized asset`,
        recommended_action: 'Remove duplicate assignments and reassign to a different asset.',
      }))
    }
  }

  // 18. Damaged or missing assets
  for (const [assetId, last] of assetLastMovement) {
    if (last.new_status === 'Damaged' || last.new_status === 'Missing') {
      alerts.push(newAlert(ctx, {
        alert_type: last.new_status === 'Damaged' ? 'Damaged Asset' : 'Missing Asset',
        severity: 'Critical',
        asset_id: assetId, asset: last.asset,
        title: `Asset ${last.asset?.asset_code ?? assetId.slice(0, 8)} reported ${last.new_status.toLowerCase()}`,
        description: `Equipment was reported as ${last.new_status.toLowerCase()} during movement tracking.`,
        detected_condition: `last movement new_status = ${last.new_status}`,
        recommended_action: 'File an incident report and review damage/loss charges with the supplier.',
      }))
    }
  }

  // 19. Actual cost exceeds budget
  const actualCost = contracts.reduce((s, c) => s + (c.actual_final_cost ?? c.estimated_total), 0)
  if (actualCost > event.budget) {
    const variance = actualCost - event.budget
    alerts.push(newAlert(ctx, {
      alert_type: 'Budget Exceeded',
      severity: 'High',
      title: `Event "${event.name}" exceeds budget by ${variance.toFixed(0)}`,
      description: `Actual/estimated rental cost (${actualCost.toFixed(0)}) exceeds the event budget (${event.budget.toFixed(0)}).`,
      detected_condition: `actual_cost ${actualCost} > budget ${event.budget}`,
      recommended_action: 'Review contracts for savings opportunities or approve a budget increase.',
      estimated_financial_impact: variance,
    }))
  } else if (actualCost > event.budget * (settings.budget_warning_percent / 100)) {
    const pct = (actualCost / event.budget) * 100
    alerts.push(newAlert(ctx, {
      alert_type: 'Budget Warning',
      severity: 'Low',
      title: `Event "${event.name}" at ${pct.toFixed(0)}% of budget`,
      description: `Rental cost is approaching the budget limit (${pct.toFixed(0)}% of ${event.budget.toFixed(0)}).`,
      detected_condition: `actual_cost > ${settings.budget_warning_percent}% of budget`,
      recommended_action: 'Monitor remaining spend and look for savings.',
    }))
  }

  // 20. Supplier has not confirmed collection
  for (const c of contracts) {
    if (c.collection_date && new Date(c.collection_date) < new Date() && c.contract_status === 'Active') {
      const hasCollectionMovement = movements.some(m =>
        m.contract_id === c.id && ['Collected', 'Returned'].includes(m.movement_type),
      )
      if (!hasCollectionMovement) {
        const overdue = hoursBetween(new Date(c.collection_date), new Date())
        alerts.push(newAlert(ctx, {
          alert_type: 'Collection Not Confirmed',
          severity: 'Medium',
          contract_id: c.id, contract: c,
          title: `Supplier has not confirmed collection for ${c.contract_number}`,
          description: `Collection was due ${overdue.toFixed(1)}h ago but no collection/return movement has been recorded.`,
          detected_condition: `collection_date < now by ${overdue.toFixed(1)}h, no Collected/Returned movement`,
          recommended_action: 'Follow up with the supplier to confirm collection and avoid extended billing.',
        }))
      }
    }
  }

  const summary = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'Critical').length,
    high: alerts.filter(a => a.severity === 'High').length,
    medium: alerts.filter(a => a.severity === 'Medium').length,
    low: alerts.filter(a => a.severity === 'Low').length,
    informational: alerts.filter(a => a.severity === 'Informational').length,
    potentialSavings: alerts.reduce((s, a) => s + a.potential_savings, 0),
    estimatedImpact: alerts.reduce((s, a) => s + a.estimated_financial_impact, 0),
  }

  return { alerts, summary }
}
