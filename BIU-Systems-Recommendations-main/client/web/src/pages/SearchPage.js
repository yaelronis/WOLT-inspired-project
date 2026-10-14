// @ts-check

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../utils/api";
import RestaurantGridPage from "./RestaurantGridPage";

const MIN_LOAD_TIME = 600;

/**
 * Search results page.
 */
function SearchPage() {
  const { query } = useParams();

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true);
        setError("");

        const start = Date.now();

        const res = await api.search(query ?? "");

        if (!res.ok) {
          throw new Error("Search failed");
        }

        const data = await res.json();

        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_LOAD_TIME - elapsed);

        setTimeout(() => {
          setRestaurants(data);
          setIsLoading(false);
        }, remaining);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setRestaurants([]);
        setIsLoading(false);
      }
    };

    loadResults();
  }, [query]);

  return (
    <RestaurantGridPage
      title={`Search results for "${query ?? ""}"`}
      restaurants={restaurants}
      loading={isLoading}
      emptyText={error || "No search results found"}
    />
  );
}

export default SearchPage;