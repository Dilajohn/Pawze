import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

function ChangePasswordPrompt() {
  const { changePassword, logout } = useApp()
  const [form, setForm] = useState({ old_password: '', new_password: '', new_password_confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (form.new_password !== form.new_password_confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await changePassword(form.old_password, form.new_password, form.new_password_confirm)
    setLoading(false)

    if (!result.ok) setError(result.message)
    // On success, AppContext clears must_change_password → ProtectedRoute renders normally
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-ink, #141410)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '2rem', padding: '2.5rem' }}>
        <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: 'linear-gradient(135deg,var(--sage),var(--warm))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <KeyRound size={20} color="var(--ink)" />
        </div>

        <div className="section-kicker">Action required</div>
        <h1 style={{ margin: '0.4rem 0 0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '1.9rem', color: '#fff' }}>
          Change your password
        </h1>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--muted)' }}>
          Your account was provisioned by an admin. You must set a new personal password before continuing.
        </p>

        {error && (
          <div style={{ marginBottom: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }} noValidate>
          <label className="field">
            <span>Current (initial) password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={form.old_password}
              onChange={(e) => setForm({ ...form, old_password: e.target.value })}
              autoComplete="current-password"
              className="auth-input"
              required
            />
          </label>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              autoComplete="new-password"
              className="auth-input"
              required
            />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <input
              type="password"
              placeholder="Repeat new password"
              value={form.new_password_confirm}
              onChange={(e) => setForm({ ...form, new_password_confirm: e.target.value })}
              autoComplete="new-password"
              className="auth-input"
              required
            />
          </label>

          <button type="submit" disabled={loading} className="button-primary justify-center disabled:opacity-50">
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>

        <button
          type="button"
          onClick={logout}
          style={{ marginTop: '1rem', width: '100%', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          Log out instead
        </button>
      </div>
    </div>
  )
}

export default ChangePasswordPrompt
