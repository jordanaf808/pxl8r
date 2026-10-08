import type { ValueFields } from './types'

/** What a number or time editor saves for an amount towards a goal */
export function getValueFields(value: number, goal: number): ValueFields {
  return {
    value,
    // Multiplied before it's divided: (29 / 100) * 100 is 28.999999999999996
    // in JavaScript, and rounding that down gives 28. Rounded down so that 100
    // means the goal is reached: to the nearest, 199 of 200 would show as 100
    progress: Math.min(100, Math.floor((value * 100) / goal)),
    // The slider stops at the goal. A value above it happens only when a
    // pixel's goal is lowered after the cell was filled in
    completedAt: value >= goal ? new Date() : null,
  }
}
