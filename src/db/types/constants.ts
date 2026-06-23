import type { PixelTypeType, PixelUnitType, PixelColor } from './db.types'

export const PIXEL_TYPE_LABELS: Record<PixelTypeType, string> = {
  workout: 'Workout',
  project: 'Project',
  finance: 'Finance',
  mood: 'Mood',
  skill: 'Skill',
  habit: 'Habit',
  reading: 'Reading',
  social: 'social',
  personal: 'personal',
  journal: 'journal',
  scale: 'scale',
  custom: 'Custom',
}

export const PIXEL_UNIT_LABELS: Record<PixelUnitType, string> = {
  count: 'Count',
  percent: 'Percent',
  dollar: 'Dollars',
  hour: 'Hours',
  minute: 'Minutes',
  day: 'Days',
  gram: 'Grams',
  lbs: 'Pounds',
  cups: 'Cups',
  gallon: 'Gallons',
  reps: 'Reps',
  steps: 'Steps',
  miles: 'Miles',
  kilometers: 'Kilometers',
  pages: 'Pages',
  books: 'Books',
  rating: 'Rating',
  custom: 'Custom',
}

export const PIXEL_TYPE_ICONS: Record<PixelTypeType, string> = {
  workout: 'dumbbell',
  project: 'folder',
  finance: 'coins',
  mood: 'heart',
  skill: 'lightbulb',
  habit: 'repeat',
  reading: 'book',
  social: 'social',
  personal: 'personal',
  journal: 'journal',
  scale: 'scale',
  custom: 'star',
}

export const PIXEL_COLORS: Record<
  PixelColor,
  { bg: string; text: string; label: string }
> = {
  rust: { bg: '#c75c4a', text: '#faf6f0', label: 'Rust Red' },
  sage: { bg: '#5b8a72', text: '#faf6f0', label: 'Sage Green' },
  gold: { bg: '#c9963a', text: '#faf6f0', label: 'Warm Gold' },
  slate: { bg: '#6b83a6', text: '#faf6f0', label: 'Slate Blue' },
  warm: { bg: '#a67c5b', text: '#faf6f0', label: 'Earthy Brown' },
}
