// @ts-check

// Restaurant screen- reached from a restaurant card on the main page (/restaurants/:id).
// Shows the five fixed menu sections with their products. An OWNER can add/delete
// products. a regular user adds items to a cart and checks out (POST /orders).

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/Cartcontext'
import { validateDishName, validatePrice } from '../utils/validation'
import Navbar from '../components/NavBar/navBar'
// @ts-ignore
import '../styles/Restaurantpage.css'

// The five fixed sections, shown in this order (must match the product categories).
const SECTIONS = ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks']

/** @param {number} n */
const shekel = (n) => `\u20AA${Number(n || 0).toFixed(2)}`

/**
 * Owner only inline form to add a product to one section.
 * @param {{ section: string, onAdd: (data: { name: string, price: number, category: string, pic: string }) => Promise<boolean>, onCancel: () => void }} props
 */
function AddProductForm({ section, onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [pic, setPic] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)

  // Reuse the shared validators (the same ones the create restaurant menu uses).
  const nameErr = (touched || name.trim() !== '') ? validateDishName(name) : null
  const priceErr = (touched || price.trim() !== '') ? validatePrice(price) : null

  /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
  function onPic(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPic(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  async function submit() {
    setTouched(true)
    if (validateDishName(name) || validatePrice(price)) return
    setBusy(true)
    const ok = await onAdd({
      name: name.trim(),
      price: Number(price.replace(/,/g, '')),
      category: section,
      pic,
    })
    setBusy(false)
    if (ok) { setName(''); setPrice(''); setPic('') }
  }

  return (
    <div className="rp-addform">
      <div className="rp-addform-row">
        <div className="rp-fieldgroup">
          <input className="rp-input" placeholder="Dish name" value={name}
                 onChange={(e) => setName(e.target.value)} />
          {nameErr && <p className="rp-err">{nameErr}</p>}
        </div>
        <div className="rp-fieldgroup">
          <div className="rp-price">
            <span className="rp-cur">{'\u20AA'}</span>
            <input className="rp-input rp-price-input" placeholder="0.00" value={price}
                   inputMode="decimal" onChange={(e) => setPrice(e.target.value)} />
          </div>
          {priceErr && <p className="rp-err">{priceErr}</p>}
        </div>
      </div>
      <label className="rp-photo-label">
        {pic ? 'Photo selected \u2713' : 'Add photo (optional)'}
        <input type="file" accept="image/png,image/jpeg" hidden onChange={onPic} />
      </label>
      <div className="rp-addform-actions">
        <button className="rp-ghost" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="rp-save" type="button" onClick={submit} disabled={busy}>
          {busy ? 'Adding\u2026' : 'Add product'}
        </button>
      </div>
    </div>
  )
}

export default function RestaurantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [restaurant, setRestaurant] = useState(/** @type {any} */ (null))
  const [products, setProducts] = useState(/** @type {any[]} */ ([]))
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Shared cart (persists across navigation), scoped to one restaurant at a time.
  const ridNum = Number(id)
  const { addItem, decItem, qtyOf, belongsTo, items: allCartItems } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [addingIn, setAddingIn] = useState(/** @type {string | null} */ (null))
  const [detailProduct, setDetailProduct] = useState(/** @type {any} */ (null))

  // Owner controls show only to the owner who created this restaurant
  // (the server stamps "owner" with the creator's user id on create).
  const isOwner =
    user?.role === 'owner' && restaurant != null && Number(restaurant.owner) === Number(user?.id)

  const reloadProducts = useCallback(() => {
    api.getProducts(String(id))
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setProducts(Array.isArray(list) ? list : []))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    let active = true
    setLoading(true); setLoadError('')
    Promise.all([
      api.getRestaurant(String(id)).then((r) => (r.ok ? r.json() : null)),
      api.getProducts(String(id)).then((r) => (r.ok ? r.json() : [])),
    ]).then(([rest, prods]) => {
      if (!active) return
      if (!rest) setLoadError('Restaurant not found.')
      else { setRestaurant(rest); setProducts(Array.isArray(prods) ? prods : []) }
      setLoading(false)
    }).catch(() => { if (active) { setLoadError('Could not load this restaurant.'); setLoading(false) } })
    return () => { active = false }
  }, [id])

  // cart helpers (backed by the shared CartContext)
  // Only this restaurant's items show here- the cart holds one restaurant at a time.
  const cartLines = belongsTo(ridNum) ? allCartItems : []
  const cartCount = cartLines.reduce((/** @type {number} */ s, /** @type {any} */ l) => s + l.qty, 0)
  const cartTotal = cartLines.reduce((/** @type {number} */ s, /** @type {any} */ l) => s + Number(l.price) * l.qty, 0)
  const addToCart = (/** @type {any} */ product) => addItem(ridNum, restaurant?.name, product)

  // "Go to checkout"- the checkout page reads the cart straight from context.
  function goToCheckout() {
    if (!token) { navigate('/login'); return }
    if (cartLines.length === 0) return
    navigate('/checkout')
  }

  // owner actions
  /** @param {{ name: string, price: number, category: string, pic: string }} data */
  async function addProduct(data) {
    if (!token) return false
    try {
      const res = await api.addProduct(String(id), data, token)
      if (res.ok) { reloadProducts(); setAddingIn(null); return true }
    } catch { /* ignore */ }
    return false
  }
  /** @param {string | number} pid */
  async function removeProduct(pid) {
    if (!token) return
    try {
      const res = await api.deleteProduct(String(id), String(pid), token)
      if (res.ok || res.status === 204) reloadProducts()
    } catch { /* ignore */ }
  }

  // Owner only- delete the whole restaurant (and all its products), then go home page.
  async function deleteRestaurant() {
    if (!token) return
    try {
      const res = await api.deleteRestaurant(Number(id), token)
      if (res.ok || res.status === 204) {
        navigate('/')
      }
    } catch {
      /* ignore */
    }
  }

  if (loading) return <><Navbar /><div className="rp-wrap"><p className="rp-state">Loading{'\u2026'}</p></div></>
  if (loadError) return <><Navbar /><div className="rp-wrap"><p className="rp-state">{loadError}</p></div></>

  const grouped = SECTIONS.map((s) => ({ section: s, items: products.filter((p) => p.category === s) }))
  const recommended = products.filter((p) => !qtyOf(p.id)).slice(0, 4)
  // "Often bought with" = other items from this menu (shown inside the product modal).
  const oftenBought = detailProduct ? products.filter((p) => p.id !== detailProduct.id).slice(0, 4) : []

  return (
    <>
      <Navbar />
      <div className="rp">
      {/* hero header (blurred cover + restaurant logo + name) */}
      <header className="rp-hero">
        <div
          className="rp-hero-bg"
          style={restaurant.imgURL ? { backgroundImage: `url(${restaurant.imgURL})` } : undefined}
        />
        <div className="rp-hero-inner">
          <div
            className="rp-avatar"
            style={restaurant.imgURL ? { backgroundImage: `url(${restaurant.imgURL})` } : undefined}
          >
            {!restaurant.imgURL && (
              <span className="rp-avatar-initial">{(restaurant.name || '?').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="rp-head-text">
            <h1 className="rp-title">{restaurant.name}</h1>
            {restaurant.description && <p className="rp-subtitle">{restaurant.description}</p>}
            <div className="rp-info">
              {typeof restaurant.rating === 'number' && <span>{'\u2605'} {restaurant.rating}</span>}
              {restaurant.category && <span>{restaurant.category}</span>}
              {restaurant.address && <span>{restaurant.address}</span>}
            </div>
            {isOwner && (
              <button className="rp-delete-restaurant" type="button" onClick={deleteRestaurant}>
                {'\u00D7'} Delete restaurant
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="rp-wrap">
        {grouped.map(({ section, items }) => {
          if (items.length === 0 && !isOwner) return null
          return (
            <section key={section} className="rp-section">
              <div className="rp-section-head">
                <h2>{section}</h2>
                {isOwner && addingIn !== section && (
                  <button className="rp-link" onClick={() => setAddingIn(section)}>+ Add product</button>
                )}
              </div>

              {isOwner && addingIn === section && (
                <AddProductForm section={section} onAdd={addProduct} onCancel={() => setAddingIn(null)} />
              )}

              {items.length === 0 ? (
                <p className="rp-empty">No items in this section yet.</p>
              ) : (
                <div className="rp-grid">
                  {items.map((p) => (
                    <article
                      key={p.id}
                      className="rp-card"
                      onClick={() => setDetailProduct(p)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="rp-card-body">
                        <h3 className="rp-card-name">{p.name}</h3>
                        <span className="rp-card-price">{shekel(p.price)}</span>
                      </div>
                      <div
                        className="rp-card-pic"
                        style={p.pic ? { backgroundImage: `url(${p.pic})` } : undefined}
                      >
                        {isOwner ? (
                          <button className="rp-del" title="Delete product" onClick={(e) => { e.stopPropagation(); removeProduct(p.id) }}>
                            {'\u00D7'}
                          </button>
                        ) : qtyOf(p.id) ? (
                          <div className="rp-card-stepper" onClick={(e) => e.stopPropagation()}>
                            <button title="Remove one" onClick={(e) => { e.stopPropagation(); decItem(p.id) }}>{'\u2212'}</button>
                            <span>{qtyOf(p.id)}</span>
                            <button title="Add one" onClick={(e) => { e.stopPropagation(); addToCart(p) }}>+</button>
                          </div>
                        ) : (
                          <button
                            className="rp-add"
                            title="Add to order"
                            onClick={(e) => { e.stopPropagation(); addToCart(p) }}
                          >
                            +
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* customer cart bar */}
      {!isOwner && cartCount > 0 && !cartOpen && (
        <button className="rp-cartbar" onClick={() => setCartOpen(true)}>
          <span className="rp-cartbar-badge">{cartCount}</span>
          <span>View order</span>
          <span className="rp-cartbar-total">{shekel(cartTotal)}</span>
        </button>
      )}

      {/* slide-in "Your order" panel */}
      {!isOwner && cartOpen && (
        <>
          <div className="rp-overlay" onClick={() => setCartOpen(false)} />
          <aside className="rp-panel" role="dialog" aria-label="Your order">
            <div className="rp-panel-head">
              <h2>Your order</h2>
              <button className="rp-close" onClick={() => setCartOpen(false)} aria-label="Close">{'\u00D7'}</button>
            </div>

            {cartLines.length === 0 ? (
              <p className="rp-empty">Your order is empty.</p>
            ) : (
              <div className="rp-panel-items">
                {cartLines.map((/** @type {any} */ line) => (
                  <div key={line.id} className="rp-line">
                    <div
                      className="rp-line-pic"
                      style={line.pic ? { backgroundImage: `url(${line.pic})` } : undefined}
                    />
                    <div className="rp-line-info">
                      <span className="rp-line-name">{line.name}</span>
                      <span className="rp-line-price">{shekel(line.price)}</span>
                    </div>
                    <div className="rp-stepper">
                      <button onClick={() => decItem(line.id)} aria-label="Remove one">{'\u2212'}</button>
                      <span>{line.qty}</span>
                      <button onClick={() => addToCart(line)} aria-label="Add one">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recommended.length > 0 && (
              <div className="rp-reco">
                <h3 className="rp-reco-title">Recommended for you</h3>
                <div className="rp-reco-grid">
                  {recommended.map((p) => (
                    <div key={p.id} className="rp-reco-card">
                      <div
                        className="rp-reco-pic"
                        style={p.pic ? { backgroundImage: `url(${p.pic})` } : undefined}
                      >
                        <button className="rp-reco-add" title="Add to order" onClick={() => addToCart(p)}>+</button>
                      </div>
                      <span className="rp-reco-name">{p.name}</span>
                      <span className="rp-reco-price">{shekel(p.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rp-panel-foot">
              <div className="rp-subtotal"><span>Subtotal</span><span>{shekel(cartTotal)}</span></div>
              <button className="rp-checkout" disabled={cartLines.length === 0} onClick={goToCheckout}>
                {token ? 'Go to checkout' : 'Log in to order'} {'\u00B7'} {shekel(cartTotal)}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* product detail modal (opens in the middle of the screen) */}
      {detailProduct && (
        <>
          <div className="rp-overlay" onClick={() => setDetailProduct(null)} />
          <div className="rp-modal" role="dialog" aria-label={detailProduct.name}>
            <button className="rp-modal-close" onClick={() => setDetailProduct(null)} aria-label="Close">{'\u00D7'}</button>
            <div
              className="rp-modal-pic"
              style={detailProduct.pic ? { backgroundImage: `url(${detailProduct.pic})` } : undefined}
            />
            <div className="rp-modal-body">
              <h2 className="rp-modal-name">{detailProduct.name}</h2>
              {detailProduct.category && <span className="rp-modal-cat">{detailProduct.category}</span>}
              {detailProduct.description && <p className="rp-modal-desc">{detailProduct.description}</p>}
              <div className="rp-modal-price">{shekel(detailProduct.price)}</div>

              {!isOwner && (
                qtyOf(detailProduct.id) ? (
                  <div className="rp-modal-stepper">
                    <button onClick={() => decItem(detailProduct.id)} aria-label="Remove one">{'\u2212'}</button>
                    <span>{qtyOf(detailProduct.id)}</span>
                    <button onClick={() => addToCart(detailProduct)} aria-label="Add one">+</button>
                  </div>
                ) : (
                  <button
                    className="rp-modal-add"
                    onClick={() => { addToCart(detailProduct); setDetailProduct(null) }}
                  >
                    Add to order {'\u00B7'} {shekel(detailProduct.price)}
                  </button>
                )
              )}

              {oftenBought.length > 0 && (
                <div className="rp-often">
                  <h3 className="rp-often-title">Often bought with</h3>
                  <div className="rp-often-grid">
                    {oftenBought.map((op) => (
                      <div key={op.id} className="rp-often-card" onClick={() => setDetailProduct(op)}>
                        <div
                          className="rp-often-pic"
                          style={op.pic ? { backgroundImage: `url(${op.pic})` } : undefined}
                        >
                          {!isOwner && (
                            <button
                              className="rp-often-add"
                              title="Add to order"
                              onClick={(e) => { e.stopPropagation(); addToCart(op) }}
                            >+</button>
                          )}
                        </div>
                        <span className="rp-often-name">{op.name}</span>
                        <span className="rp-often-price">{shekel(op.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      </div>
    </>
  )
}