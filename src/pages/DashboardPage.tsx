import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function DeltaPill({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
        positive
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          : 'bg-rose-50 text-rose-700 border border-rose-100'
      }`}
    >
      <span className="mr-1">{positive ? '↗' : '↘'}</span>
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export function DashboardPage() {
  const chartData = useMemo(() => {
    // UI-Demo: daten lassen sich später 1:1 durch echte KPIs ersetzen
    return Array.from({ length: 28 }).map((_, i) => {
      const t = i / 27
      const base = 50 + t * 35
      const v1 = base + Math.sin(i * 0.6) * 10 + Math.cos(i * 0.2) * 7
      const v2 = base + Math.sin(i * 0.35) * 8 + 6
      return {
        x: `Tag ${i + 1}`,
        a: Math.max(5, Math.round(v1 * 100) / 100),
        b: Math.max(5, Math.round(v2 * 100) / 100),
      }
    })
  }, [])

  const [range, setRange] = useState<'Last 3 months' | 'Last 30 days' | 'Last 7 days'>(
    'Last 3 months',
  )

  const tableRows = useMemo(
    () => [
      {
        id: '1',
        header: 'Cover page',
        type: 'Cover page',
        status: 'In Process',
        target: 18,
        limit: 5,
        reviewer: 'Eddie Lake',
      },
      {
        id: '2',
        header: 'Table of contents',
        type: 'Table of contents',
        status: 'Done',
        target: 29,
        limit: 24,
        reviewer: 'Eddie Lake',
      },
      {
        id: '3',
        header: 'Executive summary',
        type: 'Narrative',
        status: 'Done',
        target: 10,
        limit: 13,
        reviewer: 'Eddie Lake',
      },
    ],
    [],
  )

  const kpis = useMemo(
    () => [
      { title: 'Total Revenue', value: '$1,250.00', delta: 12.5, hint: 'Trending up this month' },
      { title: 'New Customers', value: '1,234', delta: -20, hint: 'Down 20% this period' },
      { title: 'Active Accounts', value: '45,678', delta: 12.5, hint: 'Strong user retention' },
      { title: 'Growth Rate', value: '4.5%', delta: 4.5, hint: 'Steady performance' },
    ],
    [],
  )

  return (
    <div className="relative mx-auto max-w-6xl space-y-5 px-1 pb-6">
      <div className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-52 rounded-[60px] bg-gradient-to-r from-indigo-100/60 via-sky-50 to-violet-100/60 blur-3xl" />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card
            key={k.title}
            className="min-h-[120px] bg-white/80 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  {k.title}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{k.value}</p>
              </div>
              <DeltaPill value={k.delta} />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{k.hint}</p>
          </Card>
        ))}
      </section>

      <section>
        <Card
          className="bg-white/80"
          title="Total Visitors"
          description="Total for the last 3 months"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              <span>Line A</span>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 ml-3" />
              <span>Line B</span>
            </div>
            <div className="flex items-center gap-2">
              {(['Last 3 months', 'Last 30 days', 'Last 7 days'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                    range === r
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Line type="monotone" dataKey="a" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="b" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm">
                Outline
              </button>
              <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm">
                Past Performance <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700">3</span>
              </button>
              <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm">
                Key Personnel <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700">2</span>
              </button>
              <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm">
                Focus Documents
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                Customize Columns
              </Button>
              <Button size="sm">+ Add Section</Button>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card title="Sections" description="Übersicht deiner letzten Jobs (Demo)">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] text-slate-500">
                  <th className="px-3 py-3">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                  </th>
                  <th className="px-3 py-3">Header</th>
                  <th className="px-3 py-3">Section Type</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Target</th>
                  <th className="px-3 py-3">Limit</th>
                  <th className="px-3 py-3">Reviewer</th>
                  <th className="px-3 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 text-[11px] text-slate-700">
                    <td className="px-3 py-3">
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">{r.header}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px]">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {r.status === 'Done' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                          ✓ Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200">
                          ⏳ In Process
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">{r.target}</td>
                    <td className="px-3 py-3">{r.limit}</td>
                    <td className="px-3 py-3">{r.reviewer}</td>
                    <td className="px-3 py-3 text-right">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                        ⋯
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

