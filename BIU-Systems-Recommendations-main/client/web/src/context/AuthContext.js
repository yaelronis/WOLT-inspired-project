// @ts-check

/**
 * Holds the current user's JWT + basic info and exposes login/logout.
 * Survives refresh, cleared on tab close.
 * Read it with useAuth().
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

/** @typedef {import('../../../../api/src/model/users.js').User} User */
/** @typedef {Omit<User, "password">} UserData */

/**
 * @typedef {Object} AuthValue
 * @property {string | null} token
 * @property {UserData?} user
 * @property {(jwt: string, user: any) => void} login
 * @property {() => void} logout
 */

const AuthContext = createContext(/** @type {AuthValue | null} */ (null))

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * Decode a JWT payload (the middle segment) without verifying the signature.
 * Safe for reading our own non-sensitive claims (e.g. user_id) for display.
 * Returns {} if the token is missing or malformed.
 * @param {string | null} jwt
 * @returns {Record<string, any>}
 */
function decodeJwtPayload(jwt) {
  try {
    if (!jwt) return {}
    let b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(atob(b64))
  } catch {
    return {}
  }
}

/** @param {{ children: any }} props */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY))

  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem(USER_KEY)
    if (!stored) return null
    // Only JSON.parse can throw, so only it is wrapped.
    try {
      /** @type {UserData} */
      const json = JSON.parse(stored);
      return json;
    } catch {
      return null
    }
  })

  // Once logged in, make sure we know the user's role (owner vs user).
  // The login response and JWT don't include it, so fetch the user once and
  // cache it. role resolves to a string or null so guards can tell "loading"
  // (undefined) from "resolved, not an owner" (null/other).
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!token) return;
      const res = await api.affirmjwt(token);
      if (res.status !== 200) return logout();
      if (cancelled) return;
      /** @type {UserData} */
      const body = await res.json();
      const body_as_str = JSON.stringify(body);
      sessionStorage.setItem(USER_KEY, body_as_str);
      setUser(body);
    }
    function cleanup() {
      cancelled = true;
    }
    init();
    return cleanup;
  }, [token])

  // Save the JWT + user info after a successful login or registration.
  // The user_id is read from the token so the rest of the app (like the main
  // page) can use user.id- useAuth() without decoding the JWT itself.
  const login = (/** @type {string} */ jwt, /** @type {any} */ userData) => {
    const { user_id } = decodeJwtPayload(jwt)
    const fullUser = { ...userData, id: user_id }
    setToken(jwt)
    setUser(fullUser)
    sessionStorage.setItem(TOKEN_KEY, jwt)
    sessionStorage.setItem(USER_KEY, JSON.stringify(fullUser))
  }

  // Clear everything on log out.
  const logout = () => {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook used by any component that needs auth state or actions.
// Exported so other providers (e.g. the cart) can read auth state safely
// with useContext, without throwing when used outside an AuthProvider.
export { AuthContext }

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}