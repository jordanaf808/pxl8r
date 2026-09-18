import { createFileRoute, redirect } from '@tanstack/react-router'
import HomePage from '@/features/homepage/Homepage'

export const Route = createFileRoute('/')({
  component: HomePage,
  beforeLoad: ({ context }) => {
    console.log('//// homepage - session does not exist')
    if (context.session?.user) throw redirect({ to: '/dashboard' })
  },
})
