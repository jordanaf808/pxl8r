import type { unitTypeEnum } from '@/db/schema'

export type BlockType =
  | 'workout'
  | 'project'
  | 'finance'
  | 'mood'
  | 'skill'
  | 'habit'
  | 'reading'
  | 'custom'

export type BlockColor = 'rust' | 'sage' | 'gold' | 'slate' | 'warm'

export interface Block {
  id: string
  name: string
  description: string
  type: string
  unit: typeof unitTypeEnum
  endGoal: number
  color: string
  completed: boolean
  progress: number
  createdAt: string
  completedAt?: string
  groupId?: string
}

export interface BlockGroup {
  id: string
  name: string
  description: string
  color: BlockColor
  blockIds: string[]
  createdAt: string
}

export interface User {
  name: string
  email: string
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  workout: 'Workout',
  project: 'Project',
  finance: 'Finance',
  mood: 'Mood',
  skill: 'Skill',
  habit: 'Habit',
  reading: 'Reading',
  custom: 'Custom',
}

export const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
  workout: 'dumbbell',
  project: 'folder',
  finance: 'coins',
  mood: 'heart',
  skill: 'lightbulb',
  habit: 'repeat',
  reading: 'book',
  custom: 'star',
}

export const BLOCK_COLORS: Record<
  BlockColor,
  { bg: string; text: string; label: string }
> = {
  rust: { bg: '#c75c4a', text: '#faf6f0', label: 'Rust Red' },
  sage: { bg: '#5b8a72', text: '#faf6f0', label: 'Sage Green' },
  gold: { bg: '#c9963a', text: '#faf6f0', label: 'Warm Gold' },
  slate: { bg: '#6b83a6', text: '#faf6f0', label: 'Slate Blue' },
  warm: { bg: '#a67c5b', text: '#faf6f0', label: 'Earthy Brown' },
}
