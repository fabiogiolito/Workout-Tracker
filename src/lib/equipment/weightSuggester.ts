import type { Equipment, WeightOption } from '@/types/equipment'

// Find all valid barbell weights given plate inventory
// Returns sorted array of achievable total weights (bar + plates, symmetric loading)
export function getBarbellOptions(barbell: Equipment): number[] {
  if (!barbell.availablePlates || !barbell.barWeightKg) return []
  const barWeight = barbell.barWeightKg

  // Each plate pair adds 2× plate weight. Build set of achievable totals.
  const plates = barbell.availablePlates.filter(p => p.qty >= 2)
  const achievable = new Set<number>([barWeight])

  // BFS/DP: accumulate combinations
  let current = [barWeight]
  for (const plate of plates) {
    const pairsAvailable = Math.floor(plate.qty / 2)
    const next = new Set(current.map(w => w))
    for (const base of current) {
      for (let pairs = 1; pairs <= pairsAvailable; pairs++) {
        const total = base + pairs * 2 * plate.weight
        next.add(total)
        achievable.add(total)
      }
    }
    current = [...next]
  }

  return [...achievable].sort((a, b) => a - b)
}

export function getDumbbellOptions(dumbbell: Equipment): number[] {
  return (dumbbell.dumbbellWeights ?? []).sort((a, b) => a - b)
}

export function findNearestWeight(target: number, available: number[]): WeightOption | null {
  if (available.length === 0) return null
  const sorted = [...available].sort((a, b) => a - b)

  // Find closest ≥ target first (don't go below)
  const above = sorted.find(w => w >= target)
  if (above !== undefined) {
    return { totalKg: above }
  }
  // Fall back to max available
  return { totalKg: sorted[sorted.length - 1] }
}

export function formatPlateBreakdown(totalKg: number, barbell: Equipment): string {
  if (!barbell.barWeightKg || !barbell.availablePlates) return `${totalKg}kg`
  const sideKg = (totalKg - barbell.barWeightKg) / 2
  if (sideKg <= 0) return `${barbell.barWeightKg}kg bar (empty)`

  const plates = [...(barbell.availablePlates)].sort((a, b) => b.weight - a.weight)
  const used: { weight: number; count: number }[] = []
  let remaining = sideKg

  for (const plate of plates) {
    const count = Math.floor(remaining / plate.weight)
    if (count > 0) {
      used.push({ weight: plate.weight, count })
      remaining -= count * plate.weight
    }
  }

  if (used.length === 0) return `${totalKg}kg`
  const breakdown = used.map(u => `${u.count}×${u.weight}`).join(' + ')
  return `${totalKg}kg (${breakdown} per side)`
}
