// @ts-check

// Floating "you can still cancel" button. After an order is placed, the user has
// 15 minutes to cancel it. If they leave the confirmation screen, this button
// follows them around (rendered above the stack) and takes them back to the order
// so they can cancel. It counts down and disappears once the window closes.

import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePendingOrder, CANCEL_WINDOW_MS } from "../context/PendingOrderContext";
import { useTheme } from "../context/ThemeContext";

/** @param {number} ms */
function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CancelWindowButton() {
  const { pending, clearPending } = usePendingOrder();
  const router = useRouter();
  useTheme();
  const [now, setNow] = useState(Date.now());

  const remaining = pending ? CANCEL_WINDOW_MS - (now - pending.placedAt) : 0;
  const expired = pending != null && remaining <= 0;

  // Tick once a second so the countdown stays live and the button can retire
  // itself the moment the window closes.
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pending]);

  // When the window closes, drop the pending order- but do it after render (in an
  // effect), never during render, or React warns about setState in render.
  useEffect(() => {
    if (expired) clearPending();
  }, [expired, clearPending]);

  if (!pending || expired) return null;

  return (
    <Pressable
      onPress={() => router.push(`/orders/${pending.id}`)}
      style={{
        position: "absolute",
        right: 16,
        bottom: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#e23744",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        zIndex: 1000,
      }}
    >
      <Text style={{ fontSize: 18, color: "#fff" }}>⏱</Text>
      <View>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
          Cancel order?
        </Text>
        <Text style={{ color: "#fff", opacity: 0.9, fontSize: 12 }}>
          {formatRemaining(remaining)} left
        </Text>
      </View>
    </Pressable>
  );
}
