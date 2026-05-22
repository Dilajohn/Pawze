import { useState } from 'react'
import { CalendarRange, Package, Settings, Users } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

const adminTabs = [
  { key: 'appointments', label: 'Appointments', icon: CalendarRange },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const blankAppointment = {
  customerName: '',
  customerId: '',
  petName: '',
  petId: '',
  service: 'Bath & Brush',
  date: '',
  time: '',
  groomerName: 'Miko Reyes',
  groomerId: 'user-groomer',
  status: 'pending',
  notes: '',
}

const blankInventory = {
  name: '',
  category: 'Consumable',
  quantity: 0,
  unit: 'bottles',
  threshold: 5,
  supplier: '',
}

const blankStaff = {
  name: '',
  email: '',
  phone: '',
  location: '',
  role: 'groomer',
  password: '',
}

function makeInitialPassword(role) {
  return `${role === 'admin' ? 'Admin' : 'Groom'}${Math.floor(1000 + Math.random() * 9000)}!`
}

function AdminDashboard() {
  const {
    appointments,
    inventory,
    users,
    lowStockItems,
    currentUser,
    createStaffAccount,
    resetUserPassword,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    updateProfile,
  } = useApp()

  const [activeTab, setActiveTab] = useState('appointments')
  const [appointmentForm, setAppointmentForm] = useState(blankAppointment)
  const [inventoryForm, setInventoryForm] = useState(blankInventory)
  const [staffForm, setStaffForm] = useState(blankStaff)
  const [editingAppointmentId, setEditingAppointmentId] = useState(null)
  const [editingInventoryId, setEditingInventoryId] = useState(null)
  const [staffMessage, setStaffMessage] = useState('')
  const [settings, setSettings] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    location: currentUser.location,
  })

  function submitAppointment(event) {
    event.preventDefault()

    if (editingAppointmentId) {
      updateAppointment(editingAppointmentId, appointmentForm)
    } else {
      addAppointment(appointmentForm)
    }

    setAppointmentForm(blankAppointment)
    setEditingAppointmentId(null)
  }

  function submitInventory(event) {
    event.preventDefault()

    const payload = {
      ...inventoryForm,
      quantity: Number(inventoryForm.quantity),
      threshold: Number(inventoryForm.threshold),
    }

    if (editingInventoryId) {
      updateInventoryItem(editingInventoryId, payload)
    } else {
      addInventoryItem(payload)
    }

    setInventoryForm(blankInventory)
    setEditingInventoryId(null)
  }

  function submitStaffAccount(event) {
    event.preventDefault()
    const result = createStaffAccount(staffForm)

    if (!result.ok) {
      setStaffMessage(result.message)
      return
    }

    setStaffMessage(`Created ${result.user.role} account for ${result.user.name}. Initial password assigned.`)
    setStaffForm(blankStaff)
  }

  function handlePasswordReset(user) {
    const nextPassword = makeInitialPassword(user.role)
    const result = resetUserPassword(user.id, nextPassword)
    setStaffMessage(result.ok ? `Password reset for ${user.name}: ${nextPassword}` : result.message)
  }

  function saveSettings(event) {
    event.preventDefault()
    updateProfile(settings)
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
            <div className="metric-value">{users.filter((user) => user.role !== 'customer').length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <aside className="dashboard-nav">
          {adminTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`dashboard-tab ${activeTab === tab.key ? 'dashboard-tab-active' : ''}`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            )
          })}
        </aside>

        <div className="space-y-6">
          {activeTab === 'appointments' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Appointment management</div>
              <form onSubmit={submitAppointment} className="grid gap-4 xl:grid-cols-4">
                {[
                  ['customerName', 'Customer'],
                  ['petName', 'Pet'],
                  ['service', 'Service'],
                  ['date', 'Date'],
                  ['time', 'Time'],
                  ['groomerName', 'Groomer'],
                  ['status', 'Status'],
                  ['notes', 'Notes'],
                ].map(([key, label]) => (
                  <label key={key} className={`field ${key === 'notes' ? 'xl:col-span-4' : ''}`}>
                    <span>{label}</span>
                    {key === 'status' ? (
                      <select value={appointmentForm.status} onChange={(event) => setAppointmentForm({ ...appointmentForm, status: event.target.value })}>
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="in-progress">in-progress</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    ) : key === 'notes' ? (
                      <textarea value={appointmentForm.notes} onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })} />
                    ) : (
                      <input
                        type={key === 'date' ? 'date' : key === 'time' ? 'time' : 'text'}
                        value={appointmentForm[key]}
                        onChange={(event) => setAppointmentForm({ ...appointmentForm, [key]: event.target.value })}
                        required={key !== 'notes'}
                      />
                    )}
                  </label>
                ))}
                <div className="xl:col-span-4 flex gap-3">
                  <button type="submit" className="button-primary">
                    {editingAppointmentId ? 'Update appointment' : 'Create appointment'}
                  </button>
                  {editingAppointmentId && (
                    <button type="button" onClick={() => { setEditingAppointmentId(null); setAppointmentForm(blankAppointment) }} className="button-secondary">
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-8 overflow-x-auto">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Pet</th>
                      <th>Service</th>
                      <th>Schedule</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((item) => (
                      <tr key={item.id}>
                        <td>{item.customerName}</td>
                        <td>{item.petName}</td>
                        <td>{item.service}</td>
                        <td>{item.date} - {item.time}</td>
                        <td className="capitalize">{item.status}</td>
                        <td className="flex gap-2">
                          <button type="button" onClick={() => { setEditingAppointmentId(item.id); setAppointmentForm(item) }} className="table-action">
                            Edit
                          </button>
                          <button type="button" onClick={() => deleteAppointment(item.id)} className="table-action table-action-danger">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Inventory management</div>
              <form onSubmit={submitInventory} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ['name', 'Item name'],
                  ['category', 'Category'],
                  ['quantity', 'Quantity'],
                  ['unit', 'Unit'],
                  ['threshold', 'Low-stock threshold'],
                  ['supplier', 'Supplier'],
                ].map(([key, label]) => (
                  <label key={key} className="field">
                    <span>{label}</span>
                    {key === 'category' ? (
                      <select value={inventoryForm.category} onChange={(event) => setInventoryForm({ ...inventoryForm, category: event.target.value })}>
                        <option>Consumable</option>
                        <option>Tools</option>
                        <option>Accessories</option>
                      </select>
                    ) : (
                      <input
                        type={key === 'quantity' || key === 'threshold' ? 'number' : 'text'}
                        value={inventoryForm[key]}
                        onChange={(event) => setInventoryForm({ ...inventoryForm, [key]: event.target.value })}
                        required
                      />
                    )}
                  </label>
                ))}
                <div className="md:col-span-2 xl:col-span-3 flex gap-3">
                  <button type="submit" className="button-primary">
                    {editingInventoryId ? 'Update item' : 'Add item'}
                  </button>
                  {editingInventoryId && (
                    <button type="button" onClick={() => { setEditingInventoryId(null); setInventoryForm(blankInventory) }} className="button-secondary">
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {inventory.map((item) => (
                  <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                        <p className="mt-1 text-sm text-white/45">{item.category} - {item.supplier}</p>
                      </div>
                      {item.quantity <= item.threshold && <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">Low stock</span>}
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm text-white/65">
                      <span>{item.quantity} {item.unit}</span>
                      <span>Threshold: {item.threshold}</span>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button type="button" onClick={() => { setEditingInventoryId(item.id); setInventoryForm(item) }} className="table-action">
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteInventoryItem(item.id)} className="table-action table-action-danger">
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Staff access management</div>
              <div className="mb-8 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <form onSubmit={submitStaffAccount} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-lg font-semibold text-white">Create staff account</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field md:col-span-2">
                      <span>Full name</span>
                      <input value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} required />
                    </label>
                    <label className="field">
                      <span>Email</span>
                      <input type="email" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} required />
                    </label>
                    <label className="field">
                      <span>Phone</span>
                      <input value={staffForm.phone} onChange={(event) => setStaffForm({ ...staffForm, phone: event.target.value })} required />
                    </label>
                    <label className="field">
                      <span>Location</span>
                      <input value={staffForm.location} onChange={(event) => setStaffForm({ ...staffForm, location: event.target.value })} required />
                    </label>
                    <label className="field">
                      <span>Role</span>
                      <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}>
                        <option value="groomer">Groomer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <label className="field md:col-span-2">
                      <span>Initial password</span>
                      <input type="text" value={staffForm.password} onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} placeholder="Example: Groom123!" required />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="submit" className="button-primary">
                      Create staff user
                    </button>
                    <div className="text-sm leading-7 text-white/55">
                      Customers should use the public booking page instead of receiving dashboard accounts.
                    </div>
                  </div>
                  {staffMessage && <div className="mt-4 text-sm text-[var(--warm)]">{staffMessage}</div>}
                </form>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-lg font-semibold text-white">Access policy</div>
                  <div className="space-y-3 text-sm leading-7 text-white/60">
                    <div>Customers are restricted to the landing page and the public dog appointment scheduler.</div>
                    <div>Groomers and admins only enter protected dashboards after the admin creates their account.</div>
                    <div>Resetting a password here acts like issuing a fresh initial password for the staff member.</div>
                    <div>Staff should change their temporary password on first real backend implementation.</div>
                  </div>
                </div>
              </div>

              <div className="mb-5 text-sm uppercase tracking-[0.18em] text-white/40">Staff directory</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {users.filter((user) => user.role !== 'customer').map((user) => (
                  <article key={user.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-4">
                      <img src={user.avatar} alt={user.name} className="h-14 w-14 rounded-2xl object-cover" />
                      <div>
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-sm uppercase tracking-[0.18em] text-white/40">{user.role}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm leading-7 text-white/60">
                      <div>{user.email}</div>
                      <div>{user.phone}</div>
                      <div>{user.location}</div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/35">
                        {user.mustChangePassword ? 'Initial password active' : 'Active account'}
                      </div>
                      {user.id !== currentUser.id && (
                        <button type="button" onClick={() => handlePasswordReset(user)} className="table-action">
                          Reset password
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="dashboard-panel">
              <div className="panel-heading">Admin settings</div>
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

export default AdminDashboard
