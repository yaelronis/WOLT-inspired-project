// @ts-check

// component styles

// @ts-ignore
import '../styles/Logo.css'

/** The Wolt logo, centered at the top of an auth card. */
export default function Logo() {
  return (
    <div className="auth-Logo-wrap">
      <img src="/wolt-logo.png" alt="Wolt" className="auth-Logo-img" />
    </div>
  )
}
