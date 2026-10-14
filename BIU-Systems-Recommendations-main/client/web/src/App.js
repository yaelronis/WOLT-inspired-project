// @ts-check

// Root component. Sets up routing and wraps everything in AuthProvider.
// Routes:
//   /login    = public only (redirects to / if already logged in).
//   /register = public only (redirects to / if already logged in).
//   /         = public (main page is reachable for everyone).
//   /restaurants/new = owner-only (logged in and role "owner"). the restaurant creation page.

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AllOrderPage from './pages/AllOrderPage'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import CreateRestaurant from './pages/CreateRestaurant'
import OrderPage from './pages/OrderPage'
import RestaurantPage from './pages/Restaurantpage'
// @ts-ignore
import CheckoutPage from './pages/Checkoutpage'
import { CartProvider } from './context/Cartcontext'
import { PendingOrderProvider } from './context/PendingOrderContext'


// Wraps protected pages- redirects to /login if user has no token.
// Reserved for user specific pages- added in their own tickets.
/** @param {{ children: any }} props */
function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

// Wraps public pages (login/register). Once logged in, send the user on:
// a restaurant owner goes to create their restaurant, everyone else to the main page.
// Role is known immediately after registering as an owner, so this also
// guarantees the post registration redirect can't be overridden back to "/".
/** @param {{ children: any }} props */
function PublicRoute({ children }) {
  const { token, user } = useAuth()
  if (!token) return children
  return <Navigate to={user?.role === 'owner' ? '/restaurants/new' : '/'} replace />
}

// Owner only pages- must be logged in (ProtectedRoute) and have the "owner" role.
// role can be briefly undefined right after login while it is being fetched.
/** @param {{ children: any }} props */
function OwnerRoute({ children }) {
  const { user } = useAuth()
  return (
    <ProtectedRoute>
      {user && user.role === undefined
        ? <div style={{ padding: 40, textAlign: 'center' }}>Checking access…</div>
        : user && user.role === 'owner'
          ? children
          : <Navigate to="/" replace />}
    </ProtectedRoute>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      {/* Owner-only- create a restaurant (must be logged in and role "owner"). */}
      <Route path="/restaurants/new" element={<OwnerRoute><CreateRestaurant /></OwnerRoute>} />
      {/* Public- a restaurant's menu screen. */}
      <Route path="/restaurants/:id" element={<RestaurantPage />} />
      {/* Protected- checkout reads the shared cart and places the order. */}
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      {/* Public- the main page must be accessible without logging in. */}
      <Route path="/orders" element={<ProtectedRoute><AllOrderPage /></ProtectedRoute>} />
      <Route path='/orders/:orderId' element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
      <Route path='/' element={<HomePage />} />
      <Route path="/restaurants/category/:pageType" element={<CategoryPage />} />
      <Route path="/search/:query" element={<SearchPage />} />
      {/* Any unknown path goes to the main page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <PendingOrderProvider>
          <AppRoutes />
        </PendingOrderProvider>
      </CartProvider>
    </AuthProvider>
  )
}