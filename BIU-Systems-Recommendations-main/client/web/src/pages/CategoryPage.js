// @ts-check

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import RestaurantGridPage from "./RestaurantGridPage";
import { HOME_COLLECTIONS } from "../config/homeCollection";

/**
 * Category restaurants page.
 *
 * Loads all restaurants and displays them according to the route:
 * 1. predefined home collections (top rated, near you, vegetarian...)
 * 2. regular restaurant categories
 */

const MIN_LOAD_TIME = 600;

/**
 * @typedef {import("../../../../api/src/model/restaurants").Restaurant} Restaurant
 * @typedef {import("../../../../api/src/model/restaurants").Location} Location
 */

function CategoryPage() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(  /** @type {Location | undefined} */(undefined));

  // Current user's location.
  useEffect(() => {
    async function loadUserLocation() {
      if (!user?.id) return;
      const res = await api.getUser(user.id);
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
  }, [user?.id]);

  const { pageType = "" } = useParams();
  const [restaurants, setRestaurants] = useState(
    /** @type {Restaurant[]} */([])
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  // Load restaurants from the server whenever the page changes.
  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();

    async function loadRestaurants() {
      try {
        setIsLoading(true);
        setError("");
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

          throw new Error("Failed to load restaurants");
        }

        const data = await res.json();
        // Ignore response if component was removed.
        if (cancelled) return;

        setRestaurants(/** @type {Restaurant[]} */(data));

        // Keep skeleton visible for a minimum time
        // to avoid quick loading flashes
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(MIN_LOAD_TIME - elapsedTime, 0);
        setTimeout(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        }, remainingTime);
      } catch (err) {
        if (cancelled) return;

        setError(err instanceof Error ? err.message : "Failed to load restaurants");
        setIsLoading(false);
      }
    }

    loadRestaurants();

    return () => {
      cancelled = true;
    };
  }, [pageType]);

  const config = HOME_COLLECTIONS.find(
    (collection) => collection.pageType === pageType
  );

  // Apply either custom collection logic or normal category filtering.
  const filteredRestaurants = config
    ? config.getRestaurants(restaurants, userLocation)
    : restaurants.filter(
      (restaurant) =>
        restaurant.category?.toLowerCase() === pageType.toLowerCase()
    );

  if (error) {
    return (
      <RestaurantGridPage
        title="Error"
        restaurants={[]}
        loading={false}
        emptyText={error}
      />
    );
  }

  return (
    <RestaurantGridPage
      title={config?.title ?? pageType}
      restaurants={filteredRestaurants}
      loading={isLoading}
      emptyText="No restaurants in this category"
    />
  );
}

export default CategoryPage;