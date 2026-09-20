import { useMemo, useState } from 'react'
import {
  calculateTrade,
  formatInr,
  formatNumber,
  formatQty,
  inferDirection,
  validateInputs,
  type RiskMode,
  type TradeInputs,
} from './calc'
import { parseNum } from './parseNum'

const RRR_PRESETS = [1, 1.5, 2, 2.5, 3]

const DEFAULTS = {
  capital: 1000000,
  riskMode: 'percent' as RiskMode,
  riskPercent: 1,
  riskFixed: 1000,
  entry: 2500,
  stopLoss: 2450,
  rrr: 2,
}

export default function EquitySizer() {
  const [capital, setCapital] = useState(String(DEFAULTS.capital))
  const [riskMode, setRiskMode] = useState<RiskMode>(DEFAULTS.riskMode)
  const [riskPercent, setRiskPercent] = useState(String(DEFAULTS.riskPercent))
  const [riskFixed, setRiskFixed] = useState(String(DEFAULTS.riskFixed))
  const [entry, setEntry] = useState(String(DEFAULTS.entry))
  const [stopLoss, setStopLoss] = useState(String(DEFAULTS.stopLoss))
  const [rrr, setRrr] = useState(String(DEFAULTS.rrr))

  const inputs: TradeInputs = useMemo(
    () => ({
      capital: parseNum(capital),
      riskMode,
      riskPercent: parseNum(riskPercent),
      riskFixed: parseNum(riskFixed),
      entry: parseNum(entry),
      stopLoss: parseNum(stopLoss),
      rrr: parseNum(rrr),
    }),
    [capital, riskMode, riskPercent, riskFixed, entry, stopLoss, rrr],
  )

  const direction = useMemo(
    () => inferDirection(inputs.entry, inputs.stopLoss),
    [inputs.entry, inputs.stopLoss],
  )
  const issues = useMemo(() => validateInputs(inputs), [inputs])
  const result = useMemo(() => calculateTrade(inputs), [inputs])
  const undersized =
    issues.length === 0 &&
    inputs.entry > 0 &&
    Math.abs(inputs.entry - inputs.stopLoss) > 0 &&
    result === null

  return (
    <main className="layout">
      <section className="panel inputs" aria-label="Trade inputs">
        <div className="section-head">
          <h2>Trade setup</h2>
          <p>
            Enter capital, risk, and levels. Long/short is detected from entry vs stop loss.
            Quantity is the smaller of risk-based size and what your capital can buy at entry
            (whole shares only).
          </p>
        </div>

        <div className="field">
          <label htmlFor="capital">Capital (₹)</label>
          <input
            id="capital"
            inputMode="decimal"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
          />
        </div>

        <div className="segmented" role="group" aria-label="Risk mode">
          <button
            type="button"
            className={riskMode === 'percent' ? 'active' : ''}
            onClick={() => setRiskMode('percent')}
          >
            Risk %
          </button>
          <button
            type="button"
            className={riskMode === 'fixed' ? 'active' : ''}
            onClick={() => setRiskMode('fixed')}
          >
            Fixed ₹
          </button>
        </div>

        {riskMode === 'percent' ? (
          <div className="field">
            <label htmlFor="riskPercent">Risk per trade (%)</label>
            <input
              id="riskPercent"
              inputMode="decimal"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="riskFixed">Risk per trade (₹)</label>
            <input
              id="riskFixed"
              inputMode="decimal"
              value={riskFixed}
              onChange={(e) => setRiskFixed(e.target.value)}
            />
          </div>
        )}

        <div className="row-2">
          <div className="field">
            <label htmlFor="entry">Entry (₹)</label>
            <input
              id="entry"
              inputMode="decimal"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="stopLoss">Stop loss (₹)</label>
            <input
              id="stopLoss"
              inputMode="decimal"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>
        </div>

        {direction && (
          <div
            className={`direction-highlight ${direction}`}
            role="status"
            aria-live="polite"
            aria-label={`Detected ${direction} trade`}
          >
            <div className="direction-highlight-track">
              <span className={direction === 'long' ? 'on' : ''}>Long</span>
              <span className={direction === 'short' ? 'on' : ''}>Short</span>
            </div>
            <p className="direction-highlight-note">
              Auto-detected ·{' '}
              {direction === 'long' ? 'SL is below entry' : 'SL is above entry'}
            </p>
          </div>
        )}

        <div className="field">
          <div className="label-row">
            <label htmlFor="rrr">Reward : Risk (RRR)</label>
            <span className="hint">Target = entry ± risk × RRR</span>
          </div>
          <input
            id="rrr"
            inputMode="decimal"
            value={rrr}
            onChange={(e) => setRrr(e.target.value)}
          />
          <div className="presets" role="group" aria-label="RRR presets">
            {RRR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={parseNum(rrr) === preset ? 'active' : ''}
                onClick={() => setRrr(String(preset))}
              >
                1:{preset}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel results" aria-label="Position results">
        <div className="section-head">
          <h2>Position & PnL</h2>
          <p>Live sizing from your risk budget and stop distance.</p>
        </div>

        {issues.length > 0 && (
          <div className="banner warn" role="status">
            {issues[0].message}
          </div>
        )}

        {undersized && (
          <div className="banner warn" role="status">
            Risk budget is smaller than one share&apos;s stop distance. Increase capital/risk or
            tighten the stop.
          </div>
        )}

        {result && result.sizingLimit === 'capital' && (
          <div className="banner warn" role="status">
            Risk sizing allows {formatQty(result.riskBasedQuantity)} shares, but capital covers
            only {formatQty(result.maxAffordableQuantity)} at {formatInr(inputs.entry)} entry.
            Actual risk is below your risk budget.
          </div>
        )}

        {result && (
          <>
            <div className="hero-metric">
              <span className="hero-label">
                Shares to {result.direction === 'long' ? 'buy' : 'sell'}
              </span>
              <span key={result.quantity} className="hero-value">
                {formatQty(result.quantity)}
              </span>
              <span className="hero-sub">
                {result.direction === 'long' ? 'Long' : 'Short'} · Position value{' '}
                {formatInr(result.positionValue)}
              </span>
            </div>

            <div className="metric-grid">
              <article className="metric">
                <span className="metric-label">Target (1:{formatNumber(inputs.rrr, 2)})</span>
                <span className="metric-value">{formatInr(result.target)}</span>
              </article>
              <article className="metric">
                <span className="metric-label">Risk / share</span>
                <span className="metric-value">{formatInr(result.riskPerShare)}</span>
              </article>
              <article className="metric loss">
                <span className="metric-label">Loss at SL</span>
                <span className="metric-value">−{formatInr(result.potentialLoss)}</span>
                <span className="metric-sub">
                  {formatNumber(result.capitalAtRiskPct, 2)}% of capital
                </span>
              </article>
              <article className="metric profit">
                <span className="metric-label">Profit at target</span>
                <span className="metric-value">+{formatInr(result.potentialProfit)}</span>
                <span className="metric-sub">
                  {formatNumber(result.rewardPctOfCapital, 2)}% of capital
                </span>
              </article>
            </div>

            <div className="summary-bar">
              <div>
                <span className="metric-label">Risk budget</span>
                <strong>{formatInr(result.riskBudget)}</strong>
              </div>
              <div>
                <span className="metric-label">Actual risk</span>
                <strong>{formatInr(result.actualRisk)}</strong>
              </div>
              <div>
                <span className="metric-label">Effective R:R</span>
                <strong>1:{formatNumber(result.effectiveRrr, 2)}</strong>
              </div>
            </div>

            <p className="footnote">
              {result.direction === 'long' ? 'Long' : 'Short'}: entry{' '}
              {formatInr(inputs.entry)} · SL {formatInr(inputs.stopLoss)} · target{' '}
              {formatInr(result.target)}. Charges and taxes not included.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
