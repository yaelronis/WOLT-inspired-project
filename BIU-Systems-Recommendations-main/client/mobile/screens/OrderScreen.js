// @ts-check
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button"

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePendingOrder, CANCEL_WINDOW_MS } from "../context/PendingOrderContext";
import { api } from "../utils/api";
import get_stylesheet from "../styles/OrderScreen.styles"
import BackButton from "../components/BackButton";
import { useCart } from "../context/CartContext";

/**
 * @typedef {import("../../../api/src/model/orders").Order} Order
 * @typedef {import("../../../api/src/model/restaurants").Restaurant} Restaurant
 * @typedef {import("../../../api/src/model/products").Product} Product
 * */

export default function OrderPage() {
    const { addItem, clearCart } = useCart();
    const theme = useTheme();
    const styles = get_stylesheet(theme);
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState(
        /**@type {Order | undefined} */(undefined)
    )
    const [products, setProducts] = useState(
        /** @type {Product[]} */([]));
    const [restaurant, setRestaurant] = useState(
         /**@type {Restaurant | undefined} */(undefined)
    );

    const { token, logout, isLoading } = useAuth();
    const { clearPending } = usePendingOrder();

    // Cancellation state.
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    /**
    * Loads the selected order by the order id from the URL.
    * After the order is loaded, fetches the restaurant details and the products
    * that belong to this order.
    */
    useEffect(() => {
        async function loadProducts() {
            if (isLoading) return;
            if (!token || !orderId) {
                router.replace("/")
                return;
            };

            const id = Number(orderId);
            if (!Number.isInteger(id)) {
                console.warn("The order id is not an integer")
                router.replace("/orders");
                return;
            }

            try {
                const orderRes = await api.getOrderById(id, token);

                if (orderRes.status === 401) {
                    logout();
                    router.replace("/login");
                    return;
                }

                if (orderRes.status !== 200) {
                    console.warn("Failed to load order");
                    return;
                }

                const orderData =
                /** @type {Order} */ (await orderRes.json());

                const restaurantsRes =
                    await api.getRestaurant(String(orderData.restaurant));

                if (restaurantsRes.status !== 200) {
                    console.warn("Failed to load restaurant");
                    return;
                }

                const restaurantData =
                /** @type {Restaurant} */ (await restaurantsRes.json());

                const productsResponses = await Promise.all(
                    orderData.content.map((productId) =>
                        api.getProductById(orderData.restaurant, productId)
                    )
                );

                const productsData = await Promise.all(
                    productsResponses.map(async (res, index) => {
                        if (res.status === 200) {
                            return await res.json();
                        }

                        return {
                            id: orderData.content[index],
                            name: "Item no longer available",
                            price: null,
                        };
                    })
                );

                setProducts(/**@type {Product[]}*/(productsData));
                setRestaurant(restaurantData);
                setOrder(orderData);

            } catch (err) {
                console.error("Failed loading order details", err);
            }
        }

        loadProducts();
    }, [token, orderId, logout, isLoading]);

    const handleBack = () => {
        router.replace('/profile')
    }

    const handleOrderAgain = () => {
        if (!order || !restaurant) return;
        const rid = Number(order.restaurant);
        // Rebuild the cart to match this order, then open the restaurant page.
        // products is in content order (duplicates included), so qty rebuilds itself.
        clearCart();
        for (const product of products) {
            // Skip items that are no longer available (nothing to re-add).
            if (product == null || product.price == null) continue;
            addItem(rid, restaurant.name, product);
        }
        router.push({
            pathname: `/restaurants/${rid}`,
            params: { from: `/orders/${orderId}` },
        })
    }

    const handleVisitRestaurant = () => {
        if (!order) return;
        router.push({
            pathname: `/restaurants/${Number(order.restaurant)}`,
            params: { from: `/orders/${orderId}` },
        })
    }

    // Parse "YYYY-MM-DD hh:mm" (local time) for the cancel window.
    const placedAtMs = order?.created_at
        ? new Date(order.created_at.replace(" ", "T")).getTime()
        : 0;
    const withinWindow = order != null && !order.cancelled && (now - placedAtMs) <= CANCEL_WINDOW_MS;

    const handleCancel = async () => {
        if (!order || !token || cancelling) return;
        if ((Date.now() - placedAtMs) > CANCEL_WINDOW_MS) {
            setCancelError("cant cancel an order after 15 minutes");
            return;
        }
        setCancelling(true);
        setCancelError("");
        try {
            const res = await api.cancelOrder(order.id, token);
            if (res.ok) {
                const updated = await res.json().catch(() => null);
                setOrder(updated || { ...order, cancelled: true });
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
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>

            <BackButton onPress={handleBack} />
            <ScrollView contentContainerStyle={styles.orderDetailContainer}>


                <View style={styles.upperpage}>
                    <View style={styles.orderBasicDataContainer}>
                        <Text style={styles.orderResName}>{restaurant?.name}</Text>
                        <Text style={styles.orderDataBasic}>{restaurant?.address}</Text>
                        <Text style={styles.orderDataBasic}>Order placed: {order?.created_at}</Text>
                        <Text style={styles.orderDataBasic}>
                            Order ID: {order?.id}{order?.cancelled ? " - Cancelled" : ""}
                        </Text>

                        {order?.cancelled ? (
                            <Text style={styles.orderCancelledTag}>This order has been cancelled.</Text>
                        ) : order ? (
                            <View style={styles.cancelArea}>
                                <Text style={styles.cancelNote}>
                                    You can cancel an order only within 15 minutes of ordering.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, !withinWindow && styles.cancelBtnDisabled]}
                                    onPress={handleCancel}
                                    disabled={cancelling || !withinWindow}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.cancelBtnText}>
                                        {cancelling ? "Cancelling…" : "Cancel order"}
                                    </Text>
                                </TouchableOpacity>
                                {!withinWindow ? (
                                    <Text style={styles.cancelExpired}>cant cancel an order after 15 minutes</Text>
                                ) : null}
                                {cancelError ? <Text style={styles.cancelErrorText}>{cancelError}</Text> : null}
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.orderAgainRestaurant}>
                        <Button style={styles.orderAgainButton} onPress={handleOrderAgain}>
                            <Text style={styles.orderAgainText}>Order again</Text>
                        </Button>
                        <Button style={styles.restaurantNavigationPage} onPress={handleVisitRestaurant}>
                            <Text style={styles.visitResText}>Visit restaurant</Text>
                        </Button>
                    </View>
                </View>

                <View style={styles.itemsOrderContainer}>
                    <Text style={styles.itemsText}>Items</Text>
                    <View style={styles.dataItems}>
                        {products.map((product, index) => (
                            <View style={styles.productsMapping} key={`${product.id}-${index}`}>
                                <Text style={styles.productName}>{product.name}</Text>
                                <Text style={styles.productPrice}>
                                    {product.price == null ? "—" : `₪${product.price}`}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.textTotalSum}>Total sum:</Text>
                        <Text style={styles.totalsum}>₪{order?.total}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    )
}