// @ts-check

// component styles

// @ts-ignore
import '../styles/Form.css'

/**
 * The auth Form wrapper. Keeps the markup matching the structure
 * Page > Card > ... > Form > Field.
 * @param {{ onSubmit: (e: any) => void, children: any }} props
 */
export default function Form({ onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} noValidate className="auth-Form">
      {children}
    </form>
  )
}