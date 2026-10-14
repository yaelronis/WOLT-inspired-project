// @ts-check

// Central place for all API calls to the EX3 server.
// It serves the built React app and exposes the REST API under /api. 
// Every authenticated request sends the JWT as an Authorization: Bearer header.

const BASE = '/api'

/**
 * Thin wrapper around fetch. set JSON headers, attach the JWT, and serialize the body. 
 * It returns the raw Response- the caller checks res.ok/res.status and calls res.json()
 * itself when it expects a body.
 *
 * @param {string} method
 * @param {string} path
 * @param {unknown} [body]
 * @param {string | null} [token]
 * @returns {Promise<Response>}
 */
function request(method, path, body = null, token = null) {
  /** @type {Record<string, string>} */
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

export const api = {
  // Auth.
  /** @param {string?} token */
  affirmjwt: (token) => request('POST', '/tokens/jwt', null, token),
  /** @param {object} userData */
  register: (userData) => request('POST', '/users', userData),
  /** @param {object} credentials */
  login: (credentials) => request('POST', '/tokens', credentials),
  // Read a user (public GET)- used to learn the logged in user's role.
  /** @param {string | number} id */
  getUser: (id) => request('GET', `/users/${id}`),

  // Restaurants. GET routes are public (no requireAuth), so no token is sent.
  getRestaurants: () => request('GET', '/restaurants'),
  // Public list of allowed restaurant categories- single source of truth on the server.
  getCategories: () => request('GET', '/restaurants/categories'),
  /** @param {string} id */
  getRestaurant: (id) => request('GET', `/restaurants/${id}`),
  // Creating a restaurant is behind requireAuth, so the token is required.
  /** @param {object} data @param {string | null} token */
  createRestaurant: (data, token) => request('POST', '/restaurants', data, token),
  // Deleting a restaurant is behind requireAuth (owner only on the server).
  /** @param {string | number} id @param {string | null} token */
  deleteRestaurant: (id, token) => request('DELETE', `/restaurants/${id}`, null, token),

  // Products. GET routes are public (no requireAuth), so no token is sent.
  /** @param {string} restaurantId */
  getProducts: (restaurantId) =>
    request('GET', `/restaurants/${restaurantId}/products`),
  // Adding a product is behind requireAuth, so the token is required.
  /** @param {string} restaurantId @param {object} data @param {string | null} token */
  addProduct: (restaurantId, data, token) =>
    request('POST', `/restaurants/${restaurantId}/products`, data, token),
  // Deleting a product is behind requireAuth, so the token is required.
  /** @param {string} restaurantId @param {string} productId @param {string | null} token */
  deleteProduct: (restaurantId, productId, token) =>
    request('DELETE', `/restaurants/${restaurantId}/products/${productId}`, null, token),
  // Read one product (public GET).
  /** @param {string | number} restaurantId @param {string | number} id */
  getProductById: (restaurantId, id) =>
    request('GET', `/restaurants/${restaurantId}/products/${id}`),

  // Orders. Every order route is behind requireAuth, so the token is required.
  /** @param {string} token */
  getOrders: (token) => request('GET', '/orders', null, token),
  /** @param {string | number} id @param {string} token */
  getOrderById: (id, token) => request('GET', `/orders/${id}`, null, token),
  /** @param {object} orderData @param {string} token */
  createOrder: (orderData, token) => request('POST', '/orders', orderData, token),
  // Cancel an order: reuses the existing PATCH /orders/:id route (no new route).
  // The server keeps it in history, marked cancelled, only within 15 min (owner only).
  /** @param {string | number} id @param {string} token */
  cancelOrder: (id, token) => request('PATCH', `/orders/${id}`, { cancelled: true }, token),

  // Search. Public route (no requireAuth), so no token is sent.
  /** @param {string} query */
  search: (query) =>
    request('GET', `/search/${encodeURIComponent(query)}`),
}