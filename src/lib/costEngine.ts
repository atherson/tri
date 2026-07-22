import type { RentalContract, RentalItem, BillingModel, AssetMovement } from '@/types'
import { hoursBetween, daysBetween } from '@/lib/utils'

export interface LineCostBreakdown {
  rentalItemId: string
  description: string
  billingModel: BillingModel
  quantity: number
  unitRate: number
  plannedDurationHours: number
  actualDurationHours: number | null
  billableDurationHours: number
  billableUnits: number
  plannedCost: number
  actualCost: number | null
  idleCost: number
  formula: string
}

export interface ContractCostBreakdown {
  contractId: string
  contractNumber: string
  billingModel: BillingModel
  lines: LineCostBreakdown[]
  subtotal: number
  tax: number
  discount: number
  deposit: number
  estimatedTotal: number
  actualTotal: number
  idleCost: number
  lateCollectionCost: number
  penalties: number
  grandTotal: number
  potentialSavings: number
}

export function computeBillableUnits(
  model: BillingModel,
  start: string | Date,
  end: string | Date,
): { units: number; hours: number; formula: string } {
  const hours = Math.max(0, hoursBetween(start, end))
  switch (model) {
    case 'Hourly':
      return { units: Math.ceil(hours), hours, formula: `ceil(${hours.toFixed(1)}h) = ${Math.ceil(hours)}h` }
    case 'Daily':
      return { units: Math.ceil(hours / 24), hours, formula: `ceil(${hours.toFixed(1)}h / 24) = ${Math.ceil(hours / 24)} days` }
    case 'Weekly':
      return { units: Math.ceil(hours / (24 * 7)), hours, formula: `ceil(${hours.toFixed(1)}h / 168) = ${Math.ceil(hours / (24 * 7))} weeks` }
    case 'Per item':
    case 'Per quantity':
      return { units: 1, hours, formula: 'fixed per item/quantity' }
    case 'Fixed price':
      return { units: 1, hours, formula: 'fixed price' }
    default:
      return { units: Math.ceil(hours / 24), hours, formula: `custom: ceil(${hours.toFixed(1)}h / 24) = ${Math.ceil(hours / 24)} days` }
  }
}

export function computeLineCost(
  item: RentalItem,
  contract: RentalContract,
  movements: AssetMovement[] = [],
): LineCostBreakdown {
  const planned = computeBillableUnits(contract.billing_model, item.rental_start, item.rental_end)
  const plannedCost = planned.units * item.unit_rate * item.quantity

  // actual usage from movements: first "Marked in use" to last "Marked in use" or "Checked out"
  const itemMovements = movements.filter(m => m.asset_id === item.asset_id || m.contract_id === contract.id)
  const inUse = itemMovements.filter(m => ['Marked in use', 'Installed', 'Activated'].includes(m.movement_type))
  const out = itemMovements.filter(m => ['Checked out', 'Collected', 'Returned', 'Dismantled'].includes(m.movement_type))

  let actualDurationHours: number | null = null
  let actualCost: number | null = null
  if (inUse.length > 0 && out.length > 0) {
    const firstUse = new Date(inUse[0].created_at)
    const lastOut = new Date(out[out.length - 1].created_at)
    actualDurationHours = Math.max(0, hoursBetween(firstUse, lastOut))
    const actualUnits = contract.billing_model === 'Hourly'
      ? Math.ceil(actualDurationHours)
      : Math.ceil(actualDurationHours / 24)
    actualCost = actualUnits * item.unit_rate * item.quantity
  }

  // idle cost = (planned - actual) * rate * qty
  let idleCost = 0
  if (actualDurationHours !== null && actualDurationHours < planned.hours) {
    const idleHours = planned.hours - actualDurationHours
    const idleUnits = contract.billing_model === 'Hourly'
      ? Math.ceil(idleHours)
      : Math.ceil(idleHours / 24)
    idleCost = idleUnits * item.unit_rate * item.quantity
  }

  const billableDurationHours = actualDurationHours ?? planned.hours
  const billableUnits = actualCost !== null
    ? (contract.billing_model === 'Hourly' ? Math.ceil(actualDurationHours!) : Math.ceil(actualDurationHours! / 24))
    : planned.units

  return {
    rentalItemId: item.id,
    description: item.description,
    billingModel: contract.billing_model,
    quantity: item.quantity,
    unitRate: item.unit_rate,
    plannedDurationHours: planned.hours,
    actualDurationHours,
    billableDurationHours,
    billableUnits,
    plannedCost,
    actualCost,
    idleCost,
    formula: `${planned.units} ${contract.billing_model.toLowerCase().replace('ly', '').replace(' price', '').trim()} × ${item.unit_rate} × ${item.quantity} = ${plannedCost}`,
  }
}

export function computeContractCost(
  contract: RentalContract,
  items: RentalItem[],
  movements: AssetMovement[] = [],
): ContractCostBreakdown {
  const lines = items
    .filter(i => i.contract_id === contract.id)
    .map(i => computeLineCost(i, contract, movements))

  const subtotal = lines.reduce((s, l) => s + (l.actualCost ?? l.plannedCost), 0)
  const idleCost = lines.reduce((s, l) => s + l.idleCost, 0)

  const lateCollectionCost = 0
  const penalties = 0

  const tax = subtotal * (contract.tax / Math.max(1, contract.subtotal || subtotal) || 0)
  const grandTotal = subtotal + tax - contract.discount + contract.deposit + lateCollectionCost + penalties

  const potentialSavings = idleCost

  return {
    contractId: contract.id,
    contractNumber: contract.contract_number,
    billingModel: contract.billing_model,
    lines,
    subtotal,
    tax,
    discount: contract.discount,
    deposit: contract.deposit,
    estimatedTotal: contract.estimated_total,
    actualTotal: subtotal,
    idleCost,
    lateCollectionCost,
    penalties,
    grandTotal,
    potentialSavings,
  }
}

export interface EventCostSummary {
  eventId: string
  totalEstimated: number
  totalActual: number
  totalIdleCost: number
  totalPotentialSavings: number
  totalConfirmedSavings: number
  budget: number
  budgetVariance: number
  budgetVariancePercent: number
  contracts: ContractCostBreakdown[]
}

export function computeEventCost(
  budget: number,
  contracts: RentalContract[],
  items: RentalItem[],
  movements: AssetMovement[] = [],
  confirmedSavings = 0,
): EventCostSummary {
  const contractBreakdowns = contracts.map(c => computeContractCost(c, items, movements))
  const totalEstimated = contractBreakdowns.reduce((s, c) => s + c.estimatedTotal, 0)
  const totalActual = contractBreakdowns.reduce((s, c) => s + c.actualTotal, 0)
  const totalIdleCost = contractBreakdowns.reduce((s, c) => s + c.idleCost, 0)
  const totalPotentialSavings = contractBreakdowns.reduce((s, c) => s + c.potentialSavings, 0)
  const budgetVariance = totalActual - budget
  const budgetVariancePercent = budget > 0 ? (budgetVariance / budget) * 100 : 0

  return {
    eventId: '',
    totalEstimated,
    totalActual,
    totalIdleCost,
    totalPotentialSavings,
    totalConfirmedSavings: confirmedSavings,
    budget,
    budgetVariance,
    budgetVariancePercent,
    contracts: contractBreakdowns,
  }
}
