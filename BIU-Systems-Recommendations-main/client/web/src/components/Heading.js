// @ts-check

// component styles

// @ts-ignore
import '../styles/Heading.css'
/**
 * Page Heading inside an auth card.
 * @param {{ children: any }} props
 */
export default function Heading({ children }) {
  return <h1 className="auth-Heading">{children}</h1>
}