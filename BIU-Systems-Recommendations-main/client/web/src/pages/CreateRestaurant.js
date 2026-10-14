// @ts-check

// Restaurant creation page for a restaurant owner.
// Everything (profile+menu) is collected locally so the owner can move back
// and forth and edit/remove items freely.
// Nothing is sent until "Open restaurant"- we POST /restaurants to get an id, then POST each menu item to
// that restaurant.
// Rating is sent as 0.

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { validateLocation, validateProfilePic, validateName, validateAddress, validateDishName, validatePrice } from '../utils/validation'
// @ts-ignore
import '../styles/CreateRestaurant.css'

// The five fixed menu sections a product can belong to.
const MENU_SECTIONS = ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks']
const MAX_DESC = 160
const MAX_DISH_BYTES = 1024 * 1024 // 1MB for a dish photo.

/* small building blocks */

/** @param {{ step: number }} props */
function Stepper({ step }) {
  return (
    <div className="cr-stepper">
      <span className={'cr-step ' + (step > 1 ? 'done' : step === 1 ? 'active' : '')}>
        <span className="cr-num">{step > 1 ? <span className="cr-vimg" /> : '1'}</span> Profile
      </span>
      <span className="cr-bar" />
      <span className={'cr-step ' + (step === 2 ? 'active' : '')}>
        <span className="cr-num">2</span> Menu
      </span>
    </div>
  )
}

/**
 * Single select for the restaurant category.
 * @param {{ value: string, onChange: (v: string) => void, error?: boolean, categories: string[] }} props
 */
function CategorySelect({ value, onChange, error, categories }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cr-select">
      <button type="button" className={'cr-select-box' + (error ? ' cr-err-border' : '')} onClick={() => setOpen((o) => !o)}>
        {value || <span className="cr-placeholder">Choose a category</span>}
      </button>
      {open && (
        <div className="cr-pop" onMouseLeave={() => setOpen(false)}>
          {categories.map((c) => (
            <button type="button" key={c} className={'cr-opt' + (c === value ? ' selected' : '')} onClick={() => { onChange(c); setOpen(false) }}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Square image picker that returns a data URL. Optional validate(file) returns
 * an error string (or null). on error the file is rejected and reported.
 * @param {{ value: string, onChange: (dataUrl: string) => void, onError?: (msg: string) => void, validate?: (file: File) => (string | null), label: string }} props
 */
function ImagePicker({ value, onChange, onError, validate, label }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null))
  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validate ? validate(file) : null
    if (err) { onError?.(err); e.target.value = ''; return }
    onError?.('')
    const reader = new FileReader()
    reader.onload = () => onChange(/** @type {string} */ (reader.result))
    reader.readAsDataURL(file)
  }
  return (
    <>
      <button type="button" className="cr-image-pick" style={value ? { backgroundImage: `url(${value})` } : undefined} onClick={() => inputRef.current?.click()}>
        {!value && <span>{label}</span>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </>
  )
}

/**
 * Inline form for a single menu item. Pass "initial" to edit an existing one.
 * @param {{ initial?: { name: string, price: number, pic: string }, onSave: (item: { name: string, price: number, pic: string }) => void, onCancel: () => void }} props
 */
function MenuItemForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial ? initial.name : '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [pic, setPic] = useState(initial ? initial.pic : '')
  const [picError, setPicError] = useState('')
  const [touched, setTouched] = useState(false)

  // Validate live once the user has typed something, so invalid characters
  // surface immediately. the empty "required" message still waits for submit.
  const nameErr = (touched || name.trim() !== '') ? validateDishName(name) : null
  const priceErr = (touched || price.trim() !== '') ? validatePrice(price) : null

  function handleSave() {
    setTouched(true)
    if (validateDishName(name) || validatePrice(price)) return
    onSave({ name: name.trim(), price: Number(price.replace(/,/g, '')), pic })
  }

  return (
    <div className="cr-itemform">
      <div className="cr-itemform-top">
        <div className="cr-itemform-photo">
          <ImagePicker
            value={pic}
            onChange={setPic}
            onError={setPicError}
            validate={(file) => (file.size > MAX_DISH_BYTES ? 'Image must be 1MB or smaller.' : null)}
            label="Add photo"
          />
          <p className="cr-hint cr-hint-left">Dish photo: JPG/PNG, max 1MB.</p>
          {picError && <p className="cr-error">{picError}</p>}
        </div>
        <div className="cr-itemform-fields">
          <div className="cr-fieldgroup">
            <input type="text" className={'cr-input' + (nameErr ? ' cr-err-border' : '')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dish name" />
            <p className="cr-hint cr-hint-left">English letters, numbers and basic punctuation. 2-50 characters.</p>
            {nameErr && <p className="cr-error">{nameErr}</p>}
          </div>
          <div className="cr-fieldgroup">
            <div className="cr-price">
            <span className="cr-cur">{'\u20AA'}</span>
            <input type="text" inputMode="decimal" maxLength={10} className={'cr-input' + (priceErr ? ' cr-err-border' : '')} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </div>
            <p className="cr-hint cr-hint-left">Numbers only, Example: 49.90.</p>
            {priceErr && <p className="cr-error">{priceErr}</p>}
          </div>
        </div>
      </div>
      <div className="cr-itemform-actions">
        <button type="button" className="cr-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="cr-save" onClick={handleSave}>
          {initial ? 'Save changes' : 'Add item'}
        </button>
      </div>
    </div>
  )
}

/**
 * One menu section card- lists its items (each editable/removable)+ add form.
 * @param {{ name: string, items: any[], onAdd: (item: any) => void, onUpdate: (uid: number, item: any) => void, onDelete: (uid: number) => void }} props
 */
function CategoryCard({ name, items, onAdd, onUpdate, onDelete }) {
  // mode. null = list, add = adding a new item, a number = editing that uid.
  const [mode, setMode] = useState(/** @type {null | 'add' | number} */ (null))

  return (
    <div className="cr-cat">
      <div className="cr-cat-head">
        <h3>{name}</h3>
        <span className="cr-count">{items.length} item{items.length === 1 ? '' : 's'}</span>
      </div>

      {items.length > 0 && (
        <div className="cr-items">
          {items.map((it) => (
            mode === it.uid ? (
              <MenuItemForm key={it.uid} initial={it} onCancel={() => setMode(null)} onSave={(data) => { onUpdate(it.uid, data); setMode(null) }} />
            ) : (
              <div className="cr-item" key={it.uid}>
                <span className="cr-thumb" style={it.pic ? { backgroundImage: `url(${it.pic})` } : undefined} />
                <span className="cr-item-name">{it.name}</span>
                <span className="cr-item-price">{'\u20AA'}{it.price.toFixed(2)}</span>
                <button type="button" className="cr-link" onClick={() => setMode(it.uid)}>Edit</button>
                <button type="button" className="cr-link cr-link-danger" onClick={() => onDelete(it.uid)}>Delete</button>
              </div>
            )
          ))}
        </div>
      )}

      {mode === 'add' ? (
        <MenuItemForm onCancel={() => setMode(null)} onSave={(data) => { onAdd(data); setMode(null) }} />
      ) : (
        <div className="cr-add-row">
          <button type="button" className="cr-add-btn" onClick={() => setMode('add')}>+ Add menu item</button>
        </div>
      )}
    </div>
  )
}

/* page */

export default function CreateRestaurant() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [stage, setStage] = useState(/** @type {'welcome'|'profile'|'menu'|'done'} */ ('welcome'))

  const [form, setForm] = useState({
    name: '', address: '', coords: '', description: '', category: '',
    vegetarian: /** @type {boolean | null} */ (null), promoted: /** @type {boolean | null} */ (null), imgURL: '',
  })
  const [touched, setTouched] = useState(false)
  const [imgErr, setImgErr] = useState('')

  // Menu items grouped by section, each with a local uid.
  const [menu, setMenu] = useState(/** @type {Record<string, any[]>} */ (
    MENU_SECTIONS.reduce((o, s) => ({ ...o, [s]: [] }), {})
  ))
  const uidRef = useRef(1)

  // Final submit (don't duplicate anything).
  const [restaurantId, setRestaurantId] = useState(/** @type {number | null} */ (null))
  const savedUids = useRef(/** @type {Set<number>} */ (new Set()))
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Category options come from the API so the list has a single source of truth on the server.
  const [categories, setCategories] = useState(/** @type {string[]} */ ([]))
  useEffect(() => {
    let active = true
    api.getCategories()
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => { if (active) setCategories(Array.isArray(list) ? list : []) })
      .catch(() => { if (active) setCategories([]) })
    return () => { active = false }
  }, [])

  const descOver = form.description.length > MAX_DESC
  // Text fields validate live once the user has typed something, so invalid
  // characters surface immediately. the empty "required" message still waits
  // for Continue. Selection fields (picture, category, Yes/No) only have a
  // "required" state, so they stay gated to the Continue butten.
  const nameErr = (touched || form.name.trim() !== '') ? validateName(form.name) : null
  const addressErr = (touched || form.address.trim() !== '') ? validateAddress(form.address) : null
  const coordsErr = (touched || form.coords.trim() !== '') ? validateLocation(form.coords) : null
  const catErr = touched && !form.category
  const vegErr = touched && form.vegetarian === null ? 'Please choose Yes or No.' : null
  const promoErr = touched && form.promoted === null ? 'Please choose Yes or No.' : null

  /** @param {Partial<typeof form>} patch */
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  function continueToMenu() {
    setTouched(true)
    const imageError = form.imgURL ? '' : 'Please upload a restaurant picture.'
    setImgErr(imageError)
    if (validateName(form.name) || validateAddress(form.address) || validateLocation(form.coords) || !form.category || form.vegetarian === null || form.promoted === null || descOver || imageError) return
    setStage('menu')
  }

  /** @param {string} section @param {{ name: string, price: number, pic: string }} item */
  function addItem(section, item) {
    const uid = uidRef.current++
    setMenu((m) => ({ ...m, [section]: [...m[section], { uid, ...item }] }))
  }
  /** @param {string} section @param {number} uid @param {{ name: string, price: number, pic: string }} item */
  function updateItem(section, uid, item) {
    setMenu((m) => ({ ...m, [section]: m[section].map((i) => (i.uid === uid ? { ...i, ...item } : i)) }))
    savedUids.current.delete(uid)
  }
  /** @param {string} section @param {number} uid */
  function deleteItem(section, uid) {
    setMenu((m) => ({ ...m, [section]: m[section].filter((i) => i.uid !== uid) }))
    savedUids.current.delete(uid)
  }

  const totalItems = MENU_SECTIONS.reduce((n, s) => n + menu[s].length, 0)

  async function openRestaurant() {
    if (totalItems === 0) return
    setSubmitError('')
    setSubmitting(true)
    try {
      // Create the restaurant once.
      let id = restaurantId
      if (id == null) {
        const [latStr, lngStr] = form.coords.trim().split(/[\s,]+/)
        const res = await api.createRestaurant({
          name: form.name.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
          category: form.category,
          vegetarian: form.vegetarian,
          promoted: form.promoted,
          rating: 0, // new restaurants start at 0.
          imgURL: form.imgURL,
          location: { lat: parseFloat(latStr), lng: parseFloat(lngStr) },
        }, token)
        if (res.status === 401) { setSubmitError('Your session has expired. Please log in again.'); setSubmitting(false); return }
        if (!res.ok) { setSubmitError('Could not create the restaurant. Please check your details.'); setSubmitting(false); return }
        const created = await res.json()
        id = created.id
        setRestaurantId(id)
      }
      // Post every item that hasn't been saved yet.
      for (const section of MENU_SECTIONS) {
        for (const item of menu[section]) {
          if (savedUids.current.has(item.uid)) continue
          const res = await api.addProduct(String(id), { name: item.name, price: item.price, category: section, pic: item.pic }, token)
          if (!res.ok) { setSubmitError(`Could not save "${item.name}". Please try again.`); setSubmitting(false); return }
          savedUids.current.add(item.uid)
        }
      }
      setSubmitting(false)
      setStage('done')
    } catch {
      setSubmitError('Cannot reach the server. Check your connection.')
      setSubmitting(false)
    }
  }

  return (
    <div className="cr-wrap">
      <div className="cr-brand"><span className="cr-dot">{'\u25CF'}</span> Wolt Merchant</div>

      {stage === 'welcome' && (
        <div className="cr-card cr-center">
          <div className="cr-celebrate" />
          <h1 className="cr-h1">Welcome To Wolt Merchant!</h1>
          <p className="cr-sub">Your place is almost ready to take orders. Complete the steps below and we'll get you live.</p>
          <button className="cr-pink" onClick={() => setStage('profile')}>Start</button>
        </div>
      )}

      {stage === 'profile' && (
        <div className="cr-card">
          <button type="button" className="cr-back" onClick={() => setStage('welcome')}>{'\u2190'} Back</button>
          <Stepper step={1} />
          <h1 className="cr-h1">Set Up Your Restaurant</h1>
          <p className="cr-sub">Task 1- Enter your restaurant details.</p>

          <div className="cr-field">
            <label className="cr-label">Restaurant image</label>
            <ImagePicker value={form.imgURL} onChange={(v) => { update({ imgURL: v }); setImgErr('') }} onError={setImgErr} validate={validateProfilePic} label="Add photo" />
            <p className="cr-hint cr-hint-left">JPG or PNG only, max 2MB</p>
            {imgErr && <p className="cr-error">{imgErr}</p>}
          </div>

          <div className="cr-field">
            <label className="cr-label">Place name</label>
            <input type="text" maxLength={50} className={'cr-input' + (nameErr ? ' cr-err-border' : '')} value={form.name} onChange={(e) => update({ name: e.target.value })} />
            <p className="cr-hint cr-hint-left">{'English letters, numbers, spaces and & " \' - . (2-50 characters).'}</p>
            {nameErr && <p className="cr-error">{nameErr}</p>}
          </div>

          <div className="cr-field">
            <label className="cr-label">Address</label>
            <input type="text" className={'cr-input' + (addressErr ? ' cr-err-border' : '')} value={form.address} onChange={(e) => update({ address: e.target.value })} />

            <p className="cr-hint cr-hint-left">{'Letters, numbers, spaces and - . \\ / " \' , (up to 255 characters).'}</p>

            {addressErr && <p className="cr-error">{addressErr}</p>}
          </div>

          <div className="cr-field">
            <label className="cr-label">Location (coordinates)</label>
            <input type="text" className={'cr-input' + (coordsErr ? ' cr-err-border' : '')} value={form.coords} onChange={(e) => update({ coords: e.target.value })} />
            <p className="cr-hint cr-hint-left">Coordinates as lat, lng. Example: 32.0853, 34.7818</p>
            {coordsErr && <p className="cr-error">{coordsErr}</p>}
          </div>

          <div className="cr-field">
            <label className="cr-label">Category</label>
            <CategorySelect value={form.category} onChange={(v) => update({ category: v })} error={catErr} categories={categories} />
            <p className="cr-hint cr-hint-left">Pick the closest category.</p>
            {catErr && <p className="cr-error">Please choose a category.</p>}
          </div>

          <div className="cr-field">
            <label className="cr-label">Description</label>
            <textarea className={'cr-input cr-textarea' + (descOver ? ' cr-err-border' : '')} value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="A short description of your restaurant" />
            <p className="cr-hint cr-hint-left">Optional. Up to {MAX_DESC} characters.</p>
            <div className={'cr-counter' + (descOver ? ' over' : '')}>{form.description.length}/{MAX_DESC}</div>
            {descOver && <p className="cr-error">Description must be {MAX_DESC} characters or fewer.</p>}
          </div>

          <div className="cr-field">
            <label className="cr-label">Vegetarian-friendly</label>
            <div className="cr-toggle">
              <button type="button" className={form.vegetarian === true ? 'on' : ''} onClick={() => update({ vegetarian: true })}>Yes</button>
              <button type="button" className={form.vegetarian === false ? 'on' : ''} onClick={() => update({ vegetarian: false })}>No</button>
            </div>
            <p className="cr-hint cr-hint-left">Choose Yes or No.</p>
            {vegErr && <p className="cr-error">{vegErr}</p>}
          </div>

          <div className="cr-field">
            <label className="cr-label">Promotion</label>
            <div className="cr-toggle">
              <button type="button" className={form.promoted === true ? 'on' : ''} onClick={() => update({ promoted: true })}>Yes</button>
              <button type="button" className={form.promoted === false ? 'on' : ''} onClick={() => update({ promoted: false })}>No</button>
            </div>
            <p className="cr-hint cr-hint-left">Choose Yes or No.</p>
            {promoErr && <p className="cr-error">{promoErr}</p>}
          </div>

          <button className="cr-pink" onClick={continueToMenu}>Continue</button>
        </div>
      )}

      {stage === 'menu' && (
        <div className="cr-card">
          <button type="button" className="cr-back" onClick={() => setStage('profile')}>{'\u2190'} Back</button>
          <Stepper step={2} />
          <h1 className="cr-h1">Build Your Menu</h1>
          <p className="cr-sub">Task 2- Add dishes to each section. You can edit or remove any item.</p>

          {MENU_SECTIONS.map((s) => (
            <CategoryCard key={s} name={s} items={menu[s]} onAdd={(item) => addItem(s, item)} onUpdate={(uid, item) => updateItem(s, uid, item)} onDelete={(uid) => deleteItem(s, uid)} />
          ))}

          {submitError && <p className="cr-error cr-server" role="alert">{submitError}</p>}

          <button className="cr-pink" disabled={totalItems === 0 || submitting} onClick={openRestaurant}>
            {submitting ? 'Opening\u2026' : `Open restaurant${totalItems > 0 ? ` (${totalItems} items)` : ''}`}
          </button>
          {totalItems === 0 && <p className="cr-hint">Add at least one item to open your restaurant.</p>}
        </div>
      )}

      {stage === 'done' && (
        <div className="cr-card cr-center">
          <div className="cr-celebrate" />
          <h1 className="cr-h1">{form.name} is live!</h1>
          <p className="cr-sub">{form.category}{form.vegetarian ? ' \u00B7 Vegetarian-friendly' : ''}<br />{totalItems} menu items across {MENU_SECTIONS.length} sections.</p>
          <button className="cr-pink" onClick={() => navigate('/')}>Go to main page</button>
        </div>
      )}
    </div>
  )
}