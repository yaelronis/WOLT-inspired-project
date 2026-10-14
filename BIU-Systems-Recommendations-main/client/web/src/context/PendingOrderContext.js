// @ts-check

// Tracks the most recently placed order so the 15 minute "cancel" affordance can
// follow the user across navigation. When an order is placed we remember its id,
// restaurant name and the moment it was placed. a floating button (rendered in the
// page layout) then offers a quick way back to cancel it until the window closes.
// Persisted to sessionStorage so it survives a refresh within the window.

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

/**
 * @typedef {Object} PendingOrder
 * @property {string|number} id
 * @property {string} restaurantName
 * @property {number} placedAt - when the order was placed.
 */

/**
 * @typedef {Object} PendingOrderValue
 * @property {PendingOrder | null} pending
 * @property {(order: PendingOrder) => void} setPending
 * @property {() => void} clearPending
 */

// The cancel window- 15 minutes from when the order was placed.
export const CANCEL_WINDOW_MS = 15 * 60 * 1000

const STORAGE_KEY = 'pending_order'

const PendingOrderContext = createContext(/** @type {PendingOrderValue | null} */ (null))

/** @param {{ children: any }} props */
export function PendingOrderProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [pending, setPendingState] = useState(/** @returns {PendingOrder | null} */ () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      /** @type {PendingOrder} */
      const parsed = JSON.parse(raw)
      // Drop it if the window has already closed.
      if (Date.now() - parsed.placedAt > CANCEL_WINDOW_MS) return null
      return parsed
    } catch {
      return null
    }
  })

  const setPending = useCallback((/** @type {PendingOrder} */ order) => {
    setPendingState(order)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order))
    } catch {
      /* ignore storage errors */
    }
  }, [])

  const clearPending = useCallback(() => {
    setPendingState(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore storage errors */
    }
  }, [])

  // A pending order belongs to one logged in user. Clear it whenever the user
  // actually changes (logging in, out, or switching accounts) so it never leaks.
  // The initial mount is skipped so a value restored from sessionStorage survives
  // a page refresh.
  const prevUserId = useRef(userId)
  useEffect(() => {
    if (prevUserId.current !== userId) {
      prevUserId.current = userId
      clearPending()
    }
  }, [userId, clearPending])

  return (
    <PendingOrderContext.Provider value={{ pending, setPending, clearPending }}>
      {children}
    </PendingOrderContext.Provider>
  )
}

/** @returns {PendingOrderValue} */
export function usePendingOrder() {
  const ctx = useContext(PendingOrderContext)
  if (!ctx) throw new Error('usePendingOrder must be used inside <PendingOrderProvider>')
  return ctx
}
