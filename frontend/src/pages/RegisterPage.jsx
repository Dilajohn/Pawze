import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

function scorePassword(password) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

function RegisterPage() {
  const { register, getDashboardPath } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    role: 'customer',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const passwordScore = useMemo(() => scorePassword(form.password), [form.password])
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword

  function handleSubmit(event) {
    event.preventDefault()

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const result = register({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      location: form.location,
      role: form.role,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate(getDashboardPath(result.user.role), { replace: true })
  }

  const meterWidth = `${(passwordScore / 4) * 100}%`
  const meterTone = passwordScore >= 3 ? 'bg-emerald-400' : passwordScore >= 2 ? 'bg-amber-300' : 'bg-rose-300'

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="auth-side hidden lg:block">
          <img src="/images/german-shepherd.jpg" alt="German shepherd" className="h-full w-full rounded-[2rem] object-cover" />
          <div className="auth-overlay">
            <div className="section-kicker">Role-based onboarding</div>
            <div className="mt-2 text-3xl font-semibold text-white">Create a customer, groomer, or admin profile.</div>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/70">
              Validation happens in real time, and successful registration signs the user in right away.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[var(--color-panel)] p-7">
          <div className="section-kicker">Join Pawze</div>
          <h1 className="font-display text-4xl text-white">Create your account</h1>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Build a persistent account with protected access and a role-aware dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="field">
              <span>Full name</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                <span>Email</span>
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </label>
              <label className="field">
                <span>Phone</span>
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                <span>Location</span>
                <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required />
              </label>
              <label className="field">
                <span>Role</span>
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  <option value="customer">Customer</option>
                  <option value="groomer">Groomer</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full transition-all duration-300 ${meterTone}`} style={{ width: meterWidth }} />
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              Strength: {passwordScore <= 1 ? 'weak' : passwordScore === 2 ? 'fair' : passwordScore === 3 ? 'strong' : 'excellent'}
            </div>
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                required
              />
            </label>
            {form.confirmPassword && (
              <p className={`text-sm ${passwordsMatch ? 'text-emerald-300' : 'text-rose-300'}`}>
                {passwordsMatch ? 'Passwords match.' : 'Passwords do not match yet.'}
              </p>
            )}
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" className="button-primary w-full justify-center">
              Create account
            </button>
          </form>

          <p className="mt-6 text-sm text-white/55">
            Already registered?{' '}
            <Link to="/login" className="text-[var(--color-peach)]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
