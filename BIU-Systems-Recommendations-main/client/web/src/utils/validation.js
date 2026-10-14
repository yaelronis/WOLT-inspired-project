// @ts-check

// All client-side validation rules for the registration and login forms.
// Each rule validates one field and returns an error string, or null if valid.
// Each field specifies its own validator and the field component displays its own error.
// These rules mirror the server-side rules so errors are caught early.

// Profile picture. Only JPG and PNG, max 2MB.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

/**
 * @param {File | null} file
 * @returns {string | null}
 */
export function validateProfilePic(file) {
  if (!file) return 'Please upload a profile picture.'
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return 'Only JPG and PNG files are allowed.'
  if (file.size > MAX_IMAGE_BYTES)
    return 'Image must be smaller than 2MB.'
  return null
}

/**
 * Display name. Letters, spaces, hyphens. 2-50 chars.
 * @param {string} value
 * @returns {string | null}
 */
export function validateDisplayName(value) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return 'You must enter your name.'
  if (trimmed.length < 2) return 'Name must be at least 2 characters.'
  if (trimmed.length > 50) return 'Name must be at most 50 characters.'
  if (!/^[a-zA-Z\s-]+$/.test(trimmed))
    return 'Name may only contain letters, spaces, and hyphens.'
  return null
}

/**
 * Username. Letters, digits, underscore. 3-20 chars.
 * @param {string} value
 * @returns {string | null}
 */
export function validateUsername(value) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return 'You must enter your username.'
  if (trimmed.length < 3) return 'Username must be at least 3 characters.'
  if (trimmed.length > 20) return 'Username must be at most 20 characters.'
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
    return 'Username may only contain letters, numbers, and underscores.'
  return null
}

/**
 * Password. Min 8 chars, with a lowercase, an uppercase, and a digit.
 * @param {string} value
 * @returns {string | null}
 */
export function validatePassword(value) {
  if (!value) return 'You must enter your password.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter.'
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.'
  if (!/[0-9]/.test(value)) return 'Password must contain at least one number.'
  return null
}

/**
 * Confirm password. Must match the password.
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {string | null}
 */
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'You must confirm your password.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return null
}

/**
 * Location. "lat, lng" (, or space separated), within valid ranges.
 * @param {string} value
 * @returns {string | null}
 */
export function validateLocation(value) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return 'You must enter your coordinates.'

  const parts = trimmed.split(/[\s,]+/)
  if (parts.length !== 2)
    return 'Enter valid coordinates. (Example: 32.0853, 34.7818)'

  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])

  if (isNaN(lat) || isNaN(lng)) return 'Coordinates must be valid numbers.'
  if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90.'
  if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180.'

  return null
}

/* Restaurant form validation rules (shared so the create/edit pages can reuse them). */

/**
 * Restaurant name rules- required, not blank or space-only, between 2 and 50 chars,
 * characters & " ' . - , only.
 * @param {string} value
 * @returns {string | null} error message or null when valid.
 */
export function validateName(value) {
  const t = (value || '').trim()
  if (!t) return 'Please enter the place name.'
  if (t.length < 2) return 'Name must be at least 2 characters.'
  if (t.length > 50) return 'Name must be 50 characters or fewer.'
  if (!/^[A-Za-z0-9 &"'.-]+$/.test(t)) return 'Name can only use English letters, numbers, spaces and & " \' - .'
  return null
}

/**
 * Address rules- required, up to 255 chars, English letters, numbers, spaces and the
 * characters - . \ / " ' , only.
 * @param {string} value
 * @returns {string | null}
 */
export function validateAddress(value) {
  const t = (value || '').trim()
  if (!t) return 'Please enter the address.'
  if (t.length > 255) return 'Address must be 255 characters or fewer.'
  if (!/^[A-Za-z0-9 "',.\\/-]+$/.test(t)) return 'Address can only use English letters, numbers, spaces and - . \\ / " \' ,'
  return null
}

/**
 * Dish name rules- 2-50 chars, English letters, numbers, spaces only.
 * characters ' & ( ) . , - only.
 * @param {string} value
 * @returns {string | null}
 */
export function validateDishName(value) {
  const t = (value || '').trim()
  if (!t) return 'Please enter a dish name.'
  if (t.length < 2) return 'Name must be at least 2 characters.'
  if (t.length > 50) return 'Name must be 50 characters or fewer.'
  if (!/^[A-Za-z0-9 '&().,-]+$/.test(t)) return 'Name can only use English letters, numbers and basic punctuation.'
  return null
}

/**
 * Price rules- 1-10 chars, digits, only one decimal point, commas (In proper locations) only.
 * @param {string} value
 * @returns {string | null}
 */
export function validatePrice(value) {
  const v = (value || '').trim()
  if (!v) return 'Please enter a price.'
  if (v.length > 10) return 'Price can be at most 10 characters.'
  if (!/^[0-9.,]+$/.test(v)) return 'Price can only contain numbers, commas and periods.'
  if ((v.match(/\./g) || []).length > 1) return 'Price can have only one decimal point.'
  if (!/^(\d{1,3}(,\d{3})*|\d+)(\.\d*)?$/.test(v)) return 'Commas must separate thousands, Example: 1,000 or 12,345.67.'
  return null
}