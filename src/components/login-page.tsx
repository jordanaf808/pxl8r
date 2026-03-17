import { useState } from 'react'
import {
  SketchyDivider,
  DoodleStar,
  DoodleCircle,
  PaperClipDecoration,
} from '@/components/sketchy-elements'

// Import SignIn and SignUp functions from BetterAuth
import { signIn, signOut, signUp } from '@/lib/auth/auth-client'

interface LoginPageProps {
  onLogin: (name: string, email: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
  }>({})

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

    console.log('//// handleSubmit - email: ', email, 'password: ', password)

    if (validate()) {
      // onLogin(name || 'Journal Keeper', email)
      // const result = await signIn.email({ email, password, callbackURL: '/' })
      // console.log('//// signIn result: ', result)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center paper-dots p-4">
      {/* Floating decorations */}
      <div className="fixed top-8 left-12 opacity-20 hidden md:block">
        <DoodleStar size={40} className="text-[var(--journal-gold)]" />
      </div>
      <div className="fixed top-24 right-16 opacity-15 hidden md:block">
        <DoodleCircle size={32} className="text-[var(--journal-rust)]" />
      </div>
      <div className="fixed bottom-16 left-20 opacity-15 hidden md:block">
        <DoodleCircle size={28} className="text-[var(--journal-sage)]" />
      </div>
      <div className="fixed bottom-32 right-24 opacity-20 hidden md:block">
        <DoodleStar size={36} className="text-[var(--journal-slate)]" />
      </div>

      <div className="w-full max-w-md">
        {/* Notebook card */}
        <div className="relative bg-[var(--journal-cream)] sketch-border p-8 md:p-10">
          {/* Paper clip decoration */}
          <div className="absolute -top-5 right-8">
            <PaperClipDecoration />
          </div>

          {/* Red margin line */}
          <div className="absolute left-12 top-0 bottom-0 w-px bg-[var(--journal-rust)] opacity-30" />

          {/* Header */}
          <div className="text-center mb-8">
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
            <SketchyDivider className="mt-4 text-[var(--journal-warm)]" />
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-6">
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
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              className="w-full mt-4 bg-[var(--journal-ink)] text-[var(--journal-paper)] text-xl py-3 font-serif hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all cursor-pointer"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              {isSignUp ? 'Start My Journal' : 'Open My Journal'}
            </button>
          </form>

          {/* Quick access */}
          <div className="mt-6 text-center">
            <SketchyDivider className="text-[var(--journal-warm)] mb-3" />
            <button
              type="button"
              onClick={() => onLogin('Guest', 'guest@blockjournal.app')}
              className="text-base text-[var(--journal-ink)] opacity-40 hover:opacity-70 transition-opacity font-serif underline decoration-wavy decoration-[var(--journal-warm)] underline-offset-4 cursor-pointer"
            >
              {'or skip ahead ~ preview as guest'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
