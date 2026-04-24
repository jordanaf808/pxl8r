import type { NewUser } from '@/db/types'
import { signOut } from '@/lib/auth/auth-client'
import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

interface DashboardHeader {
  user: NewUser
}

function DashboardHeader({ user }: DashboardHeader) {
  const navigate = useNavigate({ from: '/dashboard/' })

  function onLogout() {
    return signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: '/' }) // redirect to homepage
        },
        onError: (ctx) => {
          console.log('//// onLogout error: ', ctx.error.message)
          throw new Error(ctx.error.error)
        },
      },
    })
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--journal-cream)]/95 backdrop-blur-sm border-p-2 border-[var(--journal-warm)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--journal-ink)]">
            PXL8
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-base font-serif text-[var(--journal-ink)] opacity-60 hidden sm:inline">
            {user.name}
            {"'s journal"}
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-[var(--journal-ink)] opacity-50 hover:opacity-100 transition-opacity font-serif cursor-pointer"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
