// @ts-check

// component styles

// @ts-ignore
import '../styles/Page.css'

/**
 * Full screen centered page background for the auth screens.
 * @param {{ children: any }} props
 */
export default function Page({ children }) {
  return <div className="auth-Page">{children}</div>
}