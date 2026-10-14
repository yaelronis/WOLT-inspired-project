// @ts-check

import { useState, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Image
} from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Link } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import {
  validateDisplayName,
  validateUsername,
  validatePassword,
  validateConfirmPassword,
  validateLocation,
} from '../utils/validation'
import { api } from '../utils/api'
//@ts-ignore
import woltLogo from '../assets/wolt-logo.png'
import TextField from '../components/TextField';
import PasswordField from '../components/PasswordField'
import PasswordStrength from '../components/PasswordStrength'
import ProfilePicPicker from '../components/ProfilePicker'
import RoleSelect from '../components/RoleSelect'

import get_stylesheet from "../styles/RegisterScreen.styles"
import ContinueButton from '../components/ContinueButton';
import { useTheme } from '../context/ThemeContext';

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
  const styles = get_stylesheet(useTheme());
  const { login } = useAuth()

  // Exactly the same state objects as Web
  const [form, setForm] = useState({
    name: '', username: '', password: '', confirmPassword: '', location: '',
  })
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */({}))
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('user')

  const [profilePic, setProfilePic] = useState(/** @type {string | null} */(null))
  const [profilePicError, setProfilePicError] = useState('')

  // Native refs layout for focus shift instead of document.querySelector
  const fieldRefs = {
    name: useRef(/** @type {any} */(null)),
    username: useRef(/** @type {any} */(null)),
    password: useRef(/** @type {any} */(null)),
    confirmPassword: useRef(/** @type {any} */(null)),
    location: useRef(/** @type {any} */(null)),
  }

  // The profile picture as a data URL. The Profilepicpicker component owns the
  // file input, preview, type/size validation and the FileReader. 
  // here we only keep the resulting image (for the payload) and the "required" error.
  /** @param {string | null} image */
  function handleProfilePic(image) {
    setProfilePic(image)
    // Clear the submit time "required" error on any pick.
    // The picker shows its own type/size error when a chosen file is invalid.
    setProfilePicError('')
  }

  // Receives direct string value inline from native inputs
  /** @param {string} name @param {string} value */
  function handleChange(name, value) {
    const nextForm = { ...form, [name]: value }
    setForm(nextForm)

    setErrors((prev) => {
      const next = { ...prev }
      const validate = validators[name]
      next[name] = value.trim() === '' ? '' : (validate ? validate(value, nextForm) || '' : '')
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
  /** @param {string} name @param {string} value */
  function handleBlur(name, value) {
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

    // Expo Router implementation of the original path mapping
    if (loggedIn && role === 'owner') {
      router.push('/restaurants/new')
    } else {
      router.push('/')
    }
  }

  async function handleSubmit() {
    setServerError('')

    const nextErrors = /** @type {Record<string, string>} */ ({})
    for (const field of FIELD_ORDER) {
      const err = validators[field](form[field], form)
      if (err) nextErrors[field] = err
    }
    const picErr = profilePic ? '' : 'Please upload a profile picture.'

    if (picErr || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setProfilePicError(picErr)

      const firstInvalid = FIELD_ORDER.find((f) => nextErrors[f])
      if (firstInvalid) {
        fieldRefs[firstInvalid].current?.focus()
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
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>

            <Image source={woltLogo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.heading}>Create a Wolt account</Text>

            <ProfilePicPicker
              value={profilePic}
              error={profilePicError}
              onChange={handleProfilePic}
            />
            <RoleSelect value={/** @type {'user' | 'owner'} */ (role)} onChange={setRole} />

            <TextField
              innerRef={fieldRefs.name}
              id="reg-name"
              label="Display name"
              value={form.name}
              onChangeText={(text) => handleChange('name', text)}
              onBlur={() => handleBlur('name', form.name)}
              error={errors.name}
              autoComplete="name"
              maxLength={50}
              hint="Letters, spaces and hyphens. 2-50 characters."
            />

            <TextField
              innerRef={fieldRefs.username}
              id="reg-username"
              label="Username"
              value={form.username}
              onChangeText={(text) => handleChange('username', text)}
              onBlur={() => handleBlur('username', form.username)}
              error={errors.username}
              autoComplete="username"
              maxLength={20}
              hint="Letters, numbers and underscores. 3-20 characters."
            />

            <PasswordField
              innerRef={fieldRefs.password}
              id="reg-password"
              label="Password"
              value={form.password}
              onChangeText={(text) => handleChange('password', text)}
              onBlur={() => handleBlur('password', form.password)}
              error={errors.password}
              autoComplete="new-password"
              hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
            />

            <PasswordStrength password={form.password} />

            <PasswordField
              innerRef={fieldRefs.confirmPassword}
              id="reg-confirm"
              label="Confirm password"
              value={form.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              onBlur={() => handleBlur('confirmPassword', form.confirmPassword)}
              error={errors.confirmPassword}
              autoComplete="new-password"
              hint="Re-enter the same password."
            />

            <TextField
              innerRef={fieldRefs.location}
              id="reg-location"
              label="Location (coordinates)"
              value={form.location}
              onChangeText={(text) => handleChange('location', text)}
              onBlur={() => handleBlur('location', form.location)}
              error={errors.location}
              autoComplete="off"
              placeholder="Example: 32.0853, 34.7818"
              hint="Coordinates as lat, lng. Example: 32.0853, 34.7818"
            />

            {serverError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {serverError}
              </Text>
            ) : null}

            <ContinueButton onPress={handleSubmit} loading={loading} />

            {/* Expo Router structural equivalence for the base Link layout */}
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.altLink}>
                  Already have an account? <Text style={styles.link}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

