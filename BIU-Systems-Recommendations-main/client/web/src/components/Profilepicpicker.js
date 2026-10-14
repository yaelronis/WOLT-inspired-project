// @ts-check

import { useRef, useState } from 'react'
import { validateProfilePic } from '../utils/validation'
// component styles
// @ts-ignore
import '../styles/Profilepicpicker.css'

/**
 * Circular profile-picture picker with preview, hint and remove button.
 * This component owns everything about choosing a profile picture: the hidden
 * file input and its ref, type/size validation, the preview URL and the
 * FileReader that turns the file into a data URL. The parent only receives the
 * final image (a data URL string, or null when cleared) through onChange and
 * passes back a submit-time "required" error through the error prop.
 *
 * @param {object} props
 * @param {string | null} props.value
 * @param {(image: string | null) => void} props.onChange
 * @param {string} [props.error]
 */
export default function Profilepicpicker({ value, onChange, error }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [preview, setPreview] = useState(/** @type {string | null} */ (null))
  const [localError, setLocalError] = useState('')

  const open = () => inputRef.current?.click()

  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    setLocalError('')
    if (!file) return

    // Validate type/size before doing anything with the file.
    const err = validateProfilePic(file)
    if (err) {
      setLocalError(err)
      if (inputRef.current) inputRef.current.value = ''
      setPreview(null)
      onChange(null)
      return
    }

    // Show an instant preview, then read the file into a data URL for the payload.
    setPreview(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => onChange(/** @type {string} */ (reader.result))
    reader.readAsDataURL(file)
  }

  function handleRemove() {
    setPreview(null)
    setLocalError('')
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }

  // The parent's required-error wins. otherwise show our own validation error.
  const shownError = error || localError
  const hasError = !!shownError

  return (
    <div className="auth-field">
      <label className="auth-field-label">Profile picture</label>

      <div className={hasError ? 'profile-pic-section profile-pic-section--error' : 'profile-pic-section'}>
        <div
          className={hasError ? 'profile-pic-picker profile-pic-picker--error' : 'profile-pic-picker'}
          onClick={open}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && open()}
          aria-label="Upload profile picture"
        >
          {preview ? (
            <img src={preview} alt="Profile preview" className="profile-pic-preview" />
          ) : (
            <div className="profile-pic-placeholder">
              <span>Add photo</span>
            </div>
          )}
        </div>

        <div className="profile-pic-info">
          <p className="profile-pic-hint">JPG or PNG only, max 2MB</p>
          {(preview || value) && (
            <button type="button" className="profile-pic-remove" onClick={handleRemove}>
              Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={handleFileChange}
          hidden
          aria-hidden="true"
        />
      </div>

      {hasError && <p className="auth-field-error">{shownError}</p>}
    </div>
  )
}