import type { BlockGroup } from '@/db/types'
import type { NewPage, NewPixel, NewGrid } from './schema'

export const SAMPLE_USER_PAGE: NewPage = {
  name: 'Jordan',
  description: "Jordan's Page",
  ownerId: 'hzwnjuReifl163FzsP1TkxQLo6mOv6cp',
  isPublic: true,
  theme: 'journal',
}

export const SAMPLE_Grid: NewGrid = {
  name: "Jordan's Completed Pixels",
  description: 'All of my completed Pixels',
  ownerId: 'hzwnjuReifl163FzsP1TkxQLo6mOv6cp',
  isPublic: true,
  theme: 'journal',
}

export const SAMPLE_BLOCKS: NewPixel[] = [
  {
    id: '1',
    name: 'Morning Run Routine',
    description:
      'Build a consistent morning running habit - 5km every day before work.',
    type: 'workout',
    unit: 'kilometers',
    endGoal: 30, // 'Run 5km every morning for 30 days'
    color: 'rust',
    completedAt: null,
    progress: 45,
    // groupId: 'g1',
  },
  {
    id: '2',
    name: 'Learn TypeScript',
    description:
      'Master TypeScript fundamentals and advanced types for better code.',
    type: 'skill',
    unit: 'percent' as const,
    endGoal: 100, // 'Complete TypeScript deep dive course'
    color: 'slate',
    completedAt: null,
    progress: 70,
  },
  {
    id: '3',
    name: 'Emergency Fund',
    description:
      'Save enough for 3 months of expenses as a financial safety net.',
    type: 'finance',
    unit: 'dollar',
    endGoal: 5000, // 'Save $5,000 in emergency fund',
    color: 'gold',
    // completedAt: true,
    progress: 100,
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Read 12 Books',
    description: 'Read one book per month covering various genres and topics.',
    type: 'reading',
    unit: 'books',
    endGoal: 12, // 'Finish 12 books this year',
    color: 'sage',
    completedAt: null,
    progress: 25,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    name: 'Daily Gratitude',
    description: 'Write 3 things I am grateful for every evening before bed.',
    type: 'journal',
    unit: 'day',
    endGoal: 60, // '60-day gratitude journaling streak',
    color: 'warm',
    completedAt: null,
    progress: 55,
    createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    name: 'Yoga Evenings',
    description:
      '30 minutes of yoga every evening to wind down and improve flexibility.',
    type: 'workout',
    unit: 'day',
    endGoal: 30, // 'Complete 30-day yoga challenge',
    color: 'sage',
    completedAt: null,
    progress: 30,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    // groupId: 'g1',
  },
]

export const SAMPLE_GROUPS: BlockGroup[] = [
  {
    id: 'g1',
    name: 'Fitness Journey',
    description: 'All my workout and fitness-related goals bundled together.',
    color: 'rust',
    pixelIds: ['1', '6'],
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
