import { CalendarClock, CheckCircle2, Dog, PawPrint } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import api from '../../utils/api.js'
import { formatUGX } from '../../utils/currency.js'

const steps = ['Owner', 'Dog', 'Schedule', 'Review']

const blankForm = {
  ownerName: '',
  email: '',
  phone: '',
  dogName: '',
  breed: '',
  age: '',
  weight: '',
  serviceId: '',
  date: '',
  time: '',
  notes: '',
}

const PHONE_RE = /^\+?[1-9]\d{1,14}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function PublicBookingPage() {
  const { addAppointment, currentUser } = useApp()
  const location = useLocation()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState(blankForm)
  const [errors, setErrors] = useState({})
  const [services, setServices] = useState([])
  const selectedServiceName = new URLSearchParams(location.search).get('service')

  useEffect(() => {
    api.get('/services/').then((data) => {
      const list = data?.results ?? data ?? []
      setServices(list)
      if (list.length > 0) {
        const matched = selectedServiceName
          ? list.find((item) => item.name.toLowerCase() === selectedServiceName.toLowerCase())
          : null
        setForm((f) => ({ ...f, serviceId: matched?.id ?? list[0].id }))
      }
    }).catch(() => {})
  }, [selectedServiceName])

  if (currentUser?.role === 'customer') {
    const redirect = selectedServiceName
      ? `/customer?tab=booking&service=${encodeURIComponent(selectedServiceName)}`
      : '/customer?tab=booking'
    return <Navigate to={redirect} replace />
  }

  const selectedService = services.find((s) => String(s.id) === String(form.serviceId))

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validateStep() {
    const errs = {}
    if (step === 0) {
      if (!form.ownerName.trim()) errs.ownerName = 'Name is required.'
      if (!EMAIL_RE.test(form.email)) errs.email = 'Valid email required.'
      if (!PHONE_RE.test(form.phone)) errs.phone = 'Valid phone required (e.g. +256712345678).'
    }
    if (step === 1) {
      if (!form.dogName.trim()) errs.dogName = 'Dog name is required.'
      if (!form.breed.trim()) errs.breed = 'Breed is required.'
    }
    if (step === 2) {
      if (!form.serviceId) errs.serviceId = 'Select a service.'
      if (!form.date) errs.date = 'Select a date.'
      if (!form.time) errs.time = 'Select a time.'
      const t = form.time
      if (t && (t < '09:00' || t > '18:00')) errs.time = 'Time must be between 09:00 and 18:00.'
      if (form.date && form.date < new Date().toISOString().split('T')[0]) errs.date = 'Date must be today or in the future.'
    }
    return errs
  }

  function handleNext() {
    const errs = validateStep()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep((s) => Math.min(3, s + 1))
  }

  async function submitBooking(event) {
    event.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    const notes = [
      `Breed: ${form.breed}`,
      form.age ? `Age: ${form.age}` : null,
      form.weight ? `Weight: ${form.weight}` : null,
      `Contact: ${form.email} / ${form.phone}`,
      form.notes || null,
    ].filter(Boolean).join('. ')

    const result = await addAppointment({
      customer_name: form.ownerName,
      pet_name: form.dogName,
      service: form.serviceId,
      date: form.date,
      time: form.time,
      status: 'pending',
      notes,
    })

    setSubmitting(false)

    if (!result.ok) {
      setSubmitError(result.message)
      return
    }

    setSubmitted(true)
    setStep(0)
    setForm(blankForm)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="section-kicker">Book online</div>
        <h1 className="section-title">Book a grooming visit without opening a dashboard.</h1>
        <p className="section-copy">
          No account needed for a one-off visit. Returning customers can{' '}
          <Link to="/register" className="underline underline-offset-4">create an account</Link>{' '}
          to manage their pets and track all bookings in one place.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Sidebar */}
        <aside className="rounded-[2rem] border border-white/10 bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[rgba(122,170,106,0.14)] text-[var(--sage)]">
              <Dog size={22} />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Public booking</div>
              <div className="text-sm text-[var(--muted)]">No account required</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {steps.map((label, index) => (
              <div key={label} className={`rounded-[1.4rem] border px-4 py-4 text-left transition-colors ${index === step ? 'border-[rgba(232,184,122,0.45)] bg-[rgba(232,184,122,0.1)]' : index < step ? 'border-white/20 bg-white/5' : 'border-white/10 bg-white/4'}`}>
                <div className="text-xs uppercase tracking-[0.18em] text-[rgba(245,240,232,0.45)]">Step {index + 1}</div>
                <div className="mt-1 text-sm font-semibold text-white">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/4 p-4 text-sm leading-7 text-[var(--muted)]">
            <div className="mb-2 flex items-center gap-2 text-white">
              <CalendarClock size={16} />
              Have an account?
            </div>
            Log in as a customer to see your full booking history, add multiple pets, and receive status notifications.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/" className="button-secondary">Back to home</Link>
            <Link to="/login" className="button-primary">Log in</Link>
          </div>
        </aside>

        {/* Form */}
        <div className="rounded-[2rem] border border-white/10 bg-[var(--card)] p-6">
          {submitted && (
            <div className="mb-6 flex items-start gap-3 rounded-[1.4rem] border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Booking request sent!</div>
                <div className="mt-1 text-emerald-200/70">Your appointment is pending confirmation. Staff will reach out to confirm the details.</div>
                <button type="button" className="mt-2 underline underline-offset-4 text-emerald-100" onClick={() => setSubmitted(false)}>
                  Book another appointment
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {submitError}
            </div>
          )}

          <form onSubmit={submitBooking} noValidate className="space-y-6">
            {/* Step 0 — Owner */}
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="field md:col-span-2">
                  <span>Owner name *</span>
                  <input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="Amara Nakato" />
                  {errors.ownerName && <p className="text-xs text-red-400">{errors.ownerName}</p>}
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="amara@example.com" />
                  {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                </label>
                <label className="field">
                  <span>Phone *</span>
                  <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+256712345678" />
                  {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                </label>
              </div>
            )}

            {/* Step 1 — Dog */}
            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>Dog name *</span>
                  <input value={form.dogName} onChange={(e) => set('dogName', e.target.value)} placeholder="Max" />
                  {errors.dogName && <p className="text-xs text-red-400">{errors.dogName}</p>}
                </label>
                <label className="field">
                  <span>Breed *</span>
                  <input value={form.breed} onChange={(e) => set('breed', e.target.value)} placeholder="Labrador" />
                  {errors.breed && <p className="text-xs text-red-400">{errors.breed}</p>}
                </label>
                <label className="field">
                  <span>Age (optional)</span>
                  <input value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="2 years" />
                </label>
                <label className="field">
                  <span>Weight (optional)</span>
                  <input value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="25 kg" />
                </label>
              </div>
            )}

            {/* Step 2 — Schedule */}
            {step === 2 && (
              <div className="space-y-4">
                {errors.serviceId && <p className="text-xs text-red-400">{errors.serviceId}</p>}
                <div className="grid gap-4 lg:grid-cols-2">
                  {services.map((svc) => (
                    <button key={svc.id} type="button" onClick={() => set('serviceId', svc.id)}
                      className={`rounded-[1.75rem] border p-5 text-left transition-colors ${String(form.serviceId) === String(svc.id) ? 'border-[rgba(232,184,122,0.45)] bg-[rgba(232,184,122,0.1)]' : 'border-white/10 bg-white/4 hover:bg-white/7'}`}>
                      <div className="text-lg font-semibold text-white">{svc.name}</div>
                      <div className="mt-1 text-sm text-[var(--muted)]">{svc.duration} min · {formatUGX(svc.price)}</div>
                      {svc.description && <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{svc.description}</p>}
                    </button>
                  ))}
                  {services.length === 0 && (
                    <p className="text-sm text-white/40 col-span-2">Loading services…</p>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="field">
                    <span>Date *</span>
                    <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    {errors.date && <p className="text-xs text-red-400">{errors.date}</p>}
                  </label>
                  <label className="field">
                    <span>Time * (09:00–18:00)</span>
                    <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} min="09:00" max="18:00" />
                    {errors.time && <p className="text-xs text-red-400">{errors.time}</p>}
                  </label>
                  <label className="field md:col-span-2">
                    <span>Special notes (optional)</span>
                    <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Allergies, temperament, pickup preferences…" />
                  </label>
                </div>
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/4 p-6">
                <div className="mb-4 flex items-center gap-2 text-white">
                  <PawPrint size={16} />
                  Review your appointment
                </div>
                <dl className="grid gap-3 text-sm">
                  {[
                    ['Owner', form.ownerName],
                    ['Contact', `${form.email} · ${form.phone}`],
                    ['Dog', `${form.dogName} (${form.breed}${form.age ? `, ${form.age}` : ''}${form.weight ? `, ${form.weight}` : ''})`],
                    ['Service', selectedService ? `${selectedService.name} — ${selectedService.duration} min · ${formatUGX(selectedService.price)}` : '—'],
                    ['Date', form.date || '—'],
                    ['Time', form.time || '—'],
                    ['Notes', form.notes || 'None'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-white/45 shrink-0">{label}</dt>
                      <dd className="text-white text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="button-secondary disabled:opacity-50">
                Back
              </button>
              {step < 3 ? (
                <button type="button" onClick={handleNext} className="button-primary">
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="button-primary disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit appointment'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default PublicBookingPage
