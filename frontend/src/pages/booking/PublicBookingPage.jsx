import { CalendarClock, CheckCircle2, Dog, PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { services } from '../../data/mockData.js'
import { useApp } from '../../context/AppContext.jsx'
import { formatUGX } from '../../utils/currency.js'

const dogServices = services.filter((service) => service.id !== 'spa-reset').concat(
  services.find((service) => service.id === 'spa-reset') ? [services.find((service) => service.id === 'spa-reset')] : [],
)

const steps = ['Owner', 'Dog', 'Schedule', 'Review']

function PublicBookingPage() {
  const { addAppointment } = useApp()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    phone: '',
    dogName: '',
    breed: '',
    age: '',
    weight: '',
    service: dogServices[0]?.name || '',
    date: '',
    time: '',
    notes: '',
  })

  const canContinue =
    (step === 0 && Boolean(form.ownerName && form.email && form.phone)) ||
    (step === 1 && Boolean(form.dogName && form.breed)) ||
    (step === 2 && Boolean(form.service && form.date && form.time))

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function submitBooking(event) {
    event.preventDefault()

    addAppointment({
      customerId: 'guest-booking',
      customerName: form.ownerName,
      petId: `guest-${Date.now()}`,
      petName: form.dogName,
      service: form.service,
      date: form.date,
      time: form.time,
      groomerId: 'user-groomer',
      groomerName: 'Assigned by staff',
      status: 'pending',
      notes: `Dog booking only. Breed: ${form.breed}. Age: ${form.age || 'n/a'}. Weight: ${form.weight || 'n/a'}. Contact: ${form.phone}. ${form.notes}`.trim(),
    })

    setSubmitted(true)
    setStep(0)
    setForm({
      ownerName: '',
      email: '',
      phone: '',
      dogName: '',
      breed: '',
      age: '',
      weight: '',
      service: dogServices[0]?.name || '',
      date: '',
      time: '',
      notes: '',
    })
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="section-kicker">Dog appointments only</div>
        <h1 className="section-title">Book a grooming visit without opening a dashboard.</h1>
        <p className="section-copy">
          Customers stay on the public side of Pawze. Staff work happens in protected dashboards after the admin
          creates their credentials.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[rgba(122,170,106,0.14)] text-[var(--sage)]">
              <Dog size={22} />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Customer access</div>
              <div className="text-sm text-[var(--muted)]">Landing page + scheduling only</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {steps.map((label, index) => (
              <div
                key={label}
                className={`rounded-[1.4rem] border px-4 py-4 text-left ${
                  index === step ? 'border-[rgba(232,184,122,0.45)] bg-[rgba(232,184,122,0.1)]' : 'border-white/10 bg-white/4'
                }`}
              >
                <div className="text-xs uppercase tracking-[0.18em] text-[rgba(245,240,232,0.45)]">Step {index + 1}</div>
                <div className="mt-1 text-sm font-semibold text-white">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/4 p-4 text-sm leading-7 text-[var(--muted)]">
            <div className="mb-2 flex items-center gap-2 text-white">
              <CalendarClock size={16} />
              Staff access note
            </div>
            Groomers and admins sign in through the staff portal after the admin assigns an initial password.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/" className="button-secondary">
              Back to landing
            </Link>
            <Link to="/login" className="button-primary">
              Staff login
            </Link>
          </div>
        </aside>

        <div className="rounded-[2rem] border border-white/10 bg-[var(--card)] p-6">
          {submitted && (
            <div className="mb-6 flex items-start gap-3 rounded-[1.4rem] border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Booking request sent.</div>
                <div>Your dog appointment has been added and will appear for staff in the scheduling dashboard.</div>
              </div>
            </div>
          )}

          <form onSubmit={submitBooking} className="space-y-6">
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="field md:col-span-2">
                  <span>Owner name</span>
                  <input value={form.ownerName} onChange={(event) => updateField('ownerName', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Phone</span>
                  <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>Dog name</span>
                  <input value={form.dogName} onChange={(event) => updateField('dogName', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Breed</span>
                  <input value={form.breed} onChange={(event) => updateField('breed', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Age</span>
                  <input value={form.age} onChange={(event) => updateField('age', event.target.value)} placeholder="Optional" />
                </label>
                <label className="field">
                  <span>Weight</span>
                  <input value={form.weight} onChange={(event) => updateField('weight', event.target.value)} placeholder="Optional" />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  {dogServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => updateField('service', service.name)}
                      className={`rounded-[1.75rem] border p-5 text-left transition ${
                        form.service === service.name ? 'border-[rgba(232,184,122,0.45)] bg-[rgba(232,184,122,0.1)]' : 'border-white/10 bg-white/4'
                      }`}
                    >
                      <div className="text-lg font-semibold text-white">{service.name}</div>
                      <div className="mt-2 text-sm text-[var(--muted)]">{service.duration} - {formatUGX(service.price)}</div>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{service.description}</p>
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="field">
                    <span>Date</span>
                    <input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} required />
                  </label>
                  <label className="field">
                    <span>Time</span>
                    <input type="time" value={form.time} onChange={(event) => updateField('time', event.target.value)} required />
                  </label>
                  <label className="field md:col-span-2">
                    <span>Special notes</span>
                    <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Temperament, skin sensitivity, coat notes, pickup details..." />
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/4 p-6">
                <div className="mb-4 flex items-center gap-2 text-white">
                  <PawPrint size={16} />
                  Review your dog appointment
                </div>
                <div className="grid gap-3 text-sm text-[var(--muted)]">
                  <div>Owner: {form.ownerName}</div>
                  <div>Contact: {form.email} - {form.phone}</div>
                  <div>Dog: {form.dogName} ({form.breed})</div>
                  <div>Service: {form.service}</div>
                  <div>Schedule: {form.date || 'Select a date'} at {form.time || 'Select a time'}</div>
                  <div>Notes: {form.notes || 'No notes added'}</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={step === 0} onClick={() => setStep((prev) => Math.max(0, prev - 1))} className="button-secondary disabled:opacity-50">
                Back
              </button>
              {step < 3 ? (
                <button type="button" disabled={!canContinue} onClick={() => setStep((prev) => Math.min(3, prev + 1))} className="button-primary disabled:opacity-50">
                  Continue
                </button>
              ) : (
                <button type="submit" className="button-primary">
                  Submit dog appointment
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
