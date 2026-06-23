import { useState } from 'react'
import {
  SketchyDivider,
  DoodleStar,
  DoodleCircle,
  PaperClipDecoration,
} from '@/components/sketchy-elements'

// Import SignIn and SignUp functions from BetterAuth
import { signIn, signOut, signUp, GitHubSignIn } from '@/lib/auth/auth-client'

interface LoginPageProps {
  onLogin?: () => void
  defaultMode?: 'signin' | 'signup'
}

export function LoginPage({ onLogin, defaultMode = 'signin' }: LoginPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup')
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
  }>({})
  const [authError, setAuthError] = useState('')

  const validate = () => {
    const newErrors: typeof errors = {}
    if (isSignUp && !name.trim()) newErrors.name = 'What should we call you?'
    if (!email.trim()) newErrors.email = 'We need your email!'
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "That doesn't look like an email..."
    if (!password.trim()) newErrors.password = "Don't forget your password!"
    else if (password.length < 6)
      newErrors.password = 'At least 6 characters, please!'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    if (validate()) {
      const result = isSignUp
        ? await signUp.email({ email, password, name, callbackURL: '/' })
        : await signIn.email({ email, password, callbackURL: '/' })

      if (result.error) {
        setAuthError(
          result.error.message ?? 'Something went wrong. Please try again.',
        )
        return
      }

      onLogin?.()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Notebook card */}
        <div className="relative bg-[var(--journal-cream)] sketch-border p-8 md:p-10 paper-dots z-1 overflow-clip">
          {/* Paper clip decoration */}
          <div className="absolute -top-[4px] right-2">
            <PaperClipDecoration />
          </div>

          {/* Red margin line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--journal-rust)] opacity-30 z-[-1]" />

          {/* Header */}
          <div className="text-center mb-8 z-2">
            <h1 className="text-5xl md:text-6xl font-bold text-[var(--journal-ink)] leading-tight">
              BlockJournal
            </h1>
            <div className="mt-1 flex items-center justify-center gap-2">
              <DoodleStar size={14} className="text-[var(--journal-gold)]" />
              <p className="text-lg text-[var(--journal-ink)] opacity-60 font-serif">
                your goals, sketched out
              </p>
              <DoodleStar size={14} className="text-[var(--journal-gold)]" />
            </div>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-6 z-2">
            <div className="flex bg-[var(--journal-paper)] sketch-border-light p-1 gap-1">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`px-5 py-1.5 text-lg font-serif transition-all ${
                  !isSignUp
                    ? 'bg-[var(--journal-ink)] text-[var(--journal-paper)]'
                    : 'text-[var(--journal-ink)] hover:bg-[var(--journal-tan)] hover:bg-opacity-50'
                }`}
                style={{ borderRadius: '2px 6px 4px 8px' }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`px-5 py-1.5 text-lg font-serif transition-all ${
                  isSignUp
                    ? 'bg-[var(--journal-ink)] text-[var(--journal-paper)]'
                    : 'text-[var(--journal-ink)] hover:bg-[var(--journal-tan)] hover:bg-opacity-50'
                }`}
                style={{ borderRadius: '2px 6px 4px 8px' }}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 z-2">
            {isSignUp && (
              <div className="animate-float-in">
                <label className="block text-lg text-[var(--journal-ink)] mb-1 font-serif">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex the Great"
                  className="w-full bg-transparent border-b-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-xl py-2 px-1 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans"
                />
                {errors.name && (
                  <p className="text-sm text-[var(--journal-rust)] mt-1 font-serif">
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-lg text-[var(--journal-ink)] mb-1 font-serif">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent border-b-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-xl py-2 px-1 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans"
              />
              {errors.email && (
                <p className="text-sm text-[var(--journal-rust)] mt-1 font-serif">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-lg text-[var(--journal-ink)] mb-1 font-serif">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="something secret..."
                className="w-full bg-transparent border-b-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-xl py-2 px-1 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans"
              />
              {errors.password && (
                <p className="text-sm text-[var(--journal-rust)] mt-1 font-serif">
                  {errors.password}
                </p>
              )}
            </div>

            {authError && (
              <p className="text-sm text-[var(--journal-rust)] text-center font-serif">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full mt-4 bg-[var(--journal-ink)] text-[var(--journal-paper)] text-xl py-3 font-serif hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all cursor-pointer"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              {isSignUp ? 'Start My Journal' : 'Open My Journal'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-[var(--journal-warm)] opacity-40" />
            <span className="text-sm text-[var(--journal-ink)] opacity-40 font-serif">
              or
            </span>
            <div className="h-px flex-1 bg-[var(--journal-warm)] opacity-40" />
          </div>

          <button
            type="button"
            onClick={() => GitHubSignIn()}
            className="w-full flex items-center justify-center gap-2 bg-[var(--journal-paper)] text-[var(--journal-ink)] text-lg py-3 font-serif border-2 border-[var(--journal-warm)] hover:bg-[var(--journal-tan)] active:translate-y-px transition-all cursor-pointer"
            style={{ borderRadius: '3px 8px 5px 10px' }}
          >
            <svg viewBox="0 0 16 16" width={20} height={20} fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Continue with GitHub
          </button>

          {/* Quick access */}
          {/* <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onLogin('Guest', 'guest@blockjournal.app')}
              className="text-base text-[var(--journal-ink)] opacity-40 hover:opacity-70 transition-opacity font-serif underline decoration-wavy decoration-[var(--journal-warm)] underline-offset-4 cursor-pointer"
            >
              {'or skip ahead ~ preview as guest'}
            </button>
          </div> */}
        </div>
      </div>
    </div>
  )
}
