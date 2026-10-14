// @ts-check

// Floating "you can still cancel" button. After an order is placed, the user has
// 15 minutes to cancel it. If they leave the confirmation screen, this button
// follows them around (rendered in the page layout) and takes them back to the
// order so they can cancel. It counts down and disappears once the window closes.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePendingOrder, CANCEL_WINDOW_MS } from '../context/PendingOrderContext'
// @ts-ignore
import '../styles/CancelWindowButton.css'

/** @param {number} ms */
function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CancelWindowButton() {
  const { pending, clearPending } = usePendingOrder()
  const navigate = useNavigate()
  const [now, setNow] = useState(Date.now())

  const remaining = pending ? CANCEL_WINDOW_MS - (now - pending.placedAt) : 0
  const expired = pending != null && remaining <= 0

  // Tick once a second so the countdown stays live and the button can retire
  // itself the moment the window closes.
  useEffect(() => {
    if (!pending) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [pending])

  // When the window closes, drop the pending order- but do it after render (in an
  // effect), never during render, or React warns about setState in render.
  useEffect(() => {
    if (expired) clearPending()
  }, [expired, clearPending])

  if (!pending || expired) return null

  return (
    <button
      className="cancel-window-btn"
      type="button"
      onClick={() => navigate(`/orders/${pending.id}`)}
      title="Go back to cancel your recent order"
    >
      <span className="cancel-window-btn-icon">{'\u23F1'}</span>
      <span className="cancel-window-btn-text">
        <span className="cancel-window-btn-title">Cancel order?</span>
        <span className="cancel-window-btn-sub">{formatRemaining(remaining)} left</span>
      </span>
    </button>
  )
}