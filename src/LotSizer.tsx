import { useMemo, useState } from 'react'
import { formatInr, formatNumber, formatQty, inferDirection } from './calc'
import {
  calculateLotSizing,
  CRUDE_OIL_MINI_LOT_SIZE,
  NIFTY_LOT_SIZE,
  validateLotInputs,
  type LotSizingInputs,
} from './calcLots'
import { parseNum } from './parseNum'

const RRR_PRESETS = [1, 1.5, 2, 2.5, 3]

export type LotInstrument = 'nifty' | 'crude'

const SHARED_DEFAULTS = {
  capital: 1000000,
  riskPercent: 1,
  rrr: 2,
}

const NIFTY_DEFAULTS = {
  entryPremium: 450,
  slPremium: 400,
}

const CRUDE_DEFAULTS = {
  entry: 6200,
  stopLoss: 6150,
  /** Typical Groww/MCX SPAN+exposure per lot — update from your order ticket. */
  marginPerLot: 30500,
}

type LotSizerProps = {
  instrument: LotInstrument
}

export default function LotSizer({ instrument }: LotSizerProps) {
  const isNifty = instrument === 'nifty'
  const lotSize = isNifty ? NIFTY_LOT_SIZE : CRUDE_OIL_MINI_LOT_SIZE
  const idPrefix = isNifty ? 'nifty' : 'crude'

  const [capital, setCapital] = useState(String(SHARED_DEFAULTS.capital))
  const [riskPercent, setRiskPercent] = useState(String(SHARED_DEFAULTS.riskPercent))
  const [rrr, setRrr] = useState(String(SHARED_DEFAULTS.rrr))
  const [entry, setEntry] = useState(
    String(isNifty ? NIFTY_DEFAULTS.entryPremium : CRUDE_DEFAULTS.entry),
  )
  const [stopLoss, setStopLoss] = useState(
    String(isNifty ? NIFTY_DEFAULTS.slPremium : CRUDE_DEFAULTS.stopLoss),
  )
  const [marginPerLot, setMarginPerLot] = useState(String(CRUDE_DEFAULTS.marginPerLot))

  const inputs: LotSizingInputs = useMemo(
    () => ({
      capital: parseNum(capital),
      riskPercent: parseNum(riskPercent),
      entry: parseNum(entry),
      stopLoss: parseNum(stopLoss),
      lotSize,
      rrr: parseNum(rrr),
      longOnly: isNifty,
    }),
    [capital, riskPercent, entry, stopLoss, lotSize, rrr, isNifty],
  )

  const direction = useMemo(() => {
    if (isNifty) return 'long' as const
    return inferDirection(inputs.entry, inputs.stopLoss)
  }, [isNifty, inputs.entry, inputs.stopLoss])

  const issues = useMemo(() => validateLotInputs(inputs), [inputs])
  const result = useMemo(() => calculateLotSizing(inputs), [inputs])
  const undersized =
    issues.length === 0 &&
    inputs.entry > 0 &&
    Math.abs(inputs.entry - inputs.stopLoss) > 0 &&
    result === null

  const setupTitle = isNifty ? 'Nifty 50 DITM options' : 'Crude Oil Mini futures'
  const setupBlurb = isNifty
    ? `Size long option buys in whole lots (${NIFTY_LOT_SIZE} units/lot) from your max loss %.`
    : `Size futures in whole lots (${CRUDE_OIL_MINI_LOT_SIZE} barrels/lot) from your max loss %. Brokers block margin (SPAN), not full contract notional.`

  const crudeMarginPerLot = parseNum(marginPerLot)
  const estFundsRequired =
    !isNifty && result && crudeMarginPerLot > 0
      ? result.lots * crudeMarginPerLot
      : null

  return (
    <main className="layout">
      <section className="panel inputs" aria-label={`${setupTitle} inputs`}>
        <div className="section-head">
          <h2>{setupTitle}</h2>
          <p>{setupBlurb}</p>
        </div>

        <div className="lot-badge" role="status">
          Lot size: <strong>{formatQty(lotSize)}</strong>
          {isNifty ? ' units per lot (index options)' : ' barrels per lot'}
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-capital`}>Capital (₹)</label>
          <input
            id={`${idPrefix}-capital`}
            inputMode="decimal"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-risk`}>Max loss per trade (% of capital)</label>
          <input
            id={`${idPrefix}-risk`}
            inputMode="decimal"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
          />
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor={`${idPrefix}-entry`}>
              {isNifty ? 'Entry premium (₹)' : 'Entry (₹ / barrel)'}
            </label>
            <input
              id={`${idPrefix}-entry`}
              inputMode="decimal"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${idPrefix}-sl`}>
              {isNifty ? 'Stop premium (₹)' : 'Stop loss (₹ / barrel)'}
            </label>
            <input
              id={`${idPrefix}-sl`}
              inputMode="decimal"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>
        </div>

        {!isNifty && direction && (
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

        {isNifty && (
          <p className="inline-note">Long option buy only — stop premium must stay below entry.</p>
        )}

        {!isNifty && (
          <div className="field">
            <div className="label-row">
              <label htmlFor={`${idPrefix}-margin`}>Margin per lot (₹)</label>
              <span className="hint">Groww “Required amount” ÷ lots</span>
            </div>
            <input
              id={`${idPrefix}-margin`}
              inputMode="decimal"
              value={marginPerLot}
              onChange={(e) => setMarginPerLot(e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <div className="label-row">
            <label htmlFor={`${idPrefix}-rrr`}>Reward : Risk (RRR)</label>
            <span className="hint">
              {isNifty
                ? 'Target premium = entry + (premium risk × RRR)'
                : 'Target = entry ± price risk × RRR'}
            </span>
          </div>
          <input
            id={`${idPrefix}-rrr`}
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

      <section className="panel results" aria-label={`${setupTitle} results`}>
        <div className="section-head">
          <h2>Lots & PnL</h2>
          <p>
            Lots = floor(risk budget ÷ risk per lot). Actual risk may be slightly under your{' '}
            {parseNum(riskPercent) || 1}% cap after rounding down.
          </p>
        </div>

        {issues.length > 0 && (
          <div className="banner warn" role="status">
            {issues[0].message}
          </div>
        )}

        {undersized && (
          <div className="banner warn" role="status">
            Risk budget is smaller than one lot&apos;s stop distance. Increase capital/risk or
            adjust your stop.
          </div>
        )}

        {result && (
          <>
            <div className="hero-metric">
              <span className="hero-label">
                {isNifty
                  ? 'Lots to buy'
                  : `Lots to ${result.direction === 'long' ? 'buy' : 'sell'}`}
              </span>
              <span key={result.lots} className="hero-value">
                {formatQty(result.lots)}
              </span>
              <span className="hero-sub">
                {formatQty(result.units)} {isNifty ? 'option units' : 'barrels'}
                {isNifty ? (
                  <>
                    {' '}
                    · Premium paid {formatInr(result.positionValue)}
                  </>
                ) : estFundsRequired !== null ? (
                  <>
                    {' '}
                    · Est. funds required (margin) {formatInr(estFundsRequired)}
                  </>
                ) : (
                  <> · Enter margin per lot to match your broker</>
                )}
              </span>
            </div>

            <div className="metric-grid">
              <article className="metric">
                <span className="metric-label">
                  {isNifty ? 'Target premium' : 'Target price'} (1:
                  {formatNumber(inputs.rrr, 2)})
                </span>
                <span className="metric-value">{formatInr(result.target)}</span>
              </article>
              <article className="metric">
                <span className="metric-label">
                  Risk / {isNifty ? 'unit premium' : 'barrel'}
                </span>
                <span className="metric-value">{formatInr(result.riskPerUnit)}</span>
              </article>
              <article className="metric">
                <span className="metric-label">Risk / lot</span>
                <span className="metric-value">{formatInr(result.riskPerLot)}</span>
              </article>
              {!isNifty && (
                <article className="metric">
                  <span className="metric-label">Contract notional</span>
                  <span className="metric-value">{formatInr(result.positionValue)}</span>
                  <span className="metric-sub">Entry × barrels (not what Groww blocks)</span>
                </article>
              )}
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
              {isNifty
                ? `Nifty DITM buy · ${result.lots} lot(s) × ${NIFTY_LOT_SIZE} · entry premium ${formatInr(inputs.entry)} · SL premium ${formatInr(inputs.stopLoss)}.`
                : `${result.direction === 'long' ? 'Long' : 'Short'} Crude Mini · ${result.lots} lot(s) × ${CRUDE_OIL_MINI_LOT_SIZE} bbl · notional ${formatInr(result.positionValue)} · est. margin ${estFundsRequired !== null ? formatInr(estFundsRequired) : '—'}.`}{' '}
              Brokerage, STT, and taxes not included.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
