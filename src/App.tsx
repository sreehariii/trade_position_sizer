import { useState } from 'react'
import EquitySizer from './EquitySizer'
import LotSizer from './LotSizer'
import './App.css'

type AppPage = 'equity' | 'nifty' | 'crude'

export default function App() {
  const [page, setPage] = useState<AppPage | null>(null)

  return (
    <div className="page">
      <div className="atmosphere" aria-hidden="true" />

      <header className="brand">
        <p className="brand-mark">Trade Position Sizer</p>
        <nav className="app-nav" aria-label="Main">
          <button
            type="button"
            className={page === 'equity' ? 'active' : ''}
            onClick={() => setPage('equity')}
          >
            Equity
          </button>
          <button
            type="button"
            className={page === 'nifty' ? 'active' : ''}
            onClick={() => setPage('nifty')}
          >
            Nifty options
          </button>
          <button
            type="button"
            className={page === 'crude' ? 'active' : ''}
            onClick={() => setPage('crude')}
          >
            Crude mini futures
          </button>
        </nav>
      </header>

      {page === null && (
        <p className="choose-instrument" role="status">
          Choose Equity, Nifty options, or Crude mini futures above to size a position.
        </p>
      )}

      {page === 'equity' && <EquitySizer />}
      {page === 'nifty' && <LotSizer key="nifty" instrument="nifty" />}
      {page === 'crude' && <LotSizer key="crude" instrument="crude" />}
    </div>
  )
}
