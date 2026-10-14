// @ts-check

// component styles

// @ts-ignore
import '../styles/Card.css'

/**
 * White centered card. One single card style is used everywhere
 * (login and register) so every card looks and behaves the same.
 * @param {{ children: any }} props
 */
export default function Card({ children }) {
  return (
    <div className="auth-Card">
      {children}
    </div>
  )
}