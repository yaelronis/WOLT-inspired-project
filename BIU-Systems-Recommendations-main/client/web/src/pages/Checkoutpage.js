// @ts-check

// Checkout page- reached from the restaurant screen's "Go to checkout" button.
// It reads the cart from the shared CartContext, shows an order summary,
// delivery details and fees, places the order (POST /orders), then clears the cart.
// After placing, "View order" reveals the full list of products that were ordered.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/Cartcontext'
import { usePendingOrder, CANCEL_WINDOW_MS } from '../context/PendingOrderContext'
import Navbar from '../components/NavBar/navBar'
// @ts-ignore
import '../styles/Checkoutpage.css'
// @ts-ignore
import checkIcon from '../icons/v.svg'

// Display only fees (the server stores the product subtotal as the order total).
const DELIVERY_FEE = 15

/** @param {number} n */
const shekel = (n) => `\u20AA${Number(n || 0).toFixed(2)}`

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { items, restaurantId, restaurantName, total: subtotal, clearCart } = useCart()
  const { setPending, clearPending } = usePendingOrder()

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  // Snapshot of the placed order (kept after the cart is cleared) so we can show it.
  const [placed, setPlaced] = useState(/** @type {any} */ (null))
  const [showOrder, setShowOrder] = useState(false)
  const [me, setMe] = useState(/** @type {any} */ (null))

  // Cancellation state for the success screen.
  const [cancelled, setCancelled] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  // Ticks every second so the 15 minute window can close the button live.
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!placed || cancelled) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [placed, cancelled])

  // Load the logged in user's details (name + saved location) for the delivery line.
  useEffect(() => {
    let active = true
    if (user?.id) {
      api.getUser(user.id)
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => { if (active) setMe(u) })
        .catch(() => {})
    }
    return () => { active = false }
  }, [user])

  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100
  const total = subtotal + DELIVERY_FEE + serviceFee

  async function placeOrder() {
    if (!token || items.length === 0) return
    // content is a flat list of product ids- a quantity of 2 means the id appears twice.
    const content = []
    for (const it of items) for (let i = 0; i < it.qty; i++) content.push(it.id)
    setPlacing(true); setError('')
    try {
      const res = await api.createOrder({ restaurant: restaurantId, content }, token)
      if (res.ok) {
        //  The new order's id:
        //  1) from the JSON body,
        //  2) from the Location header,
        //  3) as a fallback, read it back from this user's orders list.
        const data = await res.json().catch(() => null)
        let id = data && data.id != null ? String(data.id) : ''
        if (!id) {
          const loc = res.headers.get('Location') || ''
          id = loc.split('/').filter(Boolean).pop() || ''
        }
        if (!id) {
          try {
            const listRes = await api.getOrders(token)
            if (listRes.ok) {
              const list = await listRes.json()
              if (Array.isArray(list) && list.length) {
                id = String(list.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a)).id)
              }
            }
          } catch {
            /* ignore - id stays empty */
          }
        }
        const placedAt = Date.now()
        // Snapshot what was ordered before clearing the cart, so we can display it.
        setPlaced({
          id,
          restaurantName,
          items: items.map((/** @type {any} */ it) => ({ ...it })),
          subtotal, serviceFee, total,
          placedAt,
        })
        // Remember it so the floating "cancel" button can follow the user for 15 min.
        if (id) setPending({ id, restaurantName, placedAt })
        clearCart()
      } else {
        const e = await res.json().catch(() => ({}))
        setError(e.error || 'Could not place the order.')
      }
    } catch {
      setError('Could not reach the server.')
    } finally {
      setPlacing(false)
    }
  }

  // Cancel the just placed order, if still within the 15 minute window.
  async function cancelOrder() {
    if (!placed || !token || cancelling) return
    if (!placed.id) {
      setCancelError("Couldn't identify the order to cancel.")
      return
    }
    if (Date.now() - placed.placedAt > CANCEL_WINDOW_MS) {
      setCancelError('cant cancel an order after 15 minutes')
      return
    }
    setCancelling(true); setCancelError('')
    try {
      const res = await api.cancelOrder(placed.id, token)
      if (res.ok) {
        setCancelled(true)
        clearPending()
      } else {
        const e = await res.json().catch(() => ({}))
        setCancelError(e.error || 'Could not cancel the order.')
      }
    } catch {
      setCancelError('Could not reach the server.')
    } finally {
      setCancelling(false)
    }
  }

  // success.
  if (placed) {
    const remaining = CANCEL_WINDOW_MS - (now - placed.placedAt)
    const windowOpen = remaining > 0
    return (
      <>
        <Navbar />
        <div className="co-wrap co-success">
          <img className="co-check" src={checkIcon} alt="Order placed" />
          <h1>Order placed!</h1>
          <p>Your order{placed.restaurantName ? ` from ${placed.restaurantName}` : ''} is confirmed.</p>
          <p className="co-ordernum">Order #{placed.id}{cancelled ? ' \u2014 Cancelled' : ''}</p>

          {!cancelled && (
            <p className="co-cancel-note">You can cancel an order only within 15 minutes of ordering.</p>
          )}

          <div className="co-success-actions">
            <button className="co-primary" onClick={() => setShowOrder((v) => !v)}>
              {showOrder ? 'Hide order' : 'View order'}
            </button>
            {!cancelled && (
              <button
                className="co-cancel"
                onClick={cancelOrder}
                disabled={cancelling || !windowOpen || !placed.id}
                title={windowOpen ? 'Cancel this order' : 'cant cancel an order after 15 minutes'}
              >
                {cancelling ? 'Cancelling\u2026' : 'Cancel order'}
              </button>
            )}
            <button className="co-secondary" onClick={() => navigate('/')}>Back to home</button>
          </div>

          {cancelled && <p className="co-cancelled-msg">This order has been cancelled.</p>}
          {!cancelled && !windowOpen && (
            <p className="co-cancel-expired">cant cancel an order after 15 minutes</p>
          )}
          {cancelError && <p className="co-error">{cancelError}</p>}

          {showOrder && (
            <section className="co-card co-placed">
              <h2 className="co-card-title">Items in this order</h2>
              <div className="co-items">
                {placed.items.map((/** @type {any} */ it) => (
                  <div key={it.id} className="co-item">
                    <div
                      className="co-item-pic"
                      style={it.pic ? { backgroundImage: `url(${it.pic})` } : undefined}
                    />
                    <span className="co-item-qty">{it.qty}{'\u00D7'}</span>
                    <span className="co-item-name">{it.name}</span>
                    <span className="co-item-price">{shekel(Number(it.price) * it.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="co-line"><span>Subtotal</span><span>{shekel(placed.subtotal)}</span></div>
              <div className="co-line"><span>Delivery fee</span><span>{shekel(DELIVERY_FEE)}</span></div>
              <div className="co-line"><span>Service fee</span><span>{shekel(placed.serviceFee)}</span></div>
              <div className="co-line co-total"><span>Total</span><span>{shekel(placed.total)}</span></div>
            </section>
          )}
        </div>
      </>
    )
  }

  // empty (cart was cleared, or page opened directly).
  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="co-wrap co-empty">
          <h1>Your cart is empty</h1>
          <p>Add items from a restaurant to check out.</p>
          <button className="co-primary" onClick={() => navigate('/')}>Browse restaurants</button>
        </div>
      </>
    )
  }

  // checkout
  return (
    <>
      <Navbar />
      <div className="co-wrap">
        <button className="co-back" onClick={() => navigate(-1)}>{'\u2190'} Back</button>
        <h1 className="co-title">Checkout</h1>
        {restaurantName && <p className="co-restaurant">{restaurantName}</p>}

        <div className="co-grid">
          {/* order summary */}
          <section className="co-card">
            <h2 className="co-card-title">Your order</h2>
            <div className="co-items">
              {items.map((/** @type {any} */ it) => (
                <div key={it.id} className="co-item">
                  <div
                    className="co-item-pic"
                    style={it.pic ? { backgroundImage: `url(${it.pic})` } : undefined}
                  />
                  <span className="co-item-qty">{it.qty}{'\u00D7'}</span>
                  <span className="co-item-name">{it.name}</span>
                  <span className="co-item-price">{shekel(Number(it.price) * it.qty)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* delivery + payment */}
          <aside className="co-side">
            <section className="co-card">
              <h2 className="co-card-title">Delivery</h2>
              <p className="co-deliver-to">{me?.name ? me.name : 'Your saved location'}</p>
              {me?.location && (
                <p className="co-coords">
                  {Number(me.location.lat).toFixed(4)}, {Number(me.location.lng).toFixed(4)}
                </p>
              )}
              <p className="co-eta">Estimated 40{'\u2013'}50 min</p>
            </section>

            <section className="co-card">
              <div className="co-line"><span>Subtotal</span><span>{shekel(subtotal)}</span></div>
              <div className="co-line"><span>Delivery fee</span><span>{shekel(DELIVERY_FEE)}</span></div>
              <div className="co-line"><span>Service fee</span><span>{shekel(serviceFee)}</span></div>
              <div className="co-line co-total"><span>Total</span><span>{shekel(total)}</span></div>
              {error && <p className="co-error">{error}</p>}
              <button className="co-primary co-place" disabled={placing} onClick={placeOrder}>
                {placing ? 'Placing\u2026' : `Place order \u00B7 ${shekel(total)}`}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </>
  )
}