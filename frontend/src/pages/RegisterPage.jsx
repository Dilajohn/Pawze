import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PawPrint, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

function validate(form) {
  const errors = {}
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRe = /^\+?[1-9]\d{1,14}$/

  if (!form.username.trim()) errors.username = 'Username is required.'
  if (!emailRe.test(form.email)) errors.email = 'Enter a valid email address.'
  if (form.phone && !phoneRe.test(form.phone)) errors.phone = 'Enter a valid phone number (e.g. +256712345678).'
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (form.password !== form.password_confirm) errors.password_confirm = 'Passwords do not match.'

  return errors
}

function RegisterPage() {
  const { register, getDashboardPath } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fieldErrors = validate(form)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    setServerError('')
    const result = await register(form)
    setSubmitting(false)

    if (!result.ok) {
      setServerError(result.message)
      return
    }

    navigate(getDashboardPath(result.user.role), { replace: true })
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        {/* Image side */}
        <div className="auth-side hidden lg:block">
          <img
            src="/images/german-shepherd.jpg"
            alt="Dog grooming"
            className="h-full w-full rounded-[2rem] object-cover"
          />
          <div className="auth-overlay">
            <div className="section-kicker">Create your account</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              Customer self-registration. Staff accounts are provisioned by admins.
            </div>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/70">
              Register to book grooming appointments, manage your pets, and track your visit history.
            </p>
          </div>
        </div>

        {/* Form side */}
        <div className="rounded-[2rem] border border-white/10 bg-[var(--card)] p-8">
          <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: 'linear-gradient(135deg,var(--sage),var(--warm))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <PawPrint size={22} color="var(--ink)" />
          </div>

          <div className="section-kicker">New account</div>
          <h1 className="mt-2 font-display text-4xl text-white">Create your Pawze account.</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Customers register here to start booking. Groomers and admins receive their credentials from the admin.
          </p>

          {serverError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={errors.first_name}>
                <input
                  type="text"
                  placeholder="Amara"
                  value={form.first_name}
                  onChange={(e) => set('first_name', e.target.value)}
                  className="auth-input"
                />
              </Field>
              <Field label="Last name" error={errors.last_name}>
                <input
                  type="text"
                  placeholder="Nakato"
                  value={form.last_name}
                  onChange={(e) => set('last_name', e.target.value)}
                  className="auth-input"
                />
              </Field>
            </div>

            <Field label="Username *" error={errors.username}>
              <input
                type="text"
                placeholder="amara_nakato"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                autoComplete="username"
                className="auth-input"
                required
              />
            </Field>

            <Field label="Email address *" error={errors.email}>
              <input
                type="email"
                placeholder="amara@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="email"
                className="auth-input"
                required
              />
            </Field>

            <Field label="Phone number" error={errors.phone}>
              <input
                type="tel"
                placeholder="+256712345678"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="auth-input"
              />
            </Field>

            <Field label="Password *" error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete="new-password"
                  className="auth-input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password *" error={errors.password_confirm}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={form.password_confirm}
                onChange={(e) => set('password_confirm', e.target.value)}
                autoComplete="new-password"
                className="auth-input"
                required
              />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="button-primary w-full justify-center disabled:opacity-50"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Already have an account?{' '}
            <Link to="/login" className="text-white underline underline-offset-4 hover:opacity-80">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export default RegisterPage
