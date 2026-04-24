import { useEffect, useState } from 'react'
import { signOut, useSession } from '@/lib/auth/auth-client.ts'

import { Link, useNavigate } from '@tanstack/react-router'
import { Database, Globe, Home, Menu, X, Moon, Sun, LogOut } from 'lucide-react'
import BetterAuthHeader from '@/integrations/better-auth/header-user.tsx'

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user
  const navigate = useNavigate({ from: '/dashboard/' })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

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
    <>
      <header className="sticky top-0 z-40 bg-[var(--journal-cream)]/95 backdrop-blur-sm border-b-2 border-[var(--journal-ink)]/60">
        <div className="max-w-7xl mx-auto px-4 md:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 outline-0 outline-gray-700 hover:outline-[0.01rem] hover:cursor-pointer gray-700 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--journal-ink)]">
              <Link to="/">PXL8</Link>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-base font-serif text-[var(--journal-ink)] opacity-60 hidden sm:inline">
              {user && (
                <>
                  {user.name}
                  {"'s journal"}
                </>
              )}
            </span>
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center justify-center w-9 h-9 text-[var(--journal-ink)] opacity-50 hover:opacity-100 transition-all cursor-pointer bg-[var(--journal-paper)] hover:bg-[var(--journal-tan)]"
              style={{ borderRadius: '2px 6px 4px 8px' }}
              aria-label={
                isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
              }
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-[var(--journal-ink)] opacity-50 hover:opacity-100 transition-opacity font-serif cursor-pointer"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Close Journal</span>
            </button>
          </div>
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[var(--journal-cream)]/98 text-[var(--journal-ink)] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between py-3 px-4 border-b-2 border-[var(--journal-ink)]/60 text-[var(--journal-ink)]">
          <h2 className="text-xl font-bold">PXL8</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 outline-0 outline-[var(--journal-ink)] hover:outline-[0.01rem] rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg outline-0 outline-[var(--journal-ink)] hover:outline-[0.01rem] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {/* Demo Links Start */}

          <Link
            to="/demo/drizzle"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg outline-0 outline-[var(--journal-ink)] hover:outline-[0.01rem] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Database size={20} />
            <span className="font-medium">Drizzle</span>
          </Link>

          <Link
            to="/demo/better-auth"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg outline-0 outline-[var(--journal-ink)] hover:outline-[0.01rem] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Globe size={20} />
            <span className="font-medium">Better Auth</span>
          </Link>

          {/* Demo Links End */}
        </nav>

        <div className="p-4 border-t border-gray-700 flex flex-col gap-2">
          <BetterAuthHeader />
        </div>
      </aside>
    </>
  )
}
