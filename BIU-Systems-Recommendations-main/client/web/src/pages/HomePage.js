// @ts-check
import RestaurantCategory from "../components/catagory/RestaurantCategory";
import Navbar from "../components/NavBar/navBar";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import BubbleCategory from "../components/catagory/bubbleCategory";
import { HOME_COLLECTIONS } from "../config/homeCollection";
import { useEffect, useState } from "react";
import RestaurantGridPage from "./RestaurantGridPage"
// @ts-ignore
import "../styles/buttons.css";
// @ts-ignore
import "../styles/HomePage.css";

/**
 * Main application page.
 */

const MIN_LOAD_TIME = 300;

/**
 * @typedef {import("../../../../api/src/model/restaurants").Restaurant} Restaurant
  * @typedef {import("../../../../api/src/model/restaurants").Location} Location
 */

function HomePage() {
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


  const [restaurants, setRestaurants] = useState(
    /** @type {Restaurant[]} */([])
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // api GET request for all restaurants.  
  useEffect(() => {
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

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(MIN_LOAD_TIME - elapsedTime, 0);

        setRestaurants(/** @type {Restaurant[]} */(data));

        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load restaurants"
        );
        setIsLoading(false);
      }
    }

    loadRestaurants();
  }, []);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (isLoading) {
    return (
      <main className="page">
        <Navbar />
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </main>
    );
  }

  return (
    <RestaurantGridPage>
      <BubbleCategory restaurants={restaurants} />

      {/* Build home sections dynamically from configuration */}
      {HOME_COLLECTIONS.map((collection) => (
        <RestaurantCategory
          key={collection.pageType}
          title={collection.title}
          pageType={collection.pageType}
          restaurants={collection.getRestaurants(restaurants, userLocation)}
        />
      ))}
    </RestaurantGridPage>
  );
}

export default HomePage;