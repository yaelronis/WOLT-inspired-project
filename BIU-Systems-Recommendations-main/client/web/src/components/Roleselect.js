// @ts-check

// component styles
// @ts-ignore
import '../styles/Roleselect.css'

/**
 * Account type. regular user vs restaurant owner.
 *
 * @param {object} props
 * @param {'user' | 'owner'} props.value
 * @param {(value: 'user' | 'owner') => void} props.onChange
 */
export default function Roleselect({ value, onChange }) {
  return (
    <div className="auth-field">
      <span className="auth-field-label">I'm registering as</span>

      <div className="role-select" role="radiogroup" aria-label="Account type">
        <label className="role-option">
          <input
            type="radio"
            name="role"
            value="user"
            checked={value === 'user'}
            onChange={() => onChange('user')}
          />
          <span className="role-option-title">Regular user</span>
          <span className="role-option-sub">Order food from restaurants</span>
        </label>

        <label className="role-option">
          <input
            type="radio"
            name="role"
            value="owner"
            checked={value === 'owner'}
            onChange={() => onChange('owner')}
          />
          <span className="role-option-title">Restaurant owner</span>
          <span className="role-option-sub">List and manage a restaurant</span>
        </label>
      </div>
    </div>
  )
}
