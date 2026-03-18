import { LoginPage } from '@/components/login-page'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/login')({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    console.log('//// homepage - session does not exist')
    if (context.session?.user) throw redirect({ to: '/dashboard' })
    return context.session
  },
})

function RouteComponent() {
  return (
    <>
      <LoginPage
        onLogin={() => {
          throw redirect({ to: '/dashboard' })
        }}
      />
    </>
  )
}
