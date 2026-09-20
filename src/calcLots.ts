import { inferDirection, type Direction, type ValidationIssue } from './calc'

/** NSE Nifty 50 index options (contract multiplier). */
export const NIFTY_LOT_SIZE = 65

/** MCX Crude Oil Mini — barrels per lot. */
export const CRUDE_OIL_MINI_LOT_SIZE = 10

export interface LotSizingInputs {
  capital: number
  riskPercent: number
  entry: number
  stopLoss: number
  lotSize: number
  rrr: number
  /** Option buy: SL premium must be below entry premium. */
  longOnly?: boolean
}

export interface LotSizingResult {
  direction: Direction
  riskBudget: number
  riskPerUnit: number
  riskPerLot: number
  lots: number
  units: number
  actualRisk: number
  target: number
  rewardPerUnit: number
  potentialLoss: number
  potentialProfit: number
  positionValue: number
  capitalAtRiskPct: number
  effectiveRrr: number
  rewardPctOfCapital: number
}

export function validateLotInputs(input: LotSizingInputs): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!(input.capital > 0)) {
    issues.push({ message: 'Capital must be greater than 0' })
  }
  if (!(input.riskPercent > 0)) {
    issues.push({ message: 'Risk % must be greater than 0' })
  }
  if (!(input.entry > 0)) {
    issues.push({ message: 'Entry must be greater than 0' })
  }
  if (!(input.stopLoss > 0)) {
    issues.push({ message: 'Stop loss must be greater than 0' })
  }
  if (!(input.lotSize > 0)) {
    issues.push({ message: 'Lot size must be greater than 0' })
  }
  if (!(input.rrr > 0)) {
    issues.push({ message: 'RRR must be greater than 0' })
  }

  if (input.longOnly) {
    if (input.entry > 0 && input.stopLoss > 0 && input.stopLoss >= input.entry) {
      issues.push({
        message: 'For option buys, stop premium must be below entry premium',
      })
    }
  } else if (input.entry > 0 && input.stopLoss > 0 && input.entry === input.stopLoss) {
    issues.push({
      message: 'Stop loss must differ from entry so direction can be detected',
    })
  }

  return issues
}

export function calculateLotSizing(input: LotSizingInputs): LotSizingResult | null {
  if (validateLotInputs(input).length > 0) return null

  const direction = input.longOnly ? 'long' : inferDirection(input.entry, input.stopLoss)
  if (!direction) return null

  const riskBudget = (input.capital * input.riskPercent) / 100
  const riskPerUnit = Math.abs(input.entry - input.stopLoss)
  if (riskPerUnit === 0) return null

  const riskPerLot = riskPerUnit * input.lotSize
  const lots = Math.floor(riskBudget / riskPerLot)
  if (lots < 1) return null

  const units = lots * input.lotSize
  const rewardPerUnit = riskPerUnit * input.rrr
  const target =
    direction === 'long'
      ? input.entry + rewardPerUnit
      : input.entry - rewardPerUnit

  const actualRisk = lots * riskPerLot
  const potentialProfit = lots * input.lotSize * rewardPerUnit
  const positionValue = input.entry * units

  return {
    direction,
    riskBudget,
    riskPerUnit,
    riskPerLot,
    lots,
    units,
    actualRisk,
    target,
    rewardPerUnit,
    potentialLoss: actualRisk,
    potentialProfit,
    positionValue,
    capitalAtRiskPct: (actualRisk / input.capital) * 100,
    effectiveRrr: potentialProfit / actualRisk,
    rewardPctOfCapital: (potentialProfit / input.capital) * 100,
  }
}
