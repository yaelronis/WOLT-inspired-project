// @ts-check
import { useEffect, useState } from "react";
import { ScrollView, Text, Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";
import NavBar from "../components/NavBar";
import Button from "../components/Button"
import RestaurantCategory from "../Categories/RestaurantCategory";
import { HOME_COLLECTIONS } from "../config/homeCollection";
import { api } from "../utils/api"
import get_stylesheet from "../styles/HomeScreen.styles";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import BubbleCategory from "../Categories/BubbleCategory";
// import { api } from "../utils/api";

/**
 * @typedef {import("../../../api/src/model/restaurants").Restaurant} Restaurant 
 *  @typedef {import("../../../api/src/model/restaurants").Location} Location 
 */

export default function HomeScreen() {
  const styles = get_stylesheet(useTheme());
  /** Get Connected user Data */
  const { user, logout } = useAuth();
  const [userLocation, setUserLocation] = useState(  /** @type {Location | undefined} */(undefined));
  // Current user's location.
  useEffect(() => {
    async function loadUserLocation() {
      if (!user?.id) return;

      const res = await api.getUser(user.id);
      // Load full user data.
      // If the saved token belongs to a deleted user,
      // logout and remove invalid authentication state.
      if (res.status === 404) {
        logout();
        return;
      }

      if (res.status !== 200) {
        const body = await res.text();

        console.warn(
          `GET /users/${user.id} returned unexpected response:\n`,
          res.status,
          res.statusText,
          "\n",
          body
        );

        return;
      }

      const data = await res.json();

      setUserLocation(data.location);
    }

    loadUserLocation();
  }, [user?.id, logout]);

  /** Get all restaurants */
  const [restaurants, setRestaurants] = useState( /** @type {Restaurant[]} */([]));
  useEffect(() => {
    async function loadRestaurants() {
      const res = await api.getRestaurants();
      if (res.status !== 200) {
        const body = await res.text();

        console.warn(
          `GET /restaurants returned unexpected response:\n`,
          res.status,
          res.statusText,
          "\n",
          body
        );
        return;
      }

      const data = await res.json();
      setRestaurants(/** @type {Restaurant[]} */(data));
    }
    loadRestaurants();
  }, []);
  /**
   * 
   * @param {string} restaurantId 
   */
  const handleRestaurantPress = (restaurantId) => {
    router.push({
      pathname: `/restaurants/${restaurantId}`,
      params: { from: "/" },
    });
  };
  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <NavBar />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {restaurants.length > 0 && (
            <BubbleCategory restaurants={restaurants} />
          )}
          {HOME_COLLECTIONS.map((collection) => {
            const categoryRestaurants = collection.getRestaurants(
              restaurants, userLocation
            );

            if (!categoryRestaurants || categoryRestaurants.length === 0) {
              return null;
            }

            return (
              <RestaurantCategory
                key={collection.pageType}
                title={collection.title}
                restaurants={collection.getRestaurants(restaurants, userLocation)}
                onRestaurantPress={handleRestaurantPress}
              />
            );
          })}
        </ScrollView>
        <View style={styles.bottomActionsContainer}>
          <Button
            onPress={() => router.push("/search")}
            style={styles.searchButton}
            icon={
              <Text style={styles.searchButtonText}>🔍 Search </Text>
            }
          />
        </View>
      </SafeAreaView>
    </>

  );
}