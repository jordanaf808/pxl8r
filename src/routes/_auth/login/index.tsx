import { LoginPage } from '@/components/login-page'
import { createFileRoute } from '@tanstack/react-router'
// import { QUERIES } from '@/db/queries.server'

export const Route = createFileRoute('/_auth/login/')({
  component: RouteComponent,
  // add redirect if user is logged in.
})

function RouteComponent() {
  return <LoginPage onLogin={() => {}} />
}
