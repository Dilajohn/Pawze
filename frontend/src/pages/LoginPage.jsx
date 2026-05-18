import { PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const demoRoles = [
  { label: 'Admin', role: 'admin' },
  { label: 'Groomer', role: 'groomer' },
  { label: 'Customer', role: 'customer' },
]

function LoginPage() {
  const { login, loginWithDemo, getDashboardPath } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const destination = location.state?.from

  function sendUser(user) {
    navigate(destination || getDashboardPath(user.role), { replace: true })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = login(form.email, form.password)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setError('')
    sendUser(result.user)
  }

  function handleDemo(role) {
    const result = loginWithDemo(role)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setError('')
    sendUser(result.user)
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="rounded-[2rem] border border-white/10 bg-[var(--color-panel)] p-7">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-peach)] text-[var(--color-ink)]">
            <PawPrint size={24} />
          </div>
          <div className="section-kicker">Welcome back</div>
          <h1 className="font-display text-4xl text-white">Log in to Pawze</h1>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Continue to your dashboard or use a demo role to explore the full product instantly.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {demoRoles.map((item) => (
              <button key={item.role} type="button" onClick={() => handleDemo(item.role)} className="demo-chip">
                {item.label}
              </button>
            ))}
          </div>

          <div className="my-6 h-px bg-white/10" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="hello@pawze.app"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter your password"
                required
              />
            </label>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" className="button-primary w-full justify-center">
              Log in
            </button>
          </form>

          <p className="mt-6 text-sm text-white/55">
            New to Pawze?{' '}
            <Link to="/register" className="text-[var(--color-peach)]">
              Create an account
            </Link>
          </p>
        </div>

        <div className="auth-side">
          <img src="/images/image-7.jpg" alt="Dog portrait" className="h-full w-full rounded-[2rem] object-cover" />
          <div className="auth-overlay">
            <div className="section-kicker">Demo credentials</div>
            <div className="mt-2 text-3xl font-semibold text-white">No typing needed.</div>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/70">
              Quick demo buttons sign you in as an admin, groomer, or customer and preserve the session with
              localStorage.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
