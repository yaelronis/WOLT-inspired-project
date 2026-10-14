// @ts-check

// Tracks the most recently placed order so the 15 minute "cancel" affordance can
// follow the user across navigation. When an order is placed we remember its id,
// restaurant name and the moment it was placed. a floating button (rendered above
// the stack) then offers a quick way back to cancel it until the window closes.
// Persisted to AsyncStorage so it survives an app restart within the window.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

/**
 * @typedef {Object} PendingOrder
 * @property {string|number} id
 * @property {string} restaurantName
 * @property {number} placedAt - when the order was placed.
 */

/**
 * @typedef {Object} PendingOrderValue
 * @property {PendingOrder | null} pending
 * @property {(order: PendingOrder) => void} setPending
 * @property {() => void} clearPending
 */

// The cancel window- 15 minutes from when the order was placed.
export const CANCEL_WINDOW_MS = 15 * 60 * 1000;

const STORAGE_KEY = "pending_order";

const PendingOrderContext = createContext(
  /** @type {PendingOrderValue | null} */ (null)
);

/** @param {{ children: React.ReactNode }} props */
export function PendingOrderProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [pending, setPendingState] = useState(
    /** @type {PendingOrder | null} */ (null)
  );

  // Restore any in window pending order on mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          /** @type {PendingOrder} */
          const parsed = JSON.parse(raw);
          if (Date.now() - parsed.placedAt <= CANCEL_WINDOW_MS) {
            setPendingState(parsed);
          } else {
            AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          }
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setPending = useCallback((/** @type {PendingOrder} */ order) => {
    setPendingState(order);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(order)).catch(() => {});
  }, []);

  const clearPending = useCallback(() => {
    setPendingState(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  // A pending order belongs to one logged in user. Clear it whenever the user
  // actually changes so it never leaks. The first mount is skipped so a value
  // restored from storage survives an app restart.
  const prevUserId = useRef(userId);
  useEffect(() => {
    if (prevUserId.current !== userId) {
      prevUserId.current = userId;
      clearPending();
    }
  }, [userId, clearPending]);

  return (
    <PendingOrderContext.Provider value={{ pending, setPending, clearPending }}>
      {children}
    </PendingOrderContext.Provider>
  );
}

/** @returns {PendingOrderValue} */
export function usePendingOrder() {
  const ctx = useContext(PendingOrderContext);
  if (!ctx)
    throw new Error("usePendingOrder must be used inside a PendingOrderProvider");
  return ctx;
}
