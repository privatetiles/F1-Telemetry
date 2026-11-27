import { useEffect, useState, type CSSProperties } from 'react'
import {
  CHAMPIONSHIP_POSITIONS, championshipPercent, loadChampionshipForecast,
  type ChampionshipDriver, type ChampionshipForecast,
} from '../lib/championshipForecast'
import { TEAM_COLORS } from '../lib/paceData'
import Icon from './Icon'
import './ChampionshipForecastView.css'

const ORDER_COLORS = ['#ff494d', '#ff984e', '#f4cc5c', '#4ad9c7', '#71a7ff', '#c392ff']
const ORDER_LABELS = ['Most likely', '2nd best', '3rd most likely', '4th favourite', '5th pick', '6th contender']

function DriverMark({ driver }: { driver: ChampionshipDriver }) {
  return (
    <span className="championship-driver-mark">
      <span className="pa2-team-dot" style={{ backgroundColor: TEAM_COLORS[driver.team] }} aria-hidden="true" />
      {driver.name}
    </span>
  )
}

function ProbabilityTrack({ probability, color }: { probability: number; color: string }) {
  return (
    <span className="sc-bar championship-track" aria-hidden="true">
      <span className="sc-bar-fill" style={{ width: `${probability * 100}%`, backgroundColor: color }} />
    </span>
  )
}

function ProjectedOrders({ orders }: { orders: ChampionshipForecast['orders'] }) {
  const coverage = orders.reduce((sum, order) => sum + order.probability, 0)

  return (
    <section className="championship-section" aria-labelledby="championship-orders-title">
      <div className="championship-orders-heading">
        <h2 id="championship-orders-title">Most likely finishing orders</h2>
        <div className="championship-coverage">
          <p>Top {orders.length} account for <strong>{championshipPercent(coverage)}</strong> of simulations.</p>
          <div className="championship-coverage-track" aria-hidden="true">
            {orders.map((order, index) => (
              <span key={order.drivers.map(driver => driver.driver).join('|')} style={{
                width: `${order.probability * 100}%`, backgroundColor: ORDER_COLORS[index % ORDER_COLORS.length],
              }} />
            ))}
          </div>
        </div>
      </div>
      <ol className="championship-order-grid" role="list" aria-labelledby="championship-orders-title">
        {orders.map((order, index) => (
          <li className="championship-order" key={order.drivers.map(driver => driver.driver).join('|')}
            style={{ '--order-color': ORDER_COLORS[index % ORDER_COLORS.length] } as CSSProperties}>
            <div className="championship-order-header">
              <span className="championship-order-rank">{ORDER_LABELS[index] ?? `Rank ${index + 1}`}</span>
              <strong className="championship-order-probability">{championshipPercent(order.probability)}</strong>
            </div>
            <dl className="championship-order-grid-positions">
              {order.drivers.map((driver, position) => (
                <div className="championship-order-driver" key={driver.driver}
                  style={{ '--driver-color': TEAM_COLORS[driver.team] ?? '#7b8b9f' } as CSSProperties}>
                  <dt>{CHAMPIONSHIP_POSITIONS[position]}</dt>
                  <dd>
                    <span className="championship-order-driver-name">{driver.name}</span>
                    <span className="championship-order-driver-code" aria-hidden="true">{driver.driver}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ForecastTables({ forecast }: { forecast: ChampionshipForecast }) {
  const { drivers, orders } = forecast

  return (
    <>
      <section className="championship-section" aria-labelledby="championship-positions-title">
        <h2 className="standings-title" id="championship-positions-title">Position probabilities</h2>
        <div className="championship-table-scroll" role="region" aria-label="Scrollable position probabilities table" tabIndex={0}>
          <table className="championship-table" aria-labelledby="championship-positions-title">
            <thead><tr>
              <th scope="col">Driver</th>
              <th scope="col">Points now</th>
              <th scope="col">Expected final points</th>
              <th scope="col">Expected points gained</th>
              {CHAMPIONSHIP_POSITIONS.map(position => <th key={position} scope="col">{position}</th>)}
            </tr></thead>
            <tbody>{drivers.map(driver => (
              <tr key={driver.driver}>
                <th scope="row"><DriverMark driver={driver} /></th>
                <td>{driver.points}</td>
                <td className="championship-final-points">{driver.expectedFinalPoints.toFixed(1)}</td>
                <td>{driver.expectedPointsGained.toFixed(1)}</td>
                {driver.probabilities.map((probability, index) => (
                  <td className="championship-probability" key={CHAMPIONSHIP_POSITIONS[index]}>
                    {championshipPercent(probability)}
                    <ProbabilityTrack probability={probability} color={TEAM_COLORS[driver.team] ?? '#7b8b9f'} />
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <ProjectedOrders orders={orders} />
    </>
  )
}

export default function ChampionshipForecastView() {
  const [forecast, setForecast] = useState<ChampionshipForecast | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    loadChampionshipForecast(controller.signal)
      .then(data => { if (!controller.signal.aborted) setForecast(data) })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])

  return (
    <main className="pa2-view championship-view" aria-labelledby="championship-title">
      <header className="pa2-header championship-header">
        <div className="championship-heading">
          <Icon className="championship-heading-icon" name="standings" size={23} aria-hidden="true" />
          <div>
            <h1 id="championship-title">Battle for 2nd</h1>
            <p>Qatar and Abu Dhabi</p>
          </div>
        </div>
        <a className="pa2-race-pill championship-link" href="#pace2">Race predictions</a>
      </header>
      <div className="championship-content">
        {error ? <p className="pace-error" role="alert">Championship forecast data could not be loaded.</p>
          : forecast ? <ForecastTables forecast={forecast} />
            : <p className="pace-loading" role="status">Loading championship forecast…</p>}
      </div>
    </main>
  )
}
