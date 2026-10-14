// @ts-check

// Shared shopping cart, ported from the web client so the mobile restaurant
// screen behaves identically. It lives above the routes (in _layout) so it
// survives navigation, holds one restaurant at a time (like Wolt), and is
// cleared explicitly after a successful order or when the user changes.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";

/**
 * A single line in the cart: one product plus how many of it were added.
 * @typedef {Object} CartLine
 * @property {number} id
 * @property {string} name
 * @property {number} price
 * @property {string} [pic]
 * @property {number} qty
 */

/**
 * The minimal product shape needed to add something to the cart. Matches the
 * Product model, but "price" may arrive as a string from a form/input.
 * @typedef {Object} CartProductInput
 * @property {number} id
 * @property {string} name
 * @property {number | string} price
 * @property {string} [pic]
 */

/**
 * Internal cart state: which restaurant the cart belongs to and its lines,
 * keyed by product id.
 * @typedef {Object} CartState
 * @property {number | null} restaurantId
 * @property {string} restaurantName
 * @property {Record<string, CartLine>} lines
 */

/**
 * The value exposed to consumers with useCart().
 * @typedef {Object} CartValue
 * @property {number | null} restaurantId
 * @property {string} restaurantName
 * @property {CartLine[]} items
 * @property {number} count
 * @property {number} total
 * @property {(id: number | string) => number} qtyOf
 * @property {(rid: number) => boolean} belongsTo
 * @property {(restaurantId: number, restaurantName: string, product: CartProductInput) => void} addItem
 * @property {(id: number | string) => void} decItem
 * @property {() => void} clearCart
 */

const CartContext = createContext(/** @type {CartValue | null} */ (null));

/** @returns {CartState} */
const emptyCart = () => ({
  restaurantId: null,
  restaurantName: "",
  lines: {},
});

/** @param {{ children: React.ReactNode }} props */
export function CartProvider({ children }) {
  // The logged-in user. CartProvider must be inside AuthProvider for this to work.
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [cart, setCart] = useState(emptyCart);

  // The cart belongs to one logged in user. Whenever the user changes- logging
  // in, logging out, or switching accounts- start fresh so a cart never leaks
  // to another user.
  useEffect(() => {
    setCart(emptyCart());
  }, [userId]);

  // Add one of a product. Adding from a different restaurant starts a fresh cart.
  const addItem = useCallback(
    (
      /** @type {number} */ restaurantId,
      /** @type {string} */ restaurantName,
      /** @type {CartProductInput} */ product
    ) => {
      setCart((c) => {
        /** @type {Record<string, CartLine>} */
        const lines = c.restaurantId === restaurantId ? { ...c.lines } : {};
        const ex = lines[product.id];
        lines[product.id] = ex
          ? { ...ex, qty: ex.qty + 1 }
          : {
              id: product.id,
              name: product.name,
              price: Number(product.price),
              pic: product.pic,
              qty: 1,
            };
        return { restaurantId, restaurantName: restaurantName || "", lines };
      });
    },
    []
  );

  // Remove one of a product (drops the line when it hits zero).
  const decItem = useCallback((/** @type {number | string} */ id) => {
    setCart((c) => {
      const lines = { ...c.lines };
      const ex = lines[id];
      if (!ex) return c;
      if (ex.qty <= 1) delete lines[id];
      else lines[id] = { ...ex, qty: ex.qty - 1 };
      return { ...c, lines };
    });
  }, []);

  const clearCart = useCallback(() => setCart(emptyCart()), []);

  /** @type {CartValue} */
  const value = useMemo(() => {
    const items = Object.values(cart.lines);
    return {
      restaurantId: cart.restaurantId,
      restaurantName: cart.restaurantName,
      items,
      count: items.reduce((s, l) => s + l.qty, 0),
      total: items.reduce((s, l) => s + l.price * l.qty, 0),
      qtyOf: (id) => cart.lines[id]?.qty || 0,
      belongsTo: (rid) => cart.restaurantId === rid,
      addItem,
      decItem,
      clearCart,
    };
  }, [cart, addItem, decItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** @returns {CartValue} */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}