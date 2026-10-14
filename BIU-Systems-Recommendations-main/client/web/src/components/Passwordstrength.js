// @ts-check

// component styles
// @ts-ignore
import '../styles/Passwordstrength.css'

// Scores a password 0-5 based on length and character variety.
/** @param {string} password */
function getStrength(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']

/**
 * Visual password strength meter.
 * @param {{ password: string }} props
 */
export default function Passwordstrength({ password }) {
  if (!password) return null
  const score = getStrength(password)

  return (
    <div className={`pwd-strength pwd-strength--${score}`}>
      <div className="pwd-strength-bars">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={i <= score ? 'pwd-strength-bar is-active' : 'pwd-strength-bar'}
          />
        ))}
      </div>
      <span className="pwd-strength-label">{LABELS[score]}</span>
    </div>
  )
}