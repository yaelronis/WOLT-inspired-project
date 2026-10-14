// @ts-check
import { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { router } from "expo-router";
import { api } from "../utils/api";
import { SafeAreaView } from "react-native-safe-area-context";

import get_stylesheet from "../styles/ProfileScreen.styles"
import BackButton from "../components/BackButton";

/**
 * @typedef {import("../../../api/src/model/orders").Order} Order
 * @typedef {Order & { restaurantName?: string }} OrderWithRestaurant
 */

export default function ProfileScreen() {
  const styles = get_stylesheet(useTheme());
  const { user, token, logout, isLoading } = useAuth();

  const [orders, setOrders] = useState(/** @type {OrderWithRestaurant[]} */([]));
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadOrders() {

      if (isLoading) return;

      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const ordersRes = await api.getOrders(token);

        if (ordersRes.status === 401) {
          await logout();
          router.replace("/login");
          return;
        }

        if (!ordersRes.ok) return;

        const ordersData = /** @type {Order[]} */ (await ordersRes.json());
        const restaurantsRes = await api.getRestaurants();

        if (!restaurantsRes.ok) return;

        const restaurantsData = /** @type {{ id: number, name: string }[]} */ (
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
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
  }, [token, logout, isLoading]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  /** @param {number} orderId */
  const handleOrderClick = (orderId) => {
    router.push(`/orders/${orderId}`);
  };

  /** @param {{ item: OrderWithRestaurant }} props */
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderClick(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.orderContent}>
        <Text style={styles.restaurantName}>
          {item.restaurantName}
          {item.cancelled ? "  ·  Cancelled" : ""}
        </Text>
        <View style={styles.orderMetaRow}>
          <Text style={styles.orderMetaDate}>{item.created_at}</Text>
          <Text style={styles.orderMetaPrice}>{item.total} ₪</Text>
        </View>
      </View>
      <Text style={styles.orderArrow}>›</Text>
    </TouchableOpacity>
  );

  const handleBack = () => {
    router.push("/");
  };

  const renderHeader = () => (
    <View>
      <BackButton onPress={handleBack} />
      <View style={styles.userInfoContainer}>
        <View style={styles.textProfileInfo}>
          <Text style={styles.displayUserName}>{user?.username || "Guest User"}</Text>
          <Text style={styles.displayName}>{user?.name || "Guest User"}</Text>

        </View>

        <View style={styles.avatarWrapper}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {user?.username?.substring(0, 2).toUpperCase() || "GU"}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.woltCard}>
        <Text style={styles.cardTitle}>Saved Location</Text>
        <Text style={styles.cardSubTitle}>Address and coordinates set for your account</Text>
        <Text style={styles.locationBadge}>
          📍 Lat: {user?.location?.lat || "32.0853"}, Lng: {user?.location?.lng || "34.7818"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>My Recent Orders</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loadingOrders ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No orders in this account yet.</Text>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}