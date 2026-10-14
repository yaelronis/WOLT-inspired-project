// @ts-check

// Shared shopping cart. It lives above the routes so it survives navigation
// between pages, holds one restaurant at a time (like Wolt), and is cleared
// explicitly after a successful order.

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(/** @type {any} */ (null))

const emptyCart = () => ({ restaurantId: /** @type {number | null} */ (null), restaurantName: '', lines: /** @type {Record<string, any>} */ ({}) })

/** @param {{ children: any }} props */
export function CartProvider({ children }) {
  // The logged-in user. CartProvider MUST be inside AuthProvider for this to work.
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [cart, setCart] = useState(emptyCart)

  // The cart belongs to one logged-in user. Whenever the user changes- logging in,
  // logging out, or switching accounts- start fresh so a cart never leaks to another user.
  useEffect(() => {
    setCart(emptyCart())
  }, [userId])

  // Add one of a product. Adding from a different restaurant starts a fresh cart.
  const addItem = useCallback((/** @type {number} */ restaurantId, /** @type {string} */ restaurantName, /** @type {any} */ product) => {
    setCart((c) => {
      const lines = c.restaurantId === restaurantId ? { ...c.lines } : {}
      const ex = lines[product.id]
      lines[product.id] = ex
        ? { ...ex, qty: ex.qty + 1 }
        : { id: product.id, name: product.name, price: Number(product.price), pic: product.pic, qty: 1 }
      return { restaurantId, restaurantName: restaurantName || '', lines }
    })
  }, [])

  // Remove one of a product (drops the line when it hits zero).
  const decItem = useCallback((/** @type {string | number} */ id) => {
    setCart((c) => {
      const lines = { ...c.lines }
      const ex = lines[id]
      if (!ex) return c
      if (ex.qty <= 1) delete lines[id]
      else lines[id] = { ...ex, qty: ex.qty - 1 }
      return { ...c, lines }
    })
  }, [])

  const clearCart = useCallback(() => setCart(emptyCart()), [])

  const value = useMemo(() => {
    const items = Object.values(cart.lines)
    return {
      restaurantId: cart.restaurantId,
      restaurantName: cart.restaurantName,
      items,
      count: items.reduce((s, /** @type {any} */ l) => s + l.qty, 0),
      total: items.reduce((s, /** @type {any} */ l) => s + l.price * l.qty, 0),
      qtyOf: (/** @type {string | number} */ id) => cart.lines[id]?.qty || 0,
      belongsTo: (/** @type {number} */ rid) => cart.restaurantId === rid,
      addItem,
      decItem,
      clearCart,
    }
  }, [cart, addItem, decItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside a CartProvider')
  return ctx
}