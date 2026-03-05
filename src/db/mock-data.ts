import type { Block, BlockGroup } from '@/lib/types'

export const SAMPLE_BLOCKS: Block[] = [
  {
    id: '1',
    name: 'Morning Run Routine',
    description:
      'Build a consistent morning running habit - 5km every day before work.',
    type: 'workout',
    unit: 'kilometers',
    endGoal: 'Run 5km every morning for 30 days',
    color: 'rust',
    completed: false,
    progress: 45,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    groupId: 'g1',
  },
  {
    id: '2',
    name: 'Learn TypeScript',
    description:
      'Master TypeScript fundamentals and advanced types for better code.',
    type: 'skill',
    unit: 'percent',
    endGoal: 'Complete TypeScript deep dive course',
    color: 'slate',
    completed: false,
    progress: 70,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Emergency Fund',
    description:
      'Save enough for 3 months of expenses as a financial safety net.',
    type: 'finance',
    unit: 'dollar',
    endGoal: 'Save $5,000 in emergency fund',
    color: 'gold',
    completed: true,
    progress: 100,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Read 12 Books',
    description: 'Read one book per month covering various genres and topics.',
    type: 'reading',
    unit: 'pages',
    endGoal: 'Finish 12 books this year',
    color: 'sage',
    completed: false,
    progress: 25,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    name: 'Daily Gratitude',
    description: 'Write 3 things I am grateful for every evening before bed.',
    type: 'mood',
    unit: 'rating',
    endGoal: '60-day gratitude journaling streak',
    color: 'warm',
    completed: false,
    progress: 55,
    createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    name: 'Yoga Evenings',
    description:
      '30 minutes of yoga every evening to wind down and improve flexibility.',
    type: 'workout',
    unit: 'hour',
    endGoal: 'Complete 30-day yoga challenge',
    color: 'sage',
    completed: false,
    progress: 30,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    groupId: 'g1',
  },
]

export const SAMPLE_GROUPS: BlockGroup[] = [
  {
    id: 'g1',
    name: 'Fitness Journey',
    description: 'All my workout and fitness-related goals bundled together.',
    color: 'rust',
    blockIds: ['1', '6'],
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
