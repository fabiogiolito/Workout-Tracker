import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { PageHeader } from '@/components/layout/PageHeader'
import { useNutritionStore } from '@/store/nutritionStore'
import { useSheetStore } from '@/store/sheetStore'
import { useSheetData, useAppendRow } from '@/hooks/useSheetSync'
import { parseMetrics } from '@/lib/google/sheetReader'
import { metricToRow } from '@/lib/google/sheetWriter'
import { TABS } from '@/lib/google/sheetSchema'
import { today, formatDateShort } from '@/lib/utils/formatters'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { BodyMetric } from '@/types/nutrition'

export default function MetricsPage() {
  const { metrics, setMetrics, addMetric } = useNutritionStore()
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [saving, setSaving] = useState(false)
  const appendMetric = useAppendRow(TABS.METRICS)

  useSheetData(TABS.METRICS, parseMetrics, setMetrics)

  const sorted = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const weightData = sorted.filter(m => m.bodyWeightKg).map(m => ({ d: formatDateShort(m.date), w: m.bodyWeightKg }))
  const fatData = sorted.filter(m => m.bodyFatPct).map(m => ({ d: formatDateShort(m.date), f: m.bodyFatPct }))
  const latest = sorted[sorted.length - 1]

  async function logMetric() {
    if (!weight && !bodyFat) return
    setSaving(true)
    const metric: BodyMetric = {
      id: uuid(),
      date: today(),
      bodyWeightKg: weight ? parseFloat(weight) : undefined,
      bodyFatPct: bodyFat ? parseFloat(bodyFat) : undefined,
      loggedAt: new Date().toISOString(),
    }
    addMetric(metric)
    appendMetric(metricToRow(metric))
    setWeight('')
    setBodyFat('')
    setSaving(false)
  }

  return (
    <div className="px-6 pb-6">
      <PageHeader title="Body Metrics" back="/settings" />

      {/* Latest */}
      {latest && (
        <div className="flex gap-8 mb-10">
          {latest.bodyWeightKg && (
            <div>
              <p className="text-3xl font-semibold">{latest.bodyWeightKg}</p>
              <p className="text-xs text-neutral-400 mt-0.5">kg body weight</p>
            </div>
          )}
          {latest.bodyFatPct && (
            <div>
              <p className="text-3xl font-semibold">{latest.bodyFatPct}%</p>
              <p className="text-xs text-neutral-400 mt-0.5">body fat</p>
            </div>
          )}
        </div>
      )}

      {/* Weight chart */}
      {weightData.length >= 2 && (
        <div className="mb-8">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Body weight</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                  <div className="bg-white border border-neutral-200 text-xs px-2 py-1 rounded">
                    {payload[0].payload.d}: {payload[0].value}kg
                  </div>
                ) : null} />
                <Line type="monotone" dataKey="w" stroke="#000" strokeWidth={1.5} dot={{ r: 2, fill: '#000' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Body fat chart */}
      {fatData.length >= 2 && (
        <div className="mb-8">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Body fat %</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fatData}>
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                  <div className="bg-white border border-neutral-200 text-xs px-2 py-1 rounded">
                    {payload[0].payload.d}: {payload[0].value}%
                  </div>
                ) : null} />
                <Line type="monotone" dataKey="f" stroke="#000" strokeWidth={1.5} dot={{ r: 2, fill: '#000' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Log form */}
      <div className="mb-8">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Log today</p>
        <div className="flex gap-6 mb-4">
          <div>
            <p className="text-xs text-neutral-400 mb-1">Weight (kg)</p>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="text-xl font-semibold border-b border-neutral-200 pb-1 outline-none w-24 bg-transparent"
              placeholder="—"
            />
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Body fat (%)</p>
            <input
              type="number"
              value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
              className="text-xl font-semibold border-b border-neutral-200 pb-1 outline-none w-20 bg-transparent"
              placeholder="—"
            />
          </div>
        </div>
        <button
          onClick={logMetric}
          disabled={(!weight && !bodyFat) || saving}
          className="text-sm px-4 py-2 bg-black text-white rounded-lg disabled:opacity-40"
        >
          Log
        </button>
      </div>

      {/* History list */}
      {sorted.length > 0 && (
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">History</p>
          <div className="space-y-0">
            {[...sorted].reverse().slice(0, 20).map(m => (
              <div key={m.id} className="flex items-center justify-between py-3 border-b border-neutral-100 text-sm">
                <p className="text-neutral-600">{formatDateShort(m.date)}</p>
                <div className="flex gap-4 text-neutral-400 text-xs">
                  {m.bodyWeightKg && <span>{m.bodyWeightKg}kg</span>}
                  {m.bodyFatPct && <span>{m.bodyFatPct}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
