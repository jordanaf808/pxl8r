import { LoginPage } from '@/components/login-page'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/login')({
  component: RouteComponent,
  validateSearch: (
    search: Record<string, unknown>,
  ): { mode?: 'signin' | 'signup' } => ({
    mode: search.mode === 'signup' ? 'signup' : undefined,
  }),
  beforeLoad: ({ context }) => {
    console.log('//// homepage - session does not exist')
    if (context.session?.user) throw redirect({ to: '/dashboard' })
    return context.session
  },
})

function RouteComponent() {
  const { mode } = Route.useSearch()
  return (
    <>
      <LoginPage
        defaultMode={mode ?? 'signin'}
        onLogin={() => {
          throw redirect({ to: '/dashboard' })
        }}
      />
    </>
  )
}
