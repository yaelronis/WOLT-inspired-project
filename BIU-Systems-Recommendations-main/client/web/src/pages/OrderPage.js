// @ts-check
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "../layouts/PageLayout"
//@ts-ignore
import '../styles/OrderPage.css'

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { useCart } from "../context/Cartcontext";
import { usePendingOrder, CANCEL_WINDOW_MS } from "../context/PendingOrderContext";

/**
 *  @typedef {import("../../../../api/src/model/orders").Order} Order
 * @typedef {import("../../../../api/src/model/restaurants").Restaurant} Restaurant
 *  @typedef {import("../../../../api/src/model/products").Product} Product
 * 
 */

export default function OrderPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(
        /**@type {Order | undefined} */(undefined)
    )
    const [products, setProducts] = useState(
        /** @type {Product[]} */([]));
    const [restaurant, setRestaurant] = useState(
         /**@type {Restaurant | undefined} */(undefined)
    );

    const { token, logout } = useAuth();
    const { addItem, clearCart } = useCart();
    const { clearPending } = usePendingOrder();

    // Cancellation state.
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");
    // Tick so the 15-minute window can close the button live.
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
            if (!token || !orderId) return;

            const id = Number(orderId);
            if (!Number.isInteger(id)) {
                console.warn("The order id is not an integer")
                navigate("/orders");
                return;
            }

            try {
                const orderRes = await api.getOrderById(id, token);

                if (orderRes.status === 401) {
                    logout();
                    navigate("/login");
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
    }, [token, orderId, logout, navigate]);

    const handleBack = () => {
        navigate('/orders')
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
        navigate(`/restaurants/${rid}`);
    }

    const handleVisitRestaurant = () => {
        if (!order) return;
        navigate(`/restaurants/${Number(order.restaurant)}`);
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
        setCancelling(true); setCancelError("");
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
        <PageLayout>
            <div className="order-detail-container">

                <button className="back-to-orders-btn" onClick={handleBack}>
                    <span className="arrow-history">←</span>
                    <span>Back to order history
                    </span>
                </button>

                <div className="upperpage">
                    <div className="order-basic-data-container">
                        <div className="order-basic-data">
                            <h2 className="order-res-name">
                                {restaurant?.name}
                            </h2>
                            <section className="order-data-basic">
                                {restaurant?.address}
                            </section>
                            <section className="order-data-basic">
                                Order placed: {order?.created_at}
                            </section>
                            <section className="order-data-basic">
                                Order ID: {order?.id}{order?.cancelled ? " \u2014 Cancelled" : ""}
                            </section>

                            {order?.cancelled ? (
                                <p className="order-cancelled-tag">This order has been cancelled.</p>
                            ) : (
                                <div className="order-cancel-area">
                                    <p className="order-cancel-note">
                                        You can cancel an order only within 15 minutes of ordering.
                                    </p>
                                    <button
                                        className="order-cancel-btn"
                                        onClick={handleCancel}
                                        disabled={cancelling || !withinWindow}
                                        title={withinWindow ? "Cancel this order" : "cant cancel an order after 15 minutes"}
                                    >
                                        {cancelling ? "Cancelling\u2026" : "Cancel order"}
                                    </button>
                                    {!withinWindow && order && (
                                        <p className="order-cancel-expired">cant cancel an order after 15 minutes</p>
                                    )}
                                    {cancelError && <p className="order-cancel-error">{cancelError}</p>}
                                </div>
                            )}

                        </div>
                    </div>
                    <div className="order-again-restaurant">
                        <button className="order-again-button" onClick={handleOrderAgain}>
                            Order again
                        </button>
                        <button className='restaurant-navigation-page' onClick={handleVisitRestaurant}>
                            Visit restaurant
                        </button>
                    </div>

                </div>

                <div className='items-order-container'>
                    <section className="items-text"> Items </section>
                    <div className='data-items'>
                        {products.map((product, index) => (
                            <div className='products-mapping' key={`${product.id}-${index}`}>
                                <span className='product-name'>{product.name}</span>
                                <span>{product.price == null ? "—" : `₪${product.price}`}</span>
                            </div>))}
                    </div>
                    <div className="total-row">
                        <span className='text-total-sum'>Total sum:</span>
                        <span className='totalsum'>₪{order?.total}</span>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}