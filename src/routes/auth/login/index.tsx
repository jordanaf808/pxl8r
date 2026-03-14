import { LoginPage } from '@/components/login-page'
import { createFileRoute } from '@tanstack/react-router'
// import { QUERIES } from '@/db/queries.server'

export const Route = createFileRoute('/auth/login/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LoginPage onLogin={() => {}} />
}
