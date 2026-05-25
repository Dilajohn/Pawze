/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import api, { storeTokens, clearTokens } from '../utils/api.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pawze-user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Persist user to sessionStorage
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('pawze-user', JSON.stringify(currentUser))
    } else {
      sessionStorage.removeItem('pawze-user')
    }
  }, [currentUser])

  // Listen for forced logout from the API layer
  useEffect(() => {
    const handler = () => { setCurrentUser(null) }
    window.addEventListener('pawze:logout', handler)
    return () => window.removeEventListener('pawze:logout', handler)
  }, [])

  function getDashboardPath(role) {
    if (role === 'admin') return '/admin'
    if (role === 'groomer') return '/groomer'
    return '/customer'
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  async function login(email, password) {
    try {
      const data = await api.post('/auth/login/', { username: email, password })
      storeTokens({ access: data.access, refresh: data.refresh })
      setCurrentUser(data.user ?? null)

      // If the backend login returns tokens but not user data inline, fetch profile
      if (!data.user) {
        const profile = await api.get('/users/me/')
        setCurrentUser(profile)
        return { ok: true, user: profile }
      }

      return { ok: true, user: data.user }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function register(payload) {
    try {
      const data = await api.post('/auth/register/', payload)
      storeTokens({ access: data.access, refresh: data.refresh })
      setCurrentUser(data.user)
      return { ok: true, user: data.user }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  function logout() {
    clearTokens()
    setCurrentUser(null)
  }

  async function changePassword(oldPassword, newPassword, newPasswordConfirm) {
    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      // Refresh current user to clear must_change_password
      const updated = { ...currentUser, must_change_password: false }
      setCurrentUser(updated)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  // Demo login — still hits the backend with well-known credentials
  async function loginWithDemo(role) {
    const credentials = {
      admin:   { username: 'admin_demo',   password: 'DemoAdmin1!' },
      groomer: { username: 'groomer_demo', password: 'DemoGroom1!' },
    }
    if (!credentials[role]) {
      return { ok: false, message: 'Demo access is for admin and groomer only.' }
    }
    return login(credentials[role].username, credentials[role].password)
  }

  // ---------------------------------------------------------------------------
  // Appointments
  // ---------------------------------------------------------------------------

  async function addAppointment(appointment) {
    try {
      const created = await api.post('/appointments/', appointment)
      return { ok: true, data: created }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function updateAppointment(id, updates) {
    try {
      const updated = await api.patch(`/appointments/${id}/`, updates)
      return { ok: true, data: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function deleteAppointment(id) {
    try {
      await api.delete(`/appointments/${id}/`)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function submitFeedback(appointmentId, rating, comments) {
    try {
      const data = await api.post(`/appointments/${appointmentId}/feedback/`, { rating, comments })
      return { ok: true, data }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  async function addInventoryItem(item) {
    try {
      const created = await api.post('/inventory/', item)
      return { ok: true, data: created }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function updateInventoryItem(id, updates) {
    try {
      const updated = await api.patch(`/inventory/${id}/`, updates)
      return { ok: true, data: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function deleteInventoryItem(id) {
    try {
      await api.delete(`/inventory/${id}/`)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  // ---------------------------------------------------------------------------
  // Pets
  // ---------------------------------------------------------------------------

  async function addPet(pet) {
    try {
      const created = await api.post('/pets/', pet)
      return { ok: true, data: created }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function updatePet(id, updates) {
    try {
      const updated = await api.patch(`/pets/${id}/`, updates)
      return { ok: true, data: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function deletePet(id) {
    try {
      await api.delete(`/pets/${id}/`)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  // ---------------------------------------------------------------------------
  // Staff management (admin)
  // ---------------------------------------------------------------------------

  async function createStaffAccount(payload) {
    try {
      const data = await api.post('/users/', payload)
      return { ok: true, user: data }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function resetUserPassword(userId, newPassword) {
    try {
      await api.post(`/users/${userId}/reset_password/`, { new_password: newPassword })
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  async function updateProfile(updates) {
    try {
      const updated = await api.patch('/users/me/', updates)
      setCurrentUser(updated)
      return { ok: true, user: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        loading,
        error,
        getDashboardPath,
        // auth
        login,
        loginWithDemo,
        register,
        logout,
        changePassword,
        // appointments
        addAppointment,
        updateAppointment,
        deleteAppointment,
        submitFeedback,
        // inventory
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        // pets
        addPet,
        updatePet,
        deletePet,
        // staff / profile
        createStaffAccount,
        resetUserPassword,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
