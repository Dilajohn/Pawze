import { useState, useEffect, useCallback } from 'react'
import { CalendarRange, Package, Settings, Users, Bell, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import api from '../../utils/api.js'

const adminTabs = [
  { key: 'appointments', label: 'Appointments', icon: CalendarRange },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const PAGE_SIZE = 10

const blankAppointment = {
  customer_name: '', pet_name: '', date: '', time: '',
  status: 'pending', notes: '',
}
const blankInventory = {
  name: '', category: 'Consumable', quantity: 0,
  unit: 'bottles', threshold: 5, supplier_name: '',
}
const blankStaff = {
  username: '', email: '', first_name: '', last_name: '',
  phone: '', location: '', role: 'groomer', password: '',
}

function makeInitialPassword(role) {
  return `${role === 'admin' ? 'Admin' : 'Groom'}${Math.floor(1000 + Math.random() * 9000)}!`
}

function usePagination(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const total = Math.ceil(items.length / pageSize)
  const slice = items.slice((page - 1) * pageSize, page * pageSize)
  return { slice, page, total, setPage }
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

function Pagination({ page, total, setPage }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="table-action disabled:opacity-30">
        <ChevronLeft size={14} />
      </button>
      <span className="text-sm text-white/50">{page} / {total}</span>
      <button onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page === total} className="table-action disabled:opacity-30">
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function AdminDashboard() {
  const { currentUser, createStaffAccount, resetUserPassword, addAppointment, updateAppointment, deleteAppointment, addInventoryItem, updateInventoryItem, deleteInventoryItem, updateProfile } = useApp()

  const [activeTab, setActiveTab] = useState('appointments')
  const [appointmentForm, setAppointmentForm] = useState(blankAppointment)
  const [inventoryForm, setInventoryForm] = useState(blankInventory)
  const [staffForm, setStaffForm] = useState(blankStaff)
  const [editingAppointmentId, setEditingAppointmentId] = useState(null)
  const [editingInventoryId, setEditingInventoryId] = useState(null)
  const [staffMessage, setStaffMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')
  const [settings, setSettings] = useState({
    first_name: currentUser?.first_name ?? '',
    last_name: currentUser?.last_name ?? '',
    phone: currentUser?.phone ?? '',
    location: currentUser?.location ?? '',
  })

  // Remote data
  const [appointments, setAppointments] = useState([])
  const [inventory, setInventory] = useState([])
  const [users, setUsers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [services, setServices] = useState([])
  const [groomers, setGroomers] = useState([])

  // Search + filter
  const [apptSearch, setApptSearch] = useState('')
  const [apptStatusFilter, setApptStatusFilter] = useState('all')
  const [invSearch, setInvSearch] = useState('')

  const fetchAll = useCallback(async () => {
    const [appts, inv, usrs, notifs, svcs] = await Promise.allSettled([
      api.get('/appointments/'),
      api.get('/inventory/'),
      api.get('/users/'),
      api.get('/notifications/'),
      api.get('/services/'),
    ])
    if (appts.status === 'fulfilled') setAppointments(appts.value?.results ?? appts.value ?? [])
    if (inv.status === 'fulfilled') setInventory(inv.value?.results ?? inv.value ?? [])
    if (usrs.status === 'fulfilled') {
      const all = usrs.value?.results ?? usrs.value ?? []
      setUsers(all)
      setGroomers(all.filter((u) => u.role === 'groomer'))
    }
    if (notifs.status === 'fulfilled') setNotifications(notifs.value?.results ?? notifs.value ?? [])
    if (svcs.status === 'fulfilled') setServices(svcs.value?.results ?? svcs.value ?? [])
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const lowStockItems = inventory.filter((item) => item.is_low_stock)

  // Filtered + paginated appointments
  const filteredAppts = appointments.filter((a) => {
    const matchSearch = !apptSearch || [a.customer_name, a.pet_name, a.status].join(' ').toLowerCase().includes(apptSearch.toLowerCase())
    const matchStatus = apptStatusFilter === 'all' || a.status === apptStatusFilter
    return matchSearch && matchStatus
  })
  const apptPag = usePagination(filteredAppts)

  // Filtered inventory
  const filteredInv = inventory.filter((item) =>
    !invSearch || item.name.toLowerCase().includes(invSearch.toLowerCase())
  )
  const invPag = usePagination(filteredInv)

  async function submitAppointment(event) {
    event.preventDefault()
    setFormError('')
    const payload = {
      ...appointmentForm,
      service: appointmentForm.service_id || (services[0]?.id),
      groomer: appointmentForm.groomer_id || (groomers[0]?.id) || null,
    }
    const result = editingAppointmentId
      ? await updateAppointment(editingAppointmentId, payload)
      : await addAppointment(payload)
    if (!result.ok) { setFormError(result.message); return }
    setAppointmentForm(blankAppointment)
    setEditingAppointmentId(null)
    fetchAll()
  }

  async function submitInventory(event) {
    event.preventDefault()
    setFormError('')
    const payload = { ...inventoryForm, quantity: Number(inventoryForm.quantity), threshold: Number(inventoryForm.threshold) }
    const result = editingInventoryId
      ? await updateInventoryItem(editingInventoryId, payload)
      : await addInventoryItem(payload)
    if (!result.ok) { setFormError(result.message); return }
    setInventoryForm(blankInventory)
    setEditingInventoryId(null)
    fetchAll()
  }

  async function submitStaffAccount(event) {
    event.preventDefault()
    setStaffMessage('')
    const password = staffForm.password || makeInitialPassword(staffForm.role)
    const result = await createStaffAccount({ ...staffForm, password, must_change_password: true })
    if (!result.ok) { setStaffMessage(result.message); return }
    setStaffMessage(`Account created for ${result.user?.username ?? staffForm.username}. Initial password: ${password}`)
    setStaffForm(blankStaff)
    fetchAll()
  }

  async function handlePasswordReset(user) {
    const nextPassword = makeInitialPassword(user.role)
    const result = await resetUserPassword(user.id, nextPassword)
    setStaffMessage(result.ok ? `Password reset for ${user.username}: ${nextPassword}` : result.message)
  }

  async function handleDeleteAppointment(id) {
    const result = await deleteAppointment(id)
    if (result.ok) fetchAll()
  }

  async function handleDeleteInventory(id) {
    const result = await deleteInventoryItem(id)
    if (result.ok) fetchAll()
  }

  async function markNotificationRead(id) {
    await api.patch(`/notifications/${id}/mark_read/`)
    fetchAll()
  }

  async function saveSettings(event) {
    event.preventDefault()
    setSettingsMessage('')
    const result = await updateProfile(settings)
    setSettingsMessage(result.ok ? 'Profile updated successfully.' : (result.message || 'Unable to save profile.'))
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-top">
        <div>
          <div className="section-kicker">Admin dashboard</div>
          <h1 className="font-display text-4xl text-white">Command the salon in one place.</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <div className="metric-label">Appointments</div>
            <div className="metric-value">{appointments.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Inventory alerts</div>
            <div className="metric-value">{lowStockItems.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Staff accounts</div>
            <div className="metric-value">{users.filter((u) => u.role !== 'customer').length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <aside className="dashboard-nav">
          {adminTabs.map((tab) => {
            const Icon = tab.icon
            const badge = tab.key === 'notifications' ? notifications.filter((n) => !n.is_read).length : 0
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                className={`dashboard-tab ${activeTab === tab.key ? 'dashboard-tab-active' : ''}`}>
                <Icon size={17} />
                {tab.label}
                {badge > 0 && <span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black">{badge}</span>}
              </button>
            )
          })}
        </aside>

        <div className="space-y-6">
          {/* Appointments */}
          {activeTab === 'appointments' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Appointment management</div>
              {formError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>}
              <form onSubmit={submitAppointment} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[['customer_name', 'Customer name', 'text'], ['pet_name', 'Pet name', 'text'], ['date', 'Date', 'date'], ['time', 'Time', 'time']].map(([key, label, type]) => (
                  <label key={key} className="field">
                    <span>{label}</span>
                    <input type={type} value={appointmentForm[key] ?? ''} onChange={(e) => setAppointmentForm({ ...appointmentForm, [key]: e.target.value })} required />
                  </label>
                ))}
                <label className="field">
                  <span>Service</span>
                  <select value={appointmentForm.service_id ?? ''} onChange={(e) => setAppointmentForm({ ...appointmentForm, service_id: e.target.value })}>
                    {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Groomer</span>
                  <select value={appointmentForm.groomer_id ?? ''} onChange={(e) => setAppointmentForm({ ...appointmentForm, groomer_id: e.target.value })}>
                    <option value="">Assign later</option>
                    {groomers.map((g) => <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Status</span>
                  <select value={appointmentForm.status} onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}>
                    {['pending','confirmed','in-progress','completed','cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="field xl:col-span-4">
                  <span>Notes</span>
                  <textarea value={appointmentForm.notes ?? ''} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} />
                </label>
                <div className="xl:col-span-4 flex gap-3">
                  <button type="submit" className="button-primary">{editingAppointmentId ? 'Update appointment' : 'Create appointment'}</button>
                  {editingAppointmentId && (
                    <button type="button" onClick={() => { setEditingAppointmentId(null); setAppointmentForm(blankAppointment) }} className="button-secondary">Cancel edit</button>
                  )}
                </div>
              </form>

              {/* Search + filter */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input placeholder="Search customer, pet…" value={apptSearch} onChange={(e) => { setApptSearch(e.target.value); apptPag.setPage(1) }} className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25" />
                </div>
                <select value={apptStatusFilter} onChange={(e) => { setApptStatusFilter(e.target.value); apptPag.setPage(1) }} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
                  <option value="all">All statuses</option>
                  {['pending','confirmed','in-progress','completed','cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="dashboard-table">
                  <thead><tr><th>Customer</th><th>Pet</th><th>Date / Time</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {apptPag.slice.map((item) => (
                      <tr key={item.id}>
                        <td>{item.customer_name}</td>
                        <td>{item.pet_name}</td>
                        <td>{item.date} {item.time}</td>
                        <td><StatusBadge status={item.status} /></td>
                        <td className="flex gap-2">
                          <button type="button" onClick={() => { setEditingAppointmentId(item.id); setAppointmentForm(item) }} className="table-action">Edit</button>
                          <button type="button" onClick={() => handleDeleteAppointment(item.id)} className="table-action table-action-danger">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {apptPag.slice.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-white/40">No appointments match your search.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination {...apptPag} />
            </div>
          )}

          {/* Inventory */}
          {activeTab === 'inventory' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Inventory management</div>
              {formError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{formError}</div>}
              <form onSubmit={submitInventory} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[['name','Item name','text'],['quantity','Quantity','number'],['unit','Unit','text'],['threshold','Low-stock threshold','number'],['supplier_name','Supplier','text']].map(([key,label,type]) => (
                  <label key={key} className="field">
                    <span>{label}</span>
                    <input type={type} value={inventoryForm[key] ?? ''} onChange={(e) => setInventoryForm({ ...inventoryForm, [key]: e.target.value })} required />
                  </label>
                ))}
                <label className="field">
                  <span>Category</span>
                  <select value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })}>
                    {['Consumable','Tools','Accessories'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <div className="md:col-span-2 xl:col-span-3 flex gap-3">
                  <button type="submit" className="button-primary">{editingInventoryId ? 'Update item' : 'Add item'}</button>
                  {editingInventoryId && <button type="button" onClick={() => { setEditingInventoryId(null); setInventoryForm(blankInventory) }} className="button-secondary">Cancel</button>}
                </div>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input placeholder="Search items…" value={invSearch} onChange={(e) => { setInvSearch(e.target.value); invPag.setPage(1) }} className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25" />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {invPag.slice.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                        <p className="mt-1 text-sm text-white/45">{item.category} — {item.supplier_name}</p>
                      </div>
                      {item.is_low_stock && <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">Low stock</span>}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-white/65">
                      <span>{item.quantity} {item.unit}</span>
                      <span>Threshold: {item.threshold}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => { setEditingInventoryId(item.id); setInventoryForm(item) }} className="table-action">Edit</button>
                      <button type="button" onClick={() => handleDeleteInventory(item.id)} className="table-action table-action-danger">Delete</button>
                    </div>
                  </article>
                ))}
              </div>
              <Pagination {...invPag} />
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Staff access management</div>
              <div className="mb-8 grid gap-4 xl:grid-cols-2">
                <form onSubmit={submitStaffAccount} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-lg font-semibold text-white">Create staff account</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[['username','Username','text'],['email','Email','email'],['first_name','First name','text'],['last_name','Last name','text'],['phone','Phone','tel'],['location','Location','text']].map(([key,label,type]) => (
                      <label key={key} className="field">
                        <span>{label}</span>
                        <input type={type} value={staffForm[key] ?? ''} onChange={(e) => setStaffForm({ ...staffForm, [key]: e.target.value })} required={['username','email'].includes(key)} />
                      </label>
                    ))}
                    <label className="field">
                      <span>Role</span>
                      <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                        <option value="groomer">Groomer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Initial password</span>
                      <input type="text" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} placeholder="Auto-generated if blank" />
                    </label>
                  </div>
                  <div className="mt-4">
                    <button type="submit" className="button-primary">Create staff user</button>
                  </div>
                  {staffMessage && <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">{staffMessage}</div>}
                </form>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-lg font-semibold text-white">Access policy</div>
                  <div className="space-y-3 text-sm leading-7 text-white/60">
                    <div>Customers register via the public registration page and book from the booking flow.</div>
                    <div>Groomers and admins only access protected dashboards after the admin creates their account.</div>
                    <div>Resetting a password marks must_change_password = true, forcing the staff member to update it on next login.</div>
                  </div>
                </div>
              </div>

              <div className="mb-4 text-sm uppercase tracking-[0.18em] text-white/40">Staff directory</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {users.filter((u) => u.role !== 'customer').map((user) => (
                  <article key={user.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--sage)] to-[var(--warm)] text-lg font-bold text-[var(--ink)]">
                        {(user.first_name?.[0] ?? user.username?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{user.first_name} {user.last_name}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-white/40">{user.role}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm leading-7 text-white/60">
                      <div>{user.email}</div>
                      {user.phone && <div>{user.phone}</div>}
                      {user.location && <div>{user.location}</div>}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/35">
                        {user.must_change_password ? 'Initial password active' : 'Active account'}
                      </div>
                      {user.id !== currentUser?.id && (
                        <button type="button" onClick={() => handlePasswordReset(user)} className="table-action">Reset password</button>
                      )}
                    </div>
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
                        <button type="button" onClick={() => markNotificationRead(n.id)} className="table-action shrink-0">Mark read</button>
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
              <div className="panel-heading">Admin settings</div>
              <form onSubmit={saveSettings} className="grid gap-4 md:grid-cols-2">
                {[['first_name','First name'],['last_name','Last name'],['phone','Phone'],['location','Location']].map(([key,label]) => (
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

export default AdminDashboard
