// @ts-check

// Login screen. The user enters their username and password.
// On submit: validate each field with its own validator, then POST/api/tokens.
// The server returns a JWT, which is stored in AuthContext.
// Every failed login shows the same generic message.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import Page from '../components/Page'
import Card from '../components/Card'
import Logo from '../components/Logo'
import Heading from '../components/Heading'
import Form from '../components/Form'
import Textfield from '../components/Textfield'
import Passwordfield from '../components/Passwordfield'
// @ts-ignore
import '../styles/auth.css'

// Each field owns its validator. Login stays lenient on purpose.
// it only requires the fields to be filled in.
const validators = /** @type {Record<string, (v: string) => string | null>} */ ({
  username: (v) => (v.trim() ? null : 'Please enter your username.'),
  password: (v) => (v ? null : 'Please enter your password.'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  // Validate a single field using its own validator.
  /** @param {import('react').FocusEvent<HTMLInputElement>} e */
  function handleBlur(e) {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: validators[name](value) || '' }))
  }

  /** @param {import('react').SyntheticEvent<HTMLFormElement>} e */
  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    // Run each field's validator.
    const nextErrors = /** @type {Record<string, string>} */ ({})
    for (const field of /** @type {Array<keyof typeof form>} */ (['username', 'password'])) {
      const err = validators[field](form[field])
      if (err) nextErrors[field] = err
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      // Jump to the first invalid field, found by its name attribute.
      const firstInvalid = ['username', 'password'].find((f) => nextErrors[f])
      if (firstInvalid) {
        /** @type {HTMLElement | null} */
        const el = document.querySelector(`[name="${firstInvalid}"]`)
        el?.focus()
      }
      return
    }

    setLoading(true)
    // Only the network call can fail unexpectedly, so only it is in the try.
    let res
    try {
      res = await api.login({ username: form.username.trim(), password: form.password })
    } catch {
      setServerError('Cannot reach the server. Check your connection.')
      setLoading(false)
      return
    }
    setLoading(false)

    if (!res.ok) {
      setServerError('Invalid username or password.')
      return
    }

    // The server gives structured data: { token }.
    const { token } = await res.json()
    login(token, { username: form.username.trim() })
    navigate('/')
  }

  return (
    <Page>
      <Card>
        <Logo />
        <Heading>Log in to Wolt</Heading>

        <Form onSubmit={handleSubmit}>
          <Textfield
            id="login-username"
            name="username"
            label="Enter your username"
            value={form.username}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.username}
            autoComplete="username"
            hint="The username for your account."
          />

          <Passwordfield
            id="login-password"
            name="password"
            label="Enter your password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            autoComplete="current-password"
            hint="The password for your account."
          />

          {serverError && (
            <p className="auth-field-error" role="alert">
              {serverError}
            </p>
          )}

          <button type="submit" className="auth-continue-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Continue'}
          </button>
        </Form>

        <p className="auth-alt-link">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create account</Link>
        </p>

        <p className="auth-privacy">
          Please visit <span className="auth-link">Wolt Privacy Statement</span> to
          learn about personal data processing at Wolt.
        </p>
      </Card>
    </Page>
  )
}