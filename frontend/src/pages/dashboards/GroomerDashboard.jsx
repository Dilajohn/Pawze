import { Scissors, Settings, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'

function GroomerDashboard() {
  const { currentUser, appointments, inventory, updateAppointment, adjustInventoryQuantity, updateProfile } = useApp()
  const [activeTab, setActiveTab] = useState('schedule')
  const [settings, setSettings] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    location: currentUser.location,
  })

  const mySchedule = appointments.filter((item) => item.groomerId === currentUser.id)

  function saveSettings(event) {
    event.preventDefault()
    updateProfile(settings)
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-top">
        <div>
          <div className="section-kicker">Groomer dashboard</div>
          <h1 className="font-display text-4xl text-white">Stay focused on every pet and every slot.</h1>
        </div>
        <img src="/images/image-7.jpg" alt="Groomer dashboard art" className="h-32 w-full rounded-4xl object-cover md:w-72" />
      </div>

      <div className="dashboard-grid">
        <aside className="dashboard-nav">
          <button type="button" onClick={() => setActiveTab('schedule')} className={`dashboard-tab ${activeTab === 'schedule' ? 'dashboard-tab-active' : ''}`}>
            <Scissors size={17} />
            My schedule
          </button>
          <button type="button" onClick={() => setActiveTab('inventory')} className={`dashboard-tab ${activeTab === 'inventory' ? 'dashboard-tab-active' : ''}`}>
            <Warehouse size={17} />
            Inventory
          </button>
          <button type="button" onClick={() => setActiveTab('settings')} className={`dashboard-tab ${activeTab === 'settings' ? 'dashboard-tab-active' : ''}`}>
            <Settings size={17} />
            Settings
          </button>
        </aside>

        <div className="space-y-6">
          {activeTab === 'schedule' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Assigned appointments</div>
              <div className="grid gap-4">
                {mySchedule.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xl font-semibold text-white">{item.petName} - {item.service}</div>
                        <div className="mt-2 text-sm leading-6 text-white/60">
                          {item.customerName} - {item.date} at {item.time}
                        </div>
                        <div className="mt-2 text-sm text-white/45">{item.notes}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateAppointment(item.id, { status })}
                            className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                              item.status === status
                                ? 'bg-(--color-peach) text-(--color-ink)'
                                : 'border border-white/10 text-white/65 hover:text-white'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Quick stock adjustments</div>
              <div className="grid gap-4 lg:grid-cols-2">
                {inventory.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        <p className="mt-1 text-sm text-white/45">{item.category}</p>
                      </div>
                      <span className="text-sm text-white/65">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button type="button" onClick={() => adjustInventoryQuantity(item.id, -1)} className="button-secondary">
                        Use one
                      </button>
                      <button type="button" onClick={() => adjustInventoryQuantity(item.id, 1)} className="button-primary">
                        Restock one
                      </button>
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

export default GroomerDashboard
