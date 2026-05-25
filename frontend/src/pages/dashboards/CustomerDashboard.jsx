import { Bell, CalendarClock, History, PawPrint, Settings, Star } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import api from '../../utils/api.js'
import { formatUGX } from '../../utils/currency.js'

const wizardSteps = ['Service', 'Pet profile', 'Schedule', 'Confirm']
const blankPet = { name: '', breed: '', age: '', weight: '', notes: '' }

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          style={{ color: i <= value ? 'var(--warm)' : 'var(--muted-soft)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          aria-label={`Rate ${i} star${i === 1 ? '' : 's'}`}
        >
          <Star size={20} fill={i <= value ? 'var(--warm)' : 'transparent'} />
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

function BookingSpotlight({ step, selectedService, selectedPet, booking }) {
  if (step === 0) {
    return (
      <div className="wizard-spotlight">
        <div className="wizard-spotlight-title">Step 1</div>
        <div className="wizard-spotlight-value">Choose the service your pet needs</div>
        <p className="wizard-spotlight-copy">
          Start with the grooming package that fits this visit. Once that is set, the rest of the flow feels much quicker.
        </p>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="wizard-spotlight">
        <div className="wizard-spotlight-title">Selected service</div>
        <div className="wizard-spotlight-value">{selectedService?.name || 'Choose a service first'}</div>
        <p className="wizard-spotlight-copy">
          {selectedService
            ? `${selectedService.duration} minutes / ${formatUGX(selectedService.price)}`
            : 'Your chosen package will appear here once you select it.'}
        </p>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="wizard-spotlight">
        <div className="wizard-spotlight-title">Pet profile ready</div>
        <div className="wizard-spotlight-value">{selectedPet?.name || 'Select or add a pet'}</div>
        <p className="wizard-spotlight-copy">
          Pick the day and time that work for you, then you will get one final review screen before the request is sent.
        </p>
      </div>
    )
  }

  return (
    <div className="wizard-spotlight">
      <div className="wizard-spotlight-title">Final review</div>
      <div className="wizard-spotlight-value">{selectedService?.name || 'Appointment summary'}</div>
      <p className="wizard-spotlight-copy">
        {booking.date && booking.time
          ? `${booking.date} at ${booking.time}`
          : 'Check the details below, then confirm when everything looks right.'}
      </p>
    </div>
  )
}

function CustomerDashboard() {
  const location = useLocation()
  const { currentUser, addPet, updatePet, deletePet, addAppointment, updateProfile, submitFeedback } = useApp()

  const [activeTab, setActiveTab] = useState('booking')
  const [step, setStep] = useState(0)
  const [petForm, setPetForm] = useState(blankPet)
  const [bookingPetForm, setBookingPetForm] = useState(blankPet)
  const [editingPetId, setEditingPetId] = useState(null)
  const [settings, setSettings] = useState({
    first_name: currentUser?.first_name ?? '',
    last_name: currentUser?.last_name ?? '',
    phone: currentUser?.phone ?? '',
    location: currentUser?.location ?? '',
  })
  const [feedbackState, setFeedbackState] = useState({})
  const [feedbackSent, setFeedbackSent] = useState({})

  const [pets, setPets] = useState([])
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [notifications, setNotifications] = useState([])

  const [booking, setBooking] = useState({ service_id: '', pet_id: '', date: '', time: '', notes: '' })
  const [bookingSubmitted, setBookingSubmitted] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')

  const searchParams = new URLSearchParams(location.search)
  const requestedTab = searchParams.get('tab')
  const requestedService = searchParams.get('service')

  const fetchAll = useCallback(async () => {
    const [petRes, apptRes, svcRes, notifRes] = await Promise.allSettled([
      api.get('/pets/'),
      api.get('/appointments/'),
      api.get('/services/'),
      api.get('/notifications/'),
    ])

    if (petRes.status === 'fulfilled') {
      const petList = petRes.value?.results ?? petRes.value ?? []
      setPets(petList)
      if (!booking.pet_id && petList.length > 0) {
        setBooking((prev) => ({ ...prev, pet_id: prev.pet_id || petList[0].id }))
      }
    }

    if (apptRes.status === 'fulfilled') {
      setAppointments(apptRes.value?.results ?? apptRes.value ?? [])
    }

    if (svcRes.status === 'fulfilled') {
      const serviceList = svcRes.value?.results ?? svcRes.value ?? []
      setServices(serviceList)
      if (!booking.service_id && serviceList.length > 0) {
        setBooking((prev) => ({ ...prev, service_id: prev.service_id || serviceList[0].id }))
      }
    }

    if (notifRes.status === 'fulfilled') {
      setNotifications(notifRes.value?.results ?? notifRes.value ?? [])
    }
  }, [booking.pet_id, booking.service_id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (requestedTab === 'booking') {
      setActiveTab('booking')
      setStep(0)
    }
  }, [requestedTab])

  useEffect(() => {
    if (!requestedService || services.length === 0) return

    const matched = services.find((service) => service.name.toLowerCase() === requestedService.toLowerCase())
    if (!matched) return

    setActiveTab('booking')
    setStep(0)
    setBooking((prev) => ({ ...prev, service_id: matched.id }))
  }, [requestedService, services])

  const selectedService = services.find((service) => String(service.id) === String(booking.service_id))
  const selectedPet = pets.find((pet) => String(pet.id) === String(booking.pet_id))
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const canContinue =
    (step === 0 && !!booking.service_id) ||
    (step === 1 && !!booking.pet_id) ||
    (step === 2 && booking.date && booking.time)

  async function submitBooking(event) {
    event.preventDefault()
    setBookingError('')

    const customerName = `${currentUser?.first_name ?? ''} ${currentUser?.last_name ?? ''}`.trim() || currentUser?.username || 'Customer'
    const result = await addAppointment({
      pet: booking.pet_id || null,
      pet_name: selectedPet?.name ?? currentUser?.first_name ?? 'Guest pet',
      service: booking.service_id,
      date: booking.date,
      time: booking.time,
      notes: booking.notes,
      customer_name: customerName,
    })

    if (!result.ok) {
      setBookingError(result.message)
      return
    }

    setBookingSubmitted(true)
    setStep(0)
    setBooking({
      service_id: services[0]?.id ?? '',
      pet_id: pets[0]?.id ?? '',
      date: '',
      time: '',
      notes: '',
    })
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

  async function createBookingPet() {
    setBookingError('')

    const result = await addPet(bookingPetForm)
    if (!result.ok) {
      setBookingError(result.message || 'Unable to create pet profile.')
      return
    }

    const createdPet = result.data
    setPets((prev) => [...prev, createdPet])
    setBookingPetForm(blankPet)
    setBooking((prev) => ({ ...prev, pet_id: createdPet.id }))
    setStep(2)
  }

  async function handleDeletePet(id) {
    await deletePet(id)
    fetchAll()
  }

  async function handleFeedbackSubmit(appointmentId) {
    const feedback = feedbackState[appointmentId] ?? { rating: 5, comments: '' }
    const result = await submitFeedback(appointmentId, feedback.rating, feedback.comments)
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
    setSettingsMessage('')
    const result = await updateProfile(settings)
    setSettingsMessage(result.ok ? 'Profile updated successfully.' : (result.message || 'Unable to save profile.'))
  }

  function handleContinue() {
    if (step === 0 && booking.service_id) {
      setStep(1)
      return
    }

    if (step === 1) {
      if (pets.length === 0) {
        setBookingError('Add your pet details below to keep moving through the booking flow.')
        return
      }

      if (booking.pet_id) {
        setStep(2)
      }
      return
    }

    if (step === 2 && booking.date && booking.time) {
      setStep(3)
    }
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
            <button key={key} type="button" onClick={() => setActiveTab(key)} className={`dashboard-tab ${activeTab === key ? 'dashboard-tab-active' : ''}`}>
              <Icon size={17} />
              {label}
              {badge > 0 && <span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black">{badge}</span>}
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          {activeTab === 'booking' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Book a grooming appointment</div>

              {bookingSubmitted && (
                <div className="mb-6 rounded-[1.75rem] border border-green-400/20 bg-green-400/5 px-5 py-4 text-sm text-green-300">
                  Your appointment request has been sent. We will confirm it shortly.
                  <button type="button" className="ml-3 underline" onClick={() => setBookingSubmitted(false)}>Book another visit</button>
                </div>
              )}

              {bookingError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{bookingError}</div>
              )}

              <div className="mb-8 flex gap-2">
                {wizardSteps.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${i === step ? 'bg-gradient-to-br from-[var(--sage)] to-[var(--warm)] text-[var(--ink)]' : i < step ? 'bg-white/20 text-white' : 'bg-white/8 text-white/30'}`}>{i + 1}</div>
                    <span className={`hidden text-xs sm:block ${i === step ? 'text-white' : 'text-white/35'}`}>{label}</span>
                    {i < wizardSteps.length - 1 && <div className="h-px w-6 bg-white/15" />}
                  </div>
                ))}
              </div>

              <form onSubmit={submitBooking} className="wizard-shell">
                <BookingSpotlight
                  step={step}
                  selectedService={selectedService}
                  selectedPet={selectedPet}
                  booking={booking}
                />

                {step === 0 && (
                  <div className="wizard-step-panel">
                    <div className="mb-4">
                      <div className="wizard-spotlight-title">Available services</div>
                      <div className="mt-2 text-sm text-white/55">Choose the grooming package you want to book for this visit.</div>
                    </div>
                    <div className="wizard-card-grid sm:grid-cols-2">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setBooking((prev) => ({ ...prev, service_id: service.id }))}
                          className={`wizard-choice-card ${String(booking.service_id) === String(service.id) ? 'wizard-choice-card-active' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-semibold text-white">{service.name}</div>
                            <span className="wizard-tag">{service.duration} min</span>
                          </div>
                          <div className="wizard-choice-meta">{formatUGX(service.price)}</div>
                          {service.description && <div className="wizard-choice-copy">{service.description}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="wizard-step-panel">
                    {pets.length > 0 ? (
                      <div className="wizard-card-grid">
                        <div className="mb-1 text-sm text-white/55">Choose which pet this appointment is for.</div>
                        {pets.map((pet) => (
                          <button
                            key={pet.id}
                            type="button"
                            onClick={() => setBooking((prev) => ({ ...prev, pet_id: pet.id }))}
                            className={`wizard-choice-card ${String(booking.pet_id) === String(pet.id) ? 'wizard-choice-card-active' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-semibold text-white">{pet.name}</div>
                              {String(booking.pet_id) === String(pet.id) && <span className="wizard-tag">Selected</span>}
                            </div>
                            <div className="wizard-choice-meta">
                              {[pet.breed, pet.age, pet.weight].filter(Boolean).join(' / ')}
                            </div>
                            {pet.notes && <div className="wizard-choice-copy">{pet.notes}</div>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="surface-note p-5">
                        <div className="mb-2 text-lg font-semibold text-white">Add your pet to continue</div>
                        <p className="mb-4 text-sm text-white/50">
                          You are already in the booking flow, so there is no need to leave it. Add your pet here, save, and continue straight to scheduling.
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                          {[['name', 'Name'], ['breed', 'Breed'], ['age', 'Age'], ['weight', 'Weight']].map(([key, label]) => (
                            <label key={key} className="field">
                              <span>{label}</span>
                              <input
                                value={bookingPetForm[key] ?? ''}
                                onChange={(event) => setBookingPetForm({ ...bookingPetForm, [key]: event.target.value })}
                                required={key === 'name'}
                              />
                            </label>
                          ))}
                          <label className="field md:col-span-2">
                            <span>Notes</span>
                            <textarea
                              value={bookingPetForm.notes ?? ''}
                              onChange={(event) => setBookingPetForm({ ...bookingPetForm, notes: event.target.value })}
                              placeholder="Temperament, allergies, or grooming preferences"
                            />
                          </label>
                          <div className="md:col-span-2 flex gap-3">
                            <button type="button" onClick={createBookingPet} className="button-primary">Save pet and continue</button>
                            <button type="button" onClick={() => setActiveTab('pets')} className="button-secondary">Open full pet manager</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="wizard-step-panel grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2 text-sm text-white/55">
                      Choose a date and time that work for you. You will review the full appointment before it is submitted.
                    </div>
                    <label className="field">
                      <span>Date</span>
                      <input type="date" value={booking.date} onChange={(e) => setBooking((prev) => ({ ...prev, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} required />
                    </label>
                    <label className="field">
                      <span>Time (09:00 - 18:00)</span>
                      <input type="time" value={booking.time} min="09:00" max="18:00" onChange={(e) => setBooking((prev) => ({ ...prev, time: e.target.value }))} required />
                    </label>
                    <label className="field md:col-span-2">
                      <span>Notes (optional)</span>
                      <textarea value={booking.notes} onChange={(e) => setBooking((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Allergies, pickup preferences, or anything the groomer should know" />
                    </label>
                  </div>
                )}

                {step === 3 && (
                  <div className="wizard-step-panel">
                    <div className="mb-3 text-sm uppercase tracking-wider text-white/40">Review your booking</div>
                    <div className="wizard-review-grid text-sm">
                      <div className="wizard-review-row"><span className="text-white/55">Service</span><span className="text-right text-white">{selectedService?.name}</span></div>
                      <div className="wizard-review-row"><span className="text-white/55">Pet</span><span className="text-right text-white">{selectedPet?.name}</span></div>
                      <div className="wizard-review-row"><span className="text-white/55">Date</span><span className="text-right text-white">{booking.date}</span></div>
                      <div className="wizard-review-row"><span className="text-white/55">Time</span><span className="text-right text-white">{booking.time}</span></div>
                      <div className="wizard-review-row"><span className="text-white/55">Price</span><span className="text-right text-white">{selectedService ? formatUGX(selectedService.price) : '-'}</span></div>
                      {booking.notes && <div className="wizard-review-row"><span className="text-white/55">Notes</span><span className="max-w-[24rem] text-right text-white">{booking.notes}</span></div>}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="button-secondary">Back</button>}
                  {step < 3
                    ? <button type="button" onClick={handleContinue} disabled={!canContinue && !(step === 1 && pets.length === 0)} className="button-primary disabled:opacity-50">{step === 2 ? 'Review booking' : 'Continue'}</button>
                    : <button type="submit" className="button-primary">Confirm booking</button>}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'pets' && (
            <div className="dashboard-panel">
              <div className="panel-heading">My pets</div>
              <form onSubmit={submitPet} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[['name', 'Name'], ['breed', 'Breed'], ['age', 'Age'], ['weight', 'Weight']].map(([key, label]) => (
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
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--sage)] to-[var(--warm)] text-[var(--ink)]">
                        <PawPrint size={18} />
                      </div>
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

                    {item.status === 'completed' && !item.feedback && !feedbackSent[item.id] && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Rate this visit</div>
                        <StarRating
                          value={feedbackState[item.id]?.rating ?? 5}
                          onChange={(rating) => setFeedbackState((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] ?? {}), rating } }))}
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
                        {item.feedback && <span>- {item.feedback.rating}/5 stars</span>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

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

          {activeTab === 'settings' && (
            <div className="dashboard-panel">
              <div className="panel-heading">My settings</div>
              <form onSubmit={saveSettings} className="grid gap-4 md:grid-cols-2">
                {[['first_name', 'First name'], ['last_name', 'Last name'], ['phone', 'Phone'], ['location', 'Location']].map(([key, label]) => (
                  <label key={key} className={`field ${key === 'location' ? 'md:col-span-2' : ''}`}>
                    <span>{label}</span>
                    <input value={settings[key] ?? ''} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                  </label>
                ))}
                <button type="submit" className="button-primary md:w-fit">Save settings</button>
                {settingsMessage && <p className="md:col-span-2 text-sm text-white/65">{settingsMessage}</p>}
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default CustomerDashboard
