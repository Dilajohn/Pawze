import { CalendarClock, History, PawPrint, Settings } from 'lucide-react'
import { useState } from 'react'
import { services } from '../../data/mockData.js'
import { useApp } from '../../context/AppContext.jsx'

const wizardSteps = ['Service', 'Pet', 'Schedule', 'Review']
const blankPet = {
  name: '',
  breed: '',
  age: '',
  weight: '',
  notes: '',
}

function CustomerDashboard() {
  const { currentUser, pets, appointments, addPet, updatePet, deletePet, addAppointment, updateProfile } = useApp()
  const myPets = pets.filter((pet) => pet.ownerId === currentUser.id)
  const myAppointments = appointments.filter((item) => item.customerId === currentUser.id || item.customerName === currentUser.name)

  const [activeTab, setActiveTab] = useState('booking')
  const [step, setStep] = useState(0)
  const [petForm, setPetForm] = useState(blankPet)
  const [editingPetId, setEditingPetId] = useState(null)
  const [settings, setSettings] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    location: currentUser.location,
  })
  const [booking, setBooking] = useState({
    service: services[0].name,
    petId: myPets[0]?.id || '',
    date: '',
    time: '',
    notes: '',
  })

  const selectedPet = myPets.find((pet) => pet.id === booking.petId)

  function submitPet(event) {
    event.preventDefault()

    if (editingPetId) {
      updatePet(editingPetId, petForm)
    } else {
      const createdPet = addPet(petForm)
      setBooking((prev) => ({ ...prev, petId: prev.petId || createdPet.id }))
    }

    setPetForm(blankPet)
    setEditingPetId(null)
  }

  function submitBooking(event) {
    event.preventDefault()

    if (!selectedPet) {
      return
    }

    addAppointment({
      customerId: currentUser.id,
      customerName: currentUser.name,
      petId: selectedPet.id,
      petName: selectedPet.name,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      groomerId: 'user-groomer',
      groomerName: 'Miko Reyes',
      status: 'pending',
      notes: booking.notes,
    })

    setBooking({
      service: services[0].name,
      petId: myPets[0]?.id || '',
      date: '',
      time: '',
      notes: '',
    })
    setStep(0)
    setActiveTab('history')
  }

  function saveSettings(event) {
    event.preventDefault()
    updateProfile(settings)
  }

  const canContinue =
    (step === 0 && Boolean(booking.service)) ||
    (step === 1 && Boolean(booking.petId)) ||
    (step === 2 && Boolean(booking.date && booking.time))

  return (
    <section className="dashboard-shell">
      <div className="dashboard-top">
        <div>
          <div className="section-kicker">Customer dashboard</div>
          <h1 className="font-display text-4xl text-white">Book visits, manage pets, and revisit every grooming moment.</h1>
        </div>
        <img src="/images/cutest-puppy.jpg" alt="Customer dashboard art" className="h-32 w-full rounded-4xl object-cover md:w-72" />
      </div>

      <div className="dashboard-grid">
        <aside className="dashboard-nav">
          <button type="button" onClick={() => setActiveTab('booking')} className={`dashboard-tab ${activeTab === 'booking' ? 'dashboard-tab-active' : ''}`}>
            <CalendarClock size={17} />
            Book appointment
          </button>
          <button type="button" onClick={() => setActiveTab('pets')} className={`dashboard-tab ${activeTab === 'pets' ? 'dashboard-tab-active' : ''}`}>
            <PawPrint size={17} />
            My pets
          </button>
          <button type="button" onClick={() => setActiveTab('history')} className={`dashboard-tab ${activeTab === 'history' ? 'dashboard-tab-active' : ''}`}>
            <History size={17} />
            History
          </button>
          <button type="button" onClick={() => setActiveTab('settings')} className={`dashboard-tab ${activeTab === 'settings' ? 'dashboard-tab-active' : ''}`}>
            <Settings size={17} />
            Settings
          </button>
        </aside>

        <div className="space-y-6">
          {activeTab === 'booking' && (
            <div className="dashboard-panel">
              <div className="panel-heading">4-step booking wizard</div>
              <div className="mb-8 grid gap-3 md:grid-cols-4">
                {wizardSteps.map((label, index) => (
                  <div key={label} className={`rounded-[1.25rem] border px-4 py-4 text-sm ${step === index ? 'border-(--color-peach) bg-(--color-peach)/10 text-white' : 'border-white/10 text-white/50'}`}>
                    <div className="text-xs uppercase tracking-[0.18em]">Step {index + 1}</div>
                    <div className="mt-1 font-semibold">{label}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={submitBooking} className="space-y-6">
                {step === 0 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setBooking({ ...booking, service: service.name })}
                        className={`rounded-[1.75rem] border p-5 text-left transition ${booking.service === service.name ? 'border-(--color-peach) bg-(--color-peach)/10' : 'border-white/10 bg-white/5'}`}
                      >
                        <div className="text-xl font-semibold text-white">{service.name}</div>
                        <div className="mt-2 text-sm text-white/55">{service.duration} - ${service.price}</div>
                        <p className="mt-3 text-sm leading-6 text-white/60">{service.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {myPets.length === 0 ? (
                      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-white/65">
                        Add a pet in the My Pets tab first, then return here to continue booking.
                      </div>
                    ) : (
                      myPets.map((pet) => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => setBooking({ ...booking, petId: pet.id })}
                          className={`rounded-[1.75rem] border p-5 text-left transition ${booking.petId === pet.id ? 'border-(--color-peach) bg-(--color-peach)/10' : 'border-white/10 bg-white/5'}`}
                        >
                          <div className="text-xl font-semibold text-white">{pet.name}</div>
                          <div className="mt-2 text-sm text-white/55">{pet.breed} - {pet.age}</div>
                          <p className="mt-3 text-sm leading-6 text-white/60">{pet.notes}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>Date</span>
                      <input type="date" value={booking.date} onChange={(event) => setBooking({ ...booking, date: event.target.value })} required />
                    </label>
                    <label className="field">
                      <span>Time</span>
                      <input type="time" value={booking.time} onChange={(event) => setBooking({ ...booking, time: event.target.value })} required />
                    </label>
                    <label className="field md:col-span-2">
                      <span>Special notes</span>
                      <textarea value={booking.notes} onChange={(event) => setBooking({ ...booking, notes: event.target.value })} />
                    </label>
                  </div>
                )}

                {step === 3 && (
                  <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
                    <div className="text-xl font-semibold text-white">Review your visit</div>
                    <div className="mt-4 grid gap-3 text-sm text-white/65">
                      <div>Service: {booking.service}</div>
                      <div>Pet: {selectedPet ? `${selectedPet.name} (${selectedPet.breed})` : 'Choose a pet'}</div>
                      <div>Date: {booking.date || 'Select a date'}</div>
                      <div>Time: {booking.time || 'Select a time'}</div>
                      <div>Notes: {booking.notes || 'No notes added'}</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="button-secondary disabled:opacity-50">
                    Back
                  </button>
                  {step < 3 ? (
                    <button type="button" disabled={!canContinue} onClick={() => setStep((value) => Math.min(3, value + 1))} className="button-primary disabled:opacity-50">
                      Continue
                    </button>
                  ) : (
                    <button type="submit" className="button-primary">
                      Confirm booking
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'pets' && (
            <div className="dashboard-panel">
              <div className="panel-heading">My pets</div>
              <form onSubmit={submitPet} className="grid gap-4 md:grid-cols-2">
                {[
                  ['name', 'Pet name'],
                  ['breed', 'Breed'],
                  ['age', 'Age'],
                  ['weight', 'Weight'],
                  ['notes', 'Notes'],
                ].map(([key, label]) => (
                  <label key={key} className={`field ${key === 'notes' ? 'md:col-span-2' : ''}`}>
                    <span>{label}</span>
                    {key === 'notes' ? (
                      <textarea value={petForm.notes} onChange={(event) => setPetForm({ ...petForm, notes: event.target.value })} />
                    ) : (
                      <input value={petForm[key]} onChange={(event) => setPetForm({ ...petForm, [key]: event.target.value })} required />
                    )}
                  </label>
                ))}
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="button-primary">
                    {editingPetId ? 'Update pet' : 'Add pet'}
                  </button>
                  {editingPetId && (
                    <button type="button" onClick={() => { setEditingPetId(null); setPetForm(blankPet) }} className="button-secondary">
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {myPets.map((pet) => (
                  <article key={pet.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="text-xl font-semibold text-white">{pet.name}</div>
                    <div className="mt-2 text-sm text-white/55">{pet.breed} - {pet.age} - {pet.weight}</div>
                    <p className="mt-3 text-sm leading-6 text-white/60">{pet.notes}</p>
                    <div className="mt-5 flex gap-2">
                      <button type="button" onClick={() => { setEditingPetId(pet.id); setPetForm(pet) }} className="table-action">
                        Edit
                      </button>
                      <button type="button" onClick={() => deletePet(pet.id)} className="table-action table-action-danger">
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Appointment history</div>
              <div className="grid gap-4">
                {myAppointments.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xl font-semibold text-white">{item.petName} - {item.service}</div>
                        <div className="mt-2 text-sm text-white/55">{item.date} at {item.time}</div>
                      </div>
                      <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/65">
                        {item.status}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Profile settings</div>
              <form onSubmit={saveSettings} className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>Name</span>
                  <input value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} />
                </label>
                <label className="field">
                  <span>Phone</span>
                  <input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} />
                </label>
                <label className="field md:col-span-2">
                  <span>Location</span>
                  <input value={settings.location} onChange={(event) => setSettings({ ...settings, location: event.target.value })} />
                </label>
                <button type="submit" className="button-primary md:w-fit">
                  Save settings
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default CustomerDashboard
