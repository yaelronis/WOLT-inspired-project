// @ts-check

// Checkout screen- reached from the restaurant screen's "Go to checkout" button.
// It reads the cart from the shared CartContext, shows an order summary,
// delivery details and fees, places the order (POST/orders), then clears the
// cart. After placing, "View order" reveals the full list of products ordered.
// Mirrors the web CheckoutPage feature for feature.

import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { usePendingOrder, CANCEL_WINDOW_MS } from "../context/PendingOrderContext";
import get_stylesheet from "../styles/CheckoutScreen.styles";

/**
 * @typedef {import("../context/CartContext").CartLine} CartLine
 */

/**
 * The order we snapshot at place-time so the success screen can show it after
 * the cart has been cleared.
 * @typedef {Object} PlacedOrder
 * @property {string} id
 * @property {string} restaurantName
 * @property {CartLine[]} items
 * @property {number} subtotal
 * @property {number} serviceFee
 * @property {number} total
 * @property {number} placedAt
 */

/**
 * The slice of the logged-in user we use for the delivery line.
 * @typedef {Object} DeliveryUser
 * @property {string} [name]
 * @property {{ lat: number, lng: number }} [location]
 */

// Display only fees (the server stores the product subtotal as the order total).
const DELIVERY_FEE = 15;

/** @param {number} n */
const shekel = (n) => `\u20AA${Number(n || 0).toFixed(2)}`;

export default function CheckoutScreen() {
  const colors = useTheme();
  const styles = get_stylesheet(colors);
  const router = useRouter();
  const { token, user } = useAuth();
  const {
    items,
    restaurantId,
    restaurantName,
    total: subtotal,
    clearCart,
  } = useCart();
  const { setPending, clearPending } = usePendingOrder();

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  // Snapshot of the placed order (kept after the cart is cleared) so we can show it.
  const [placed, setPlaced] = useState(
    /** @type {PlacedOrder | null} */ (null)
  );
  const [showOrder, setShowOrder] = useState(false);
  const [me, setMe] = useState(/** @type {DeliveryUser | null} */ (null));

  // Cancellation state for the success screen.
  const [cancelled, setCancelled] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  // Tick so the 15-minute window can close the button live.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!placed || cancelled) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [placed, cancelled]);

  // Load the logged in user's details (name + saved location) for delivery line.
  useEffect(() => {
    let active = true;
    if (user?.id) {
      api
        .getUser(user.id)
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => {
          if (active) setMe(u);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [user]);

  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + DELIVERY_FEE + serviceFee;

  async function placeOrder() {
    if (!token || items.length === 0) return;
    // content is a flat list of product ids- a quantity of 2 means the id appears twice.
    /** @type {number[]} */
    const content = [];
    for (const it of items) for (let i = 0; i < it.qty; i++) content.push(it.id);

    setPlacing(true);
    setError("");
    try {
      const res = await api.createOrder(
        { restaurant: restaurantId, content },
        token
      );
      if (res.ok) {
        //  The new order's id robustly:
        //  1) from the JSON body,
        //  2) from the Location header,
        //  3) as a fallback, read it back from this user's orders list.
        const data = await res.json().catch(() => null);
        let id =
          data && data.id != null
            ? String(data.id)
            : "";
        if (!id) {
          const loc =
            res.headers.get("Location") || res.headers.get("location") || "";
          id = loc.split("/").filter(Boolean).pop() || "";
        }
        if (!id) {
          try {
            const listRes = await api.getOrders(token);
            if (listRes.ok) {
              const list = await listRes.json();
              if (Array.isArray(list) && list.length) {
                // The order we just placed is the one with the highest id.
                id = String(
                  list.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a)).id
                );
              }
            }
          } catch {
            /* ignore - id stays empty, cancel button just won't be usable */
          }
        }
        const placedAt = Date.now();
        // Snapshot what was ordered before clearing the cart, so we can display it.
        setPlaced({
          id,
          restaurantName,
          items: items.map((it) => ({ ...it })),
          subtotal,
          serviceFee,
          total,
          placedAt,
        });
        // Remember it so the floating "cancel" button can follow the user for 15 min.
        if (id) setPending({ id, restaurantName, placedAt });
        clearCart();
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e.error || "Could not place the order.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPlacing(false);
    }
  }

  // Cancel the just placed order, if still within the 15 minute window.
  async function cancelOrder() {
    if (!placed || !token || cancelling) return;
    if (!placed.id) {
      setCancelError("Couldn't identify the order to cancel.");
      return;
    }
    if (Date.now() - placed.placedAt > CANCEL_WINDOW_MS) {
      setCancelError("cant cancel an order after 15 minutes");
      return;
    }
    setCancelling(true);
    setCancelError("");
    try {
      const res = await api.cancelOrder(placed.id, token);
      if (res.ok) {
        setCancelled(true);
        clearPending();
      } else {
        const e = await res.json().catch(() => ({}));
        setCancelError(e.error || "Could not cancel the order.");
      }
    } catch {
      setCancelError("Could not reach the server.");
    } finally {
      setCancelling(false);
    }
  }

  // success
  if (placed) {
    const windowOpen = !cancelled && now - placed.placedAt <= CANCEL_WINDOW_MS;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.successWrap}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Order placed!</Text>
          <Text style={styles.successText}>
            Your order
            {placed.restaurantName ? ` from ${placed.restaurantName}` : ""} is
            confirmed.
          </Text>
          <Text style={styles.orderNum}>
            Order #{placed.id}
            {cancelled ? " — Cancelled" : ""}
          </Text>

          {!cancelled ? (
            <Text style={styles.cancelNote}>
              You can cancel an order only within 15 minutes of ordering.
            </Text>
          ) : null}

          <View style={styles.successActions}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => setShowOrder((v) => !v)}
            >
              <Text style={styles.primaryBtnText} numberOfLines={1}>
                {showOrder ? "Hide order" : "View order"}
              </Text>
            </Pressable>
            {!cancelled ? (
              <Pressable
                style={[styles.cancelBtn, (!windowOpen || !placed.id) && styles.cancelBtnDisabled]}
                onPress={cancelOrder}
                disabled={cancelling || !windowOpen || !placed.id}
              >
                <Text style={styles.cancelBtnText} numberOfLines={1}>
                  {cancelling ? "Cancelling…" : "Cancel order"}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.secondaryBtnText} numberOfLines={1}>Back to home</Text>
            </Pressable>
          </View>

          {cancelled ? (
            <Text style={styles.cancelledMsg}>This order has been cancelled.</Text>
          ) : null}
          {!cancelled && !windowOpen ? (
            <Text style={styles.cancelExpired}>
              cant cancel an order after 15 minutes
            </Text>
          ) : null}
          {cancelError ? <Text style={styles.error}>{cancelError}</Text> : null}

          {showOrder ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Items in this order</Text>
              {placed.items.map((it) => (
                <View key={it.id} style={styles.item}>
                  {it.pic ? (
                    <Image source={{ uri: it.pic }} style={styles.itemPic} />
                  ) : (
                    <View style={[styles.itemPic, styles.itemPicEmpty]} />
                  )}
                  <Text style={styles.itemQty}>{it.qty}×</Text>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemPrice}>
                    {shekel(Number(it.price) * it.qty)}
                  </Text>
                </View>
              ))}
              <View style={styles.line}>
                <Text style={styles.lineLabel}>Subtotal</Text>
                <Text style={styles.lineValue}>{shekel(placed.subtotal)}</Text>
              </View>
              <View style={styles.line}>
                <Text style={styles.lineLabel}>Delivery fee</Text>
                <Text style={styles.lineValue}>{shekel(DELIVERY_FEE)}</Text>
              </View>
              <View style={styles.line}>
                <Text style={styles.lineLabel}>Service fee</Text>
                <Text style={styles.lineValue}>{shekel(placed.serviceFee)}</Text>
              </View>
              <View style={[styles.line, styles.totalLine]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{shekel(placed.total)}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // empty (cart cleared, or opened directly)
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.successText}>
            Add items from a restaurant to check out.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.primaryBtnText}>Browse restaurants</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // checkout
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          style={styles.back}
          onPress={() =>
            router.replace(
              restaurantId ? `/restaurants/${restaurantId}` : "/"
            )
          }
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Checkout</Text>
        {restaurantName ? (
          <Text style={styles.restaurantName}>{restaurantName}</Text>
        ) : null}

        {/* order summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your order</Text>
          {items.map((it) => (
            <View key={it.id} style={styles.item}>
              {it.pic ? (
                <Image source={{ uri: it.pic }} style={styles.itemPic} />
              ) : (
                <View style={[styles.itemPic, styles.itemPicEmpty]} />
              )}
              <Text style={styles.itemQty}>{it.qty}×</Text>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.itemPrice}>
                {shekel(Number(it.price) * it.qty)}
              </Text>
            </View>
          ))}
        </View>

        {/* delivery */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery</Text>
          <Text style={styles.deliverTo}>
            {me?.name ? me.name : "Your saved location"}
          </Text>
          {me?.location ? (
            <Text style={styles.coords}>
              {Number(me.location.lat).toFixed(4)},{" "}
              {Number(me.location.lng).toFixed(4)}
            </Text>
          ) : null}
          <Text style={styles.eta}>Estimated 40–50 min</Text>
        </View>

        {/* payment */}
        <View style={styles.card}>
          <View style={styles.line}>
            <Text style={styles.lineLabel}>Subtotal</Text>
            <Text style={styles.lineValue}>{shekel(subtotal)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.lineLabel}>Delivery fee</Text>
            <Text style={styles.lineValue}>{shekel(DELIVERY_FEE)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.lineLabel}>Service fee</Text>
            <Text style={styles.lineValue}>{shekel(serviceFee)}</Text>
          </View>
          <View style={[styles.line, styles.totalLine]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{shekel(total)}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.placeBtn, placing && styles.placeBtnDisabled]}
            disabled={placing}
            onPress={placeOrder}
          >
            {placing ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.placeBtnText}>
                Place order · {shekel(total)}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}