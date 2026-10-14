// @ts-check

// Registration screen. The user fills in all required fields.
// On submit: validate the profile picture, then each field with its own
// validator, then POST/api/users. On success, auto-login and redirect.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  validateDisplayName,
  validateUsername,
  validatePassword,
  validateConfirmPassword,
  validateLocation,
} from '../utils/validation'
import { api } from '../utils/api'
import Page from '../components/Page'
import Card from '../components/Card'
import Logo from '../components/Logo'
import Heading from '../components/Heading'
import Form from '../components/Form'
import Textfield from '../components/Textfield'
import Passwordfield from '../components/Passwordfield'
import Profilepicpicker from '../components/Profilepicpicker'
import Passwordstrength from '../components/Passwordstrength'
import Roleselect from '../components/Roleselect'
// @ts-ignore
import '../styles/auth.css'
// @ts-ignore
import '../styles/RegisterPage.css'

// Each field owns its validator. confirmPassword also needs the password value,
// so every validator receives the current form as a second argument.
const validators = /** @type {Record<string, (v: string, form?: any) => string | null>} */ ({
  name: (v) => validateDisplayName(v),
  username: (v) => validateUsername(v),
  password: (v) => validatePassword(v),
  confirmPassword: (v, form) => validateConfirmPassword(form.password, v),
  location: (v) => validateLocation(v),
})
const FIELD_ORDER = /** @type {Array<'name'|'username'|'password'|'confirmPassword'|'location'>} */ ([
  'name', 'username', 'password', 'confirmPassword', 'location',
])

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    name: '', username: '', password: '', confirmPassword: '', location: '',
  })
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(/** @type {'user' | 'owner'} */ ('user'))

  // The profile picture as a data URL. The Profilepicpicker component owns the
  // file input, preview, type/size validation and the FileReader. 
  // here we only keep the resulting image (for the payload) and the "required" error.
  const [profilePic, setProfilePic] = useState(/** @type {string | null} */ (null))
  const [profilePicError, setProfilePicError] = useState('')

  /** @param {string | null} image */
  function handleProfilePic(image) {
    setProfilePic(image)
    // Clear the submit time "required" error on any pick.
    // The picker shows its own type/size error when a chosen file is invalid.
    setProfilePicError('')
  }

  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  function handleChange(e) {
    const { name, value } = e.target
    const nextForm = { ...form, [name]: value }
    setForm(nextForm)
    // Validate live so invalid input shows immediately. An empty field stays
    // quiet. its "required" message only appears when you press Continue.
    setErrors((prev) => {
      const next = { ...prev }
      const validate = validators[name]
      next[name] = value.trim() === '' ? '' : (validate ? validate(value, nextForm) || '' : '')
      // Keep the confirm password error in sync when the password changes.
      if (name === 'password') {
        next.confirmPassword = nextForm.confirmPassword.trim() === ''
          ? ''
          : validateConfirmPassword(nextForm.password, nextForm.confirmPassword) || ''
      }
      return next
    })
    if (serverError) setServerError('')
  }

  // Validate a single field on blur using its own validator.
  /** @param {import('react').FocusEvent<HTMLInputElement>} e */
  function handleBlur(e) {
    const { name, value } = e.target
    const validate = validators[name]
    if (validate) {
      setErrors((prev) => ({ ...prev, [name]: value.trim() === '' ? '' : (validate(value, form) || '') }))
    }
  }

  // Log the user in right after a successful registration, then route them:
  // a restaurant owner goes straight to creating their restaurant, everyone
  // else (and anyone whose login failed) lands on the main screen.
  // Registration (POST /users) doesn't return a token, so we exchange the same
  // (already valid) credentials for one with the login endpoint.
  // We pass the chosen role into login() so the app knows it immediately (no extra fetch).
  /** @param {string} username @param {string} password */
  async function autoLogin(username, password) {
    let loggedIn = false
    try {
      const res = await api.login({ username, password })
      if (res.ok) {
        const { token } = await res.json()
        login(token, { username, role })
        loggedIn = true
      }
    } catch {
      // Couldn't fetch a token- still continue to the main screen.
    }
    navigate(loggedIn && role === 'owner' ? '/restaurants/new' : '/')
  }

  /** @param {import('react').SyntheticEvent<HTMLFormElement>} e */
  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    // Validate the picture and every field together so all problems surface at
    const nextErrors = /** @type {Record<string, string>} */ ({})
    for (const field of FIELD_ORDER) {
      const err = validators[field](form[field], form)
      if (err) nextErrors[field] = err
    }
    const picErr = profilePic ? '' : 'Please upload a profile picture.'

    if (picErr || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setProfilePicError(picErr)
      // Move focus to the first invalid text field, if any.
      const firstInvalid = FIELD_ORDER.find((f) => nextErrors[f])
      if (firstInvalid) {
        /** @type {HTMLElement | null} */
        const el = document.querySelector(`[name="${firstInvalid}"]`)
        el?.focus()
      }
      return
    }

    // Coordinates string = { lat, lng } numbers.
    const parts = form.location.trim().split(/[\s,]+/)
    const payload = {
      username: form.username.trim(),
      password: form.password,
      name: form.name.trim(),
      image: profilePic,
      location: { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) },
      role,
    }

    setLoading(true)
    // Only the network call can fail unexpectedly, so only it is in the try.
    let res
    try {
      res = await api.register(payload)
    } catch {
      setServerError('Cannot reach the server. Check your connection.')
      setLoading(false)
      return
    }

    if (res.ok) {
      await autoLogin(payload.username, payload.password)
      return
    }

    setLoading(false)
    if (res.status === 409) {
      setServerError('Username already taken. Please choose another.')
    } else if (res.status === 400) {
      const data = await res.json().catch(() => null)
      if (data?.errors) setErrors(data.errors)
      else setServerError(data?.error || 'Registration failed. Please check your details.')
    } else {
      setServerError('Something went wrong. Please try again.')
    }
  }

  return (
    <Page>
      <Card>
        <Logo />
        <Heading>Create a Wolt account</Heading>

        <Form onSubmit={handleSubmit}>
          <Roleselect value={role} onChange={setRole} />

          <Profilepicpicker
            value={profilePic}
            error={profilePicError}
            onChange={handleProfilePic}
          />

          <Textfield
            id="reg-name"
            name="name"
            label="Display name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            autoComplete="name"
            maxLength={50}
            hint="Letters, spaces and hyphens. 2-50 characters."
          />

          <Textfield
            id="reg-username"
            name="username"
            label="Username"
            value={form.username}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.username}
            autoComplete="username"
            maxLength={20}
            hint="Letters, numbers and underscores. 3-20 characters."
          />

          <Passwordfield
            id="reg-password"
            name="password"
            label="Password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            autoComplete="new-password"
            hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
          />

          <Passwordstrength password={form.password} />

          <Passwordfield
            id="reg-confirm"
            name="confirmPassword"
            label="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirmPassword}
            autoComplete="new-password"
            hint="Re-enter the same password."
          />

          <Textfield
            id="reg-location"
            name="location"
            label="Location (coordinates)"
            value={form.location}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.location}
            autoComplete="off"
            placeholder="Example: 32.0853, 34.7818"
            hint="Coordinates as lat, lng. Example: 32.0853, 34.7818"
            suffix={
              <span className="input-location-icon">
             </span>
            }
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
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </p>

        <p className="auth-privacy">
          Please visit <span className="auth-link">Wolt Privacy Statement</span> to
          learn about personal data processing at Wolt.
        </p>
      </Card>
    </Page>
  )
}