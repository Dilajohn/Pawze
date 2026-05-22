import { CalendarClock, History, PawPrint, Settings, Bell, Star } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import api from '../../utils/api.js'
import { formatUGX } from '../../utils/currency.js'

const wizardSteps = ['Service', 'Pet', 'Schedule', 'Review']

const blankPet = { name: '', breed: '', age: '', weight: '', notes: '' }

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)}
          style={{ color: i <= value ? 'var(--warm)' : 'rgba(255,255,255,0.25)', fontSize: '22px', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
          ★
        </button>
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-amber-300/15 text-amber-200',
    confirmed: 'bg-blue-400/15 text-blue-300',
    'in-progress': 'bg-purple-400/15 text-purple-200',
    completed: 'bg-green-400/15 text-green-300',
    cancelled: 'bg-red-400/15 text-red-300',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs uppercase tracking-wider ${colors[status] ?? 'bg-white/10 text-white/60'}`}>
      {status}
    </span>
  )
}

function CustomerDashboard() {
  const { currentUser, addPet, updatePet, deletePet, addAppointment, updateProfile, submitFeedback } = useApp()
  const [activeTab, setActiveTab] = useState('booking')
  const [step, setStep] = useState(0)
  const [petForm, setPetForm] = useState(blankPet)
  const [editingPetId, setEditingPetId] = useState(null)
  const [settings, setSettings] = useState({
    first_name: currentUser?.first_name ?? '',
    last_name: currentUser?.last_name ?? '',
    phone: currentUser?.phone ?? '',
    location: currentUser?.location ?? '',
  })
  const [feedbackState, setFeedbackState] = useState({})  // { [appointmentId]: { rating, comments } }
  const [feedbackSent, setFeedbackSent] = useState({})    // { [appointmentId]: true }

  // Remote data
  const [pets, setPets] = useState([])
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [notifications, setNotifications] = useState([])

  const [booking, setBooking] = useState({ service_id: '', pet_id: '', date: '', time: '', notes: '' })
  const [bookingSubmitted, setBookingSubmitted] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const fetchAll = useCallback(async () => {
    const [petRes, apptRes, svcRes, notifRes] = await Promise.allSettled([
      api.get('/pets/'),
      api.get('/appointments/'),
      api.get('/services/'),
      api.get('/notifications/'),
    ])
    if (petRes.status === 'fulfilled') {
      const p = petRes.value?.results ?? petRes.value ?? []
      setPets(p)
      if (!booking.pet_id && p.length > 0) setBooking((b) => ({ ...b, pet_id: p[0].id }))
    }
    if (apptRes.status === 'fulfilled') setAppointments(apptRes.value?.results ?? apptRes.value ?? [])
    if (svcRes.status === 'fulfilled') {
      const s = svcRes.value?.results ?? svcRes.value ?? []
      setServices(s)
      if (!booking.service_id && s.length > 0) setBooking((b) => ({ ...b, service_id: s[0].id }))
    }
    if (notifRes.status === 'fulfilled') setNotifications(notifRes.value?.results ?? notifRes.value ?? [])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll() }, [fetchAll])

  const selectedService = services.find((s) => String(s.id) === String(booking.service_id))
  const selectedPet = pets.find((p) => String(p.id) === String(booking.pet_id))
  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Wizard validation
  const canContinue =
    (step === 0 && !!booking.service_id) ||
    (step === 1 && !!booking.pet_id) ||
    (step === 2 && booking.date && booking.time)

  async function submitBooking(event) {
    event.preventDefault()
    setBookingError('')
    const result = await addAppointment({
      pet: booking.pet_id || null,
      pet_name: selectedPet?.name ?? currentUser?.first_name ?? 'Guest pet',
      service: booking.service_id,
      date: booking.date,
      time: booking.time,
      notes: booking.notes,
      customer_name: `${currentUser?.first_name ?? ''} ${currentUser?.last_name ?? ''}`.trim(),
    })
    if (!result.ok) { setBookingError(result.message); return }
    setBookingSubmitted(true)
    setStep(0)
    setBooking({ service_id: services[0]?.id ?? '', pet_id: pets[0]?.id ?? '', date: '', time: '', notes: '' })
    fetchAll()
  }

  async function submitPet(event) {
    event.preventDefault()
    const result = editingPetId ? await updatePet(editingPetId, petForm) : await addPet(petForm)
    if (!result.ok) return
    setPetForm(blankPet)
    setEditingPetId(null)
    fetchAll()
  }

  async function handleDeletePet(id) {
    await deletePet(id)
    fetchAll()
  }

  async function handleFeedbackSubmit(appointmentId) {
    const fb = feedbackState[appointmentId] ?? { rating: 5, comments: '' }
    const result = await submitFeedback(appointmentId, fb.rating, fb.comments)
    if (result.ok) {
      setFeedbackSent((prev) => ({ ...prev, [appointmentId]: true }))
      fetchAll()
    }
  }

  async function markNotifRead(id) {
    await api.patch(`/notifications/${id}/mark_read/`)
    fetchAll()
  }

  async function saveSettings(event) {
    event.preventDefault()
    await updateProfile(settings)
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-top">
        <div>
          <div className="section-kicker">Customer dashboard</div>
          <h1 className="font-display text-4xl text-white">
            Welcome, {currentUser?.first_name || currentUser?.username || 'there'}.
          </h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <div className="metric-label">Your pets</div>
            <div className="metric-value">{pets.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Appointments</div>
            <div className="metric-value">{appointments.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Notifications</div>
            <div className="metric-value">{unreadCount}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <aside className="dashboard-nav">
          {[
            { key: 'booking', label: 'Book appointment', icon: CalendarClock },
            { key: 'pets', label: 'My pets', icon: PawPrint },
            { key: 'history', label: 'History', icon: History },
            { key: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
            { key: 'settings', label: 'Settings', icon: Settings },
          ].map(({ key, label, icon: Icon, badge }) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)}
              className={`dashboard-tab ${activeTab === key ? 'dashboard-tab-active' : ''}`}>
              <Icon size={17} />
              {label}
              {badge > 0 && <span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black">{badge}</span>}
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          {/* Booking wizard */}
          {activeTab === 'booking' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Book a grooming appointment</div>

              {bookingSubmitted && (
                <div className="mb-6 rounded-[1.75rem] border border-green-400/20 bg-green-400/5 px-5 py-4 text-sm text-green-300">
                  Your appointment has been submitted! We will confirm it soon.
                  <button type="button" className="ml-3 underline" onClick={() => setBookingSubmitted(false)}>Book another</button>
                </div>
              )}

              {bookingError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{bookingError}</div>
              )}

              {/* Step indicator */}
              <div className="mb-8 flex gap-2">
                {wizardSteps.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${i === step ? 'bg-gradient-to-br from-[var(--sage)] to-[var(--warm)] text-[var(--ink)]' : i < step ? 'bg-white/20 text-white' : 'bg-white/8 text-white/30'}`}>{i + 1}</div>
                    <span className={`hidden text-xs sm:block ${i === step ? 'text-white' : 'text-white/35'}`}>{label}</span>
                    {i < wizardSteps.length - 1 && <div className="h-px w-6 bg-white/15" />}
                  </div>
                ))}
              </div>

              <form onSubmit={submitBooking}>
                {step === 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {services.map((svc) => (
                      <button key={svc.id} type="button"
                        onClick={() => setBooking((b) => ({ ...b, service_id: svc.id }))}
                        className={`rounded-[1.75rem] border p-5 text-left transition-colors ${String(booking.service_id) === String(svc.id) ? 'border-[var(--sage)] bg-[var(--sage)]/10' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}>
                        <div className="font-semibold text-white">{svc.name}</div>
                        <div className="mt-1 text-sm text-white/55">{svc.duration} min · {formatUGX(svc.price)}</div>
                        {svc.description && <div className="mt-2 text-xs text-white/40">{svc.description}</div>}
                      </button>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4">
                    {pets.map((pet) => (
                      <button key={pet.id} type="button"
                        onClick={() => setBooking((b) => ({ ...b, pet_id: pet.id }))}
                        className={`rounded-[1.75rem] border p-5 text-left transition-colors ${String(booking.pet_id) === String(pet.id) ? 'border-[var(--sage)] bg-[var(--sage)]/10' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}>
                        <div className="font-semibold text-white">{pet.name}</div>
                        <div className="text-sm text-white/55">{pet.breed}{pet.age && ` · ${pet.age}`}</div>
                      </button>
                    ))}
                    {pets.length === 0 && <p className="text-sm text-white/40">No pets yet. Add one in the "My pets" tab first.</p>}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>Date</span>
                      <input type="date" value={booking.date} onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} required />
                    </label>
                    <label className="field">
                      <span>Time (09:00 – 18:00)</span>
                      <input type="time" value={booking.time} min="09:00" max="18:00" onChange={(e) => setBooking((b) => ({ ...b, time: e.target.value }))} required />
                    </label>
                    <label className="field md:col-span-2">
                      <span>Notes (optional)</span>
                      <textarea value={booking.notes} onChange={(e) => setBooking((b) => ({ ...b, notes: e.target.value }))} placeholder="Allergies, special instructions…" />
                    </label>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-4">
                    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                      <div className="mb-3 text-sm uppercase tracking-wider text-white/40">Review your booking</div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between"><span className="text-white/55">Service</span><span className="text-white">{selectedService?.name}</span></div>
                        <div className="flex justify-between"><span className="text-white/55">Pet</span><span className="text-white">{selectedPet?.name}</span></div>
                        <div className="flex justify-between"><span className="text-white/55">Date</span><span className="text-white">{booking.date}</span></div>
                        <div className="flex justify-between"><span className="text-white/55">Time</span><span className="text-white">{booking.time}</span></div>
                        <div className="flex justify-between"><span className="text-white/55">Price</span><span className="text-white">{selectedService ? formatUGX(selectedService.price) : '—'}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="button-secondary">Back</button>}
                  {step < 3
                    ? <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canContinue} className="button-primary disabled:opacity-50">Continue</button>
                    : <button type="submit" className="button-primary">Confirm booking</button>
                  }
                </div>
              </form>
            </div>
          )}

          {/* Pets */}
          {activeTab === 'pets' && (
            <div className="dashboard-panel">
              <div className="panel-heading">My pets</div>
              <form onSubmit={submitPet} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[['name','Name'],['breed','Breed'],['age','Age'],['weight','Weight']].map(([key,label]) => (
                  <label key={key} className="field">
                    <span>{label}</span>
                    <input value={petForm[key] ?? ''} onChange={(e) => setPetForm({ ...petForm, [key]: e.target.value })} required={key === 'name'} />
                  </label>
                ))}
                <label className="field xl:col-span-3">
                  <span>Notes</span>
                  <textarea value={petForm.notes ?? ''} onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })} />
                </label>
                <div className="xl:col-span-3 flex gap-3">
                  <button type="submit" className="button-primary">{editingPetId ? 'Update pet' : 'Add pet'}</button>
                  {editingPetId && <button type="button" onClick={() => { setPetForm(blankPet); setEditingPetId(null) }} className="button-secondary">Cancel</button>}
                </div>
              </form>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {pets.map((pet) => (
                  <article key={pet.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--sage)] to-[var(--warm)] text-xl">🐾</div>
                      <div>
                        <div className="font-semibold text-white">{pet.name}</div>
                        <div className="text-sm text-white/45">{pet.breed}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/55">
                      {pet.age && <span>Age: {pet.age}</span>}
                      {pet.weight && <span>Weight: {pet.weight}</span>}
                    </div>
                    {pet.notes && <p className="mt-2 text-xs text-white/40">{pet.notes}</p>}
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => { setEditingPetId(pet.id); setPetForm(pet) }} className="table-action">Edit</button>
                      <button type="button" onClick={() => handleDeletePet(pet.id)} className="table-action table-action-danger">Remove</button>
                    </div>
                  </article>
                ))}
                {pets.length === 0 && <p className="text-sm text-white/40">No pets yet. Add one above.</p>}
              </div>
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Appointment history</div>
              <div className="grid gap-4">
                {appointments.length === 0 && <p className="text-sm text-white/40">No appointments yet.</p>}
                {appointments.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-white">{item.pet_name}</div>
                        <div className="text-sm text-white/55">{item.date} at {item.time}</div>
                        {item.notes && <div className="mt-1 text-xs text-white/35">{item.notes}</div>}
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    {/* Feedback form for completed, no feedback yet */}
                    {item.status === 'completed' && !item.feedback && !feedbackSent[item.id] && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Rate this visit</div>
                        <StarRating
                          value={feedbackState[item.id]?.rating ?? 5}
                          onChange={(r) => setFeedbackState((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] ?? {}), rating: r } }))}
                        />
                        <textarea
                          placeholder="Leave a comment (optional)"
                          value={feedbackState[item.id]?.comments ?? ''}
                          onChange={(e) => setFeedbackState((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] ?? {}), comments: e.target.value } }))}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
                          rows={2}
                        />
                        <button type="button" onClick={() => handleFeedbackSubmit(item.id)} className="mt-2 table-action">
                          Submit feedback
                        </button>
                      </div>
                    )}
                    {(item.feedback || feedbackSent[item.id]) && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                        <span>Feedback submitted</span>
                        {item.feedback && <span>· {item.feedback.rating}/5 ★</span>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Notifications</div>
              <div className="grid gap-4">
                {notifications.length === 0 && <p className="text-sm text-white/40">No notifications.</p>}
                {notifications.map((n) => (
                  <article key={n.id} className={`rounded-[1.75rem] border p-5 ${n.is_read ? 'border-white/10 bg-white/3' : 'border-amber-400/20 bg-amber-400/5'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">{n.title}</div>
                        <p className="mt-1 text-sm text-white/60">{n.message}</p>
                        <p className="mt-2 text-xs text-white/30">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      {!n.is_read && (
                        <button type="button" onClick={() => markNotifRead(n.id)} className="table-action shrink-0">Mark read</button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="dashboard-panel">
              <div className="panel-heading">My settings</div>
              <form onSubmit={saveSettings} className="grid gap-4 md:grid-cols-2">
                {[['first_name','First name'],['last_name','Last name'],['phone','Phone'],['location','Location']].map(([key,label]) => (
                  <label key={key} className={`field ${key === 'location' ? 'md:col-span-2' : ''}`}>
                    <span>{label}</span>
                    <input value={settings[key] ?? ''} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                  </label>
                ))}
                <button type="submit" className="button-primary md:w-fit">Save settings</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default CustomerDashboard
