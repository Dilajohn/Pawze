import { Scissors, Settings, Warehouse, Bell, Search } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import api from '../../utils/api.js'

function StarRow({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ color: i <= rating ? 'var(--warm)' : 'rgba(255,255,255,0.2)', fontSize: '12px' }}>★</span>
      ))}
    </span>
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

function GroomerDashboard() {
  const { currentUser, updateProfile } = useApp()
  const [activeTab, setActiveTab] = useState('schedule')
  const [schedule, setSchedule] = useState([])
  const [inventory, setInventory] = useState([])
  const [notifications, setNotifications] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [settings, setSettings] = useState({
    first_name: currentUser?.first_name ?? '',
    last_name: currentUser?.last_name ?? '',
    phone: currentUser?.phone ?? '',
    location: currentUser?.location ?? '',
  })

  const fetchAll = useCallback(async () => {
    const [appts, inv, notifs] = await Promise.allSettled([
      api.get('/appointments/'),
      api.get('/inventory/'),
      api.get('/notifications/'),
    ])
    if (appts.status === 'fulfilled') setSchedule(appts.value?.results ?? appts.value ?? [])
    if (inv.status === 'fulfilled') setInventory(inv.value?.results ?? inv.value ?? [])
    if (notifs.status === 'fulfilled') setNotifications(notifs.value?.results ?? notifs.value ?? [])
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = schedule.filter((a) => {
    const matchSearch = !search || [a.pet_name, a.customer_name, a.status].join(' ').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  async function updateStatus(id, newStatus) {
    await api.patch(`/appointments/${id}/update_status/`, { status: newStatus })
    fetchAll()
  }

  async function markNotifRead(id) {
    await api.patch(`/notifications/${id}/mark_read/`)
    fetchAll()
  }

  async function saveSettings(event) {
    event.preventDefault()
    await updateProfile(settings)
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <section className="dashboard-shell">
      <div className="dashboard-top">
        <div>
          <div className="section-kicker">Groomer dashboard</div>
          <h1 className="font-display text-4xl text-white">Stay focused on every pet and every slot.</h1>
        </div>
        <img src="/images/image-7.jpg" alt="Groomer" className="h-32 w-full rounded-4xl object-cover md:w-72" />
      </div>

      <div className="dashboard-grid">
        <aside className="dashboard-nav">
          {[
            { key: 'schedule', label: 'My schedule', icon: Scissors },
            { key: 'inventory', label: 'Inventory', icon: Warehouse },
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
          {activeTab === 'schedule' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Assigned appointments</div>

              {/* Search + filter */}
              <div className="mb-5 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input placeholder="Search pet, customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                  <option value="all">All statuses</option>
                  {['pending','confirmed','in-progress','completed','cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid gap-4">
                {filtered.length === 0 && <p className="text-sm text-white/40">No appointments match your filters.</p>}
                {filtered.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xl font-semibold text-white">{item.pet_name}</div>
                        <div className="mt-1 text-sm text-white/60">{item.customer_name} · {item.date} at {item.time}</div>
                        {item.notes && <div className="mt-2 text-sm text-white/40">{item.notes}</div>}
                        {item.feedback && (
                          <div className="mt-2 flex items-center gap-2">
                            <StarRow rating={item.feedback.rating} />
                            <span className="text-xs text-white/40">{item.feedback.comments}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <StatusBadge status={item.status} />
                        {item.status !== 'completed' && item.status !== 'cancelled' && (
                          <select
                            value={item.status}
                            onChange={(e) => updateStatus(item.id, e.target.value)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
                          >
                            {['pending','confirmed','in-progress','completed','cancelled'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Inventory — read-only view</div>
              <div className="grid gap-4 lg:grid-cols-2">
                {inventory.length === 0 && <p className="text-sm text-white/40">No inventory items found.</p>}
                {inventory.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-sm text-white/40">{item.category}</div>
                      </div>
                      {item.is_low_stock && <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">Low stock</span>}
                    </div>
                    <div className="mt-3 text-sm text-white/60">{item.quantity} {item.unit} · threshold: {item.threshold}</div>
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
              <div className="panel-heading">Groomer settings</div>
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

export default GroomerDashboard
