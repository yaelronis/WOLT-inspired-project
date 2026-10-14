// @ts-check

// component styles

// @ts-ignore
import '../styles/Textfield.css'

/**
 * A labelled text input with a uniform error message slot.
 *
 * @param {object} props
 * @param {string}  props.id
 * @param {string}  props.name
 * @param {string}  props.label
 * @param {string}  props.value
 * @param {(e: any) => void} props.onChange
 * @param {string}  [props.type]
 * @param {string}  [props.error]
 * @param {(e: any) => void} [props.onBlur]
 * @param {string}  [props.autoComplete]
 * @param {string}  [props.placeholder]
 * @param {number}  [props.maxLength]
 * @param {any}     [props.suffix]
 * @param {string}  [props.hint]
 */
export default function Textfield({
  id, name, label, value, onChange,
  type = 'text', error, onBlur, autoComplete, placeholder, maxLength, suffix, hint,
}) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field-label">{label}</label>
      <div className="auth-input-wrap">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={!!error}
          className="auth-input"
        />
        {suffix}
      </div>
      {hint && <p className="auth-field-hint">{hint}</p>}
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  )
}