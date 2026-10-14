// @ts-check

import { useNavigate } from "react-router-dom";

// @ts-ignore
import "../styles/AllOrderPage.css"
import PageLayout from "../layouts/PageLayout";
import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
/**
 * @typedef {import("../../../../api/src/model/orders").Order} Order
 * @typedef {Order & {
 *   restaurantName?: string
 * }} OrderWithRestaurant
 * @typedef {import("../../../../api/src/model/orders").OrderId} OrderId
 */
export default function AllOrderPage() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState(
        /** @type {OrderWithRestaurant[]} */([]));

    /**
    * Loads the logged-in user's orders on page mount and when the token changes.
    * Fetches all restaurants to attach the matching restaurant name to each order.
    */
    useEffect(() => {
        async function loadOrders() {
            if (!token) return;

            try {
                const ordersRes = await api.getOrders(token);

                if (ordersRes.status === 401) {
                    logout();
                    navigate("/login");
                    return;
                }

                if (!ordersRes.ok) {
                    console.warn("Failed loading orders");
                    return;
                }

                const ordersData =
                /** @type {Order[]} */ (await ordersRes.json());

                const restaurantsRes = await api.getRestaurants();

                if (!restaurantsRes.ok) {
                    console.warn("Failed loading restaurants");
                    return;
                }

                const restaurantsData =
                /** @type {{ id: number, name: string }[]} */ (
                        await restaurantsRes.json()
                    );

                const ordersWithRestaurantName = ordersData.map((order) => {
                    const restaurant = restaurantsData.find(
                        (res) => res.id === order.restaurant
                    );

                    return {
                        ...order,
                        restaurantName: restaurant?.name ?? "Unknown restaurant",
                    };
                });

                setOrders(ordersWithRestaurantName);
            } catch (err) {
                console.error("Failed loading orders page", err);
            }
        }

        loadOrders();
    }, [token, logout, navigate]);

    /**
     * 
     * @param {OrderId} orderId 
     */
    const handleOrderClick = (orderId) => {
        navigate(`/orders/${orderId}`);
    };

    return (
        <PageLayout>
            <div className="all-orders-container">
                <h1 className="orders-title">All orders</h1>
                {orders.length === 0 ? (
                    <p>No orders yet.</p>) :
                    (<ul className="orders-list">
                        {orders.map((order) => (
                            <li key={order.id} className="order-item">
                                <button className="order-button" onClick={() => handleOrderClick(order.id)}>
                                    <div className="order-data">
                                        <span className="order-name">
                                            {order.restaurantName}
                                            {order.cancelled && <span className="order-cancelled-badge"> · Cancelled</span>}
                                        </span>
                                        <div className="left">
                                            <span className="order-date">{order.created_at}</span>
                                            <span className="order-price">₪{order.total}</span>
                                        </div>
                                        <span className="order-arrow">›</span>

                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>)}
            </div>
        </PageLayout>
    )
}