import { PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const demoRoles = [
  { label: 'Admin', role: 'admin', desc: 'Full salon control' },
  { label: 'Groomer', role: 'groomer', desc: 'Schedule and notes' },
]

function LoginPage() {
  const { login, loginWithDemo, getDashboardPath } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const destination = location.state?.from

  async function sendUser(user) {
    navigate(destination || getDashboardPath(user.role), { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(form.email, form.password)
    setLoading(false)
    if (!result.ok) { setError(result.message); return }
    sendUser(result.user)
  }

  async function handleDemo(role) {
    setError('')
    setLoading(true)
    const result = await loginWithDemo(role)
    setLoading(false)
    if (!result.ok) { setError(result.message); return }
    sendUser(result.user)
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '2rem', padding: '2.25rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: 'linear-gradient(135deg,var(--sage),var(--warm))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <PawPrint size={22} color="var(--ink)" />
          </div>

          <div className="section-kicker">Welcome back</div>
          <h1 style={{ margin: '0.4rem 0 0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '2.2rem', color: 'var(--text-strong)' }}>Log in to Pawze</h1>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--muted)' }}>
            Staff members sign in here after the admin creates their account. Customers log in to manage bookings.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {demoRoles.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => handleDemo(item.role)}
                disabled={loading}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderRadius: '1.25rem', padding: '0.85rem 0.9rem', border: '1px solid var(--border)', background: 'var(--card-soft)', cursor: 'pointer', transition: 'border-color 180ms, background 180ms', opacity: loading ? 0.6 : 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(232,184,122,0.4)'; e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card-soft)' }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-strong)' }}>{item.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted-soft)', marginTop: '0.1rem' }}>{item.desc}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>or log in with credentials</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {error && (
            <div style={{ marginBottom: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }} noValidate>
            <label className="field">
              <span>Username or email</span>
              <input
                type="text"
                placeholder="your_username"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="username"
                className="auth-input"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                className="auth-input"
                required
              />
            </label>
            <button type="submit" disabled={loading} className="button-primary justify-center disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
            New customer?{' '}
            <Link to="/register" style={{ color: 'var(--text-strong)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Create an account
            </Link>
          </p>
        </div>

        <div className="auth-side hidden lg:block">
          <img src="/images/cutest-puppy.jpg" alt="Dog grooming" className="h-full w-full rounded-[2rem] object-cover" />
          <div className="auth-overlay">
            <div className="section-kicker">Pawze platform</div>
            <div className="mt-2 text-3xl font-semibold text-white">Appointments, pets, and inventory - one clean workflow.</div>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/70">
              Staff and customers each get a tailored dashboard. Everything updates in real time as appointments move through the grooming pipeline.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
