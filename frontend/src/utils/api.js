/**
 * api.js — Axios-style fetch wrapper for the Pawze Django backend.
 *
 * - Automatically attaches the JWT access token to every request.
 * - Transparently refreshes the access token when a 401 is received.
 * - Exposes typed helpers: api.get / api.post / api.patch / api.put / api.delete
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

const TOKEN_KEY = 'pawze-access'
const REFRESH_KEY = 'pawze-refresh'

// ---------------------------------------------------------------------------
// Token storage helpers
// ---------------------------------------------------------------------------

export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function storeTokens({ access, refresh }) {
  if (access) sessionStorage.setItem(TOKEN_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

let _refreshPromise = null

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = (async () => {
    const refresh = getRefreshToken()
    if (!refresh) throw new Error('No refresh token available.')

    const resp = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!resp.ok) {
      clearTokens()
      throw new Error('Session expired. Please log in again.')
    }

    const data = await resp.json()
    storeTokens({ access: data.access, refresh: data.refresh ?? refresh })
    return data.access
  })().finally(() => {
    _refreshPromise = null
  })

  return _refreshPromise
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function request(method, path, body, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`

  let accessToken = getAccessToken()

  // Proactively refresh if expiring
  if (accessToken && isTokenExpired(accessToken)) {
    try {
      accessToken = await refreshAccessToken()
    } catch {
      clearTokens()
      window.dispatchEvent(new CustomEvent('pawze:logout'))
      throw new Error('Session expired. Please log in again.')
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  }

  let response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Retry once after token refresh on 401
  if (response.status === 401) {
    try {
      accessToken = await refreshAccessToken()
      response = await fetch(url, {
        method,
        headers: { ...headers, Authorization: `Bearer ${accessToken}` },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch {
      clearTokens()
      window.dispatchEvent(new CustomEvent('pawze:logout'))
      throw new Error('Session expired. Please log in again.')
    }
  }

  // Parse JSON or return empty on 204
  if (response.status === 204) return null

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    // Normalise DRF error responses into a readable string
    const message =
      typeof data === 'object' && data !== null
        ? Object.values(data).flat().join(' ')
        : `Request failed with status ${response.status}.`
    const err = new Error(message)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const api = {
  get:    (path, options)       => request('GET',    path, undefined, options),
  post:   (path, body, options) => request('POST',   path, body,      options),
  patch:  (path, body, options) => request('PATCH',  path, body,      options),
  put:    (path, body, options) => request('PUT',    path, body,      options),
  delete: (path, options)       => request('DELETE', path, undefined, options),
}

export default api
