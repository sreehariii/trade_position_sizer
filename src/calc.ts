export type Direction = 'long' | 'short'

export type RiskMode = 'percent' | 'fixed'

export interface TradeInputs {
  capital: number
  riskMode: RiskMode
  riskPercent: number
  riskFixed: number
  entry: number
  stopLoss: number
  rrr: number
}

export interface TradeResult {
  direction: Direction
  riskBudget: number
  riskPerShare: number
  quantity: number
  actualRisk: number
  target: number
  rewardPerShare: number
  potentialLoss: number
  potentialProfit: number
  positionValue: number
  capitalAtRiskPct: number
  effectiveRrr: number
  rewardPctOfCapital: number
}

export interface ValidationIssue {
  field?: keyof TradeInputs
  message: string
}

/** SL below entry → long; SL above entry → short. */
export function inferDirection(entry: number, stopLoss: number): Direction | null {
  if (!(entry > 0) || !(stopLoss > 0) || entry === stopLoss) return null
  return stopLoss < entry ? 'long' : 'short'
}

export function validateInputs(input: TradeInputs): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!(input.capital > 0)) {
    issues.push({ field: 'capital', message: 'Capital must be greater than 0' })
  }
  if (input.riskMode === 'percent' && !(input.riskPercent > 0)) {
    issues.push({ field: 'riskPercent', message: 'Risk % must be greater than 0' })
  }
  if (input.riskMode === 'fixed' && !(input.riskFixed > 0)) {
    issues.push({ field: 'riskFixed', message: 'Risk amount must be greater than 0' })
  }
  if (!(input.entry > 0)) {
    issues.push({ field: 'entry', message: 'Entry must be greater than 0' })
  }
  if (!(input.stopLoss > 0)) {
    issues.push({ field: 'stopLoss', message: 'Stop loss must be greater than 0' })
  }
  if (!(input.rrr > 0)) {
    issues.push({ field: 'rrr', message: 'RRR must be greater than 0' })
  }

  if (input.entry > 0 && input.stopLoss > 0 && input.entry === input.stopLoss) {
    issues.push({
      field: 'stopLoss',
      message: 'Stop loss must differ from entry so direction can be detected',
    })
  }

  return issues
}

export function calculateTrade(input: TradeInputs): TradeResult | null {
  if (validateInputs(input).length > 0) return null

  const direction = inferDirection(input.entry, input.stopLoss)
  if (!direction) return null

  const riskBudget =
    input.riskMode === 'percent'
      ? (input.capital * input.riskPercent) / 100
      : input.riskFixed

  const riskPerShare = Math.abs(input.entry - input.stopLoss)
  if (riskPerShare === 0) return null

  const quantity = Math.floor(riskBudget / riskPerShare)
  if (quantity < 1) return null

  const rewardPerShare = riskPerShare * input.rrr
  const target =
    direction === 'long'
      ? input.entry + rewardPerShare
      : input.entry - rewardPerShare

  const actualRisk = quantity * riskPerShare
  const potentialProfit = quantity * rewardPerShare
  const positionValue = quantity * input.entry

  return {
    direction,
    riskBudget,
    riskPerShare,
    quantity,
    actualRisk,
    target,
    rewardPerShare,
    potentialLoss: actualRisk,
    potentialProfit,
    positionValue,
    capitalAtRiskPct: (actualRisk / input.capital) * 100,
    effectiveRrr: potentialProfit / actualRisk,
    rewardPctOfCapital: (potentialProfit / input.capital) * 100,
  }
}

export function formatInr(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatQty(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value)
}
