/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { initialData } from '../data/mockData.js'

const AppContext = createContext(null)

const DATA_KEY = 'pawze-data'
const AUTH_KEY = 'pawze-auth'

function readStorage(key, fallback) {
  const saved = localStorage.getItem(key)

  if (!saved) {
    return fallback
  }

  try {
    return JSON.parse(saved)
  } catch {
    return fallback
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function AppProvider({ children }) {
  const [data, setData] = useState(() => readStorage(DATA_KEY, initialData))
  const [currentUser, setCurrentUser] = useState(() => readStorage(AUTH_KEY, null))

  useEffect(() => {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser))
      return
    }

    localStorage.removeItem(AUTH_KEY)
  }, [currentUser])

  function getDashboardPath(role) {
    if (role === 'admin') return '/admin'
    if (role === 'groomer') return '/groomer'
    return '/customer'
  }

  function syncCurrentUser(updatedUsers, nextId = currentUser?.id) {
    if (!nextId) return

    const updated = updatedUsers.find((user) => user.id === nextId)

    if (updated) {
      setCurrentUser(updated)
    }
  }

  function login(email, password) {
    const user = data.users.find(
      (entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password,
    )

    if (!user) {
      return { ok: false, message: 'Incorrect email or password.' }
    }

    setCurrentUser(user)
    return { ok: true, user }
  }

  function loginWithDemo(role) {
    const user = data.users.find((entry) => entry.role === role)

    if (!user) {
      return { ok: false, message: 'Demo user is unavailable.' }
    }

    setCurrentUser(user)
    return { ok: true, user }
  }

  function register(payload) {
    const exists = data.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())

    if (exists) {
      return { ok: false, message: 'An account with that email already exists.' }
    }

    const user = {
      id: uid('user'),
      avatar: '/images/animal-shelter.jpg',
      location: payload.location || 'Metro Manila',
      ...payload,
    }

    const nextUsers = [...data.users, user]
    setData({ ...data, users: nextUsers })
    setCurrentUser(user)
    return { ok: true, user }
  }

  function logout() {
    setCurrentUser(null)
  }

  function addAppointment(appointment) {
    setData((prev) => ({
      ...prev,
      appointments: [{ id: uid('appt'), ...appointment }, ...prev.appointments],
    }))
  }

  function updateAppointment(id, updates) {
    setData((prev) => ({
      ...prev,
      appointments: prev.appointments.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
  }

  function deleteAppointment(id) {
    setData((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((item) => item.id !== id),
    }))
  }

  function addInventoryItem(item) {
    setData((prev) => ({
      ...prev,
      inventory: [{ id: uid('inv'), ...item }, ...prev.inventory],
    }))
  }

  function updateInventoryItem(id, updates) {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
  }

  function deleteInventoryItem(id) {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((item) => item.id !== id),
    }))
  }

  function adjustInventoryQuantity(id, delta) {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
      ),
    }))
  }

  function addPet(pet) {
    const createdPet = { id: uid('pet'), ownerId: currentUser.id, ...pet }
    setData((prev) => ({
      ...prev,
      pets: [createdPet, ...prev.pets],
    }))
    return createdPet
  }

  function updatePet(id, updates) {
    setData((prev) => ({
      ...prev,
      pets: prev.pets.map((pet) => (pet.id === id ? { ...pet, ...updates } : pet)),
    }))
  }

  function deletePet(id) {
    setData((prev) => ({
      ...prev,
      pets: prev.pets.filter((pet) => pet.id !== id),
      appointments: prev.appointments.filter((appt) => appt.petId !== id),
    }))
  }

  function updateProfile(updates) {
    const nextUsers = data.users.map((user) => (user.id === currentUser.id ? { ...user, ...updates } : user))
    setData({ ...data, users: nextUsers })
    syncCurrentUser(nextUsers, currentUser.id)
  }

  const lowStockItems = data.inventory.filter((item) => item.quantity <= item.threshold)

  return (
    <AppContext.Provider
      value={{
        ...data,
        currentUser,
        lowStockItems,
        getDashboardPath,
        login,
        loginWithDemo,
        register,
        logout,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustInventoryQuantity,
        addPet,
        updatePet,
        deletePet,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }

  return context
}
