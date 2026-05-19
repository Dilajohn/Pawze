import { PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const demoRoles = [
  { label: 'Admin', role: 'admin', desc: 'Full salon control' },
  { label: 'Groomer', role: 'groomer', desc: 'Schedule & notes' },
  { label: 'Customer', role: 'customer', desc: 'Book & track pets' },
]

function LoginPage() {
  const { login, loginWithDemo, getDashboardPath } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const destination = location.state?.from

  function sendUser(user) { navigate(destination || getDashboardPath(user.role), { replace: true }) }
  function handleSubmit(event) {
    event.preventDefault()
    const result = login(form.email, form.password)
    if (!result.ok) { setError(result.message); return }
    setError(''); sendUser(result.user)
  }
  function handleDemo(role) {
    const result = loginWithDemo(role)
    if (!result.ok) { setError(result.message); return }
    setError(''); sendUser(result.user)
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">

        {/* form side */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '2rem', padding: '2.25rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: 'linear-gradient(135deg,var(--sage),var(--warm))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <PawPrint size={22} color="var(--ink)" />
          </div>

          <div className="section-kicker">Welcome back</div>
          <h1 style={{ margin: '0.4rem 0 0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '2.2rem', color: '#fff' }}>Log in to Pawze</h1>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--muted)' }}>
            Continue to your dashboard or use a demo role to explore the full product instantly.
          </p>

          {/* demo buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {demoRoles.map((item) => (
              <button key={item.role} type="button" onClick={() => handleDemo(item.role)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderRadius: '1.25rem', padding: '0.85rem 0.9rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'border-color 180ms, background 180ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(232,184,122,0.4)'; e.currentTarget.style.background='rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{item.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.45)', marginTop: '0.1rem' }}>{item.desc}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>or sign in</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} placeholder="hello@pawze.app" required
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={form.password} placeholder="Enter your password" required
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
            {error && <p style={{ margin: 0, fontSize: '0.88rem', color: '#fca5a5' }}>{error}</p>}
            <button type="submit" className="button-primary" style={{ justifyContent: 'center', width: '100%', marginTop: '0.25rem' }}>
              Log in
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.88rem', color: 'rgba(245,240,232,0.5)' }}>
            New to Pawze?{' '}
            <Link to="/register" style={{ color: 'var(--warm)', textDecoration: 'none' }}>Create an account</Link>
          </p>
        </div>

        {/* image side */}
        <div className="auth-side">
          <img src="/images/image-7.jpg" alt="Dog portrait" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div className="auth-overlay">
            <div className="section-kicker">Demo credentials</div>
            <div style={{ marginTop: '0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '2rem', color: '#fff', lineHeight: 1.1 }}>No typing needed.</div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.7, color: 'rgba(245,240,232,0.7)', maxWidth: '24rem' }}>
              Quick demo buttons sign you in as an admin, groomer, or customer and preserve your session automatically.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

export default LoginPage
