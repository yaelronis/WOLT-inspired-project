// @ts-check

import { useState } from 'react'
import Textfield from './Textfield'

// component styles

// @ts-ignore
import '../styles/Passwordfield.css'

/**
 * A password Textfield that owns its own show/hide.
 *
 * @param {object} props
 * @param {string}  props.id
 * @param {string}  props.name
 * @param {string}  props.label
 * @param {string}  props.value
 * @param {(e: any) => void} props.onChange
 * @param {string}  [props.error]
 * @param {(e: any) => void} [props.onBlur]
 * @param {string}  [props.autoComplete]
 * @param {string}  [props.hint]
 */
export default function Passwordfield({
  id, name, label, value, onChange, error, onBlur, autoComplete, hint,
}) {
  const [show, setShow] = useState(false)

  const toggle = (
    <button
      type="button"
      className="auth-eye-btn"
      onClick={() => setShow((v) => !v)}
      aria-pressed={show}
      aria-label={show ? 'Hide password' : 'Show password'}
    />
  )

  return (
    <Textfield
      id={id}
      name={name}
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      autoComplete={autoComplete}
      hint={hint}
      suffix={toggle}
    />
  )
}