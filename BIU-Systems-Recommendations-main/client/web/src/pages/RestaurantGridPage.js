// @ts-check

import RestaurantCard from "../components/cards/ResCard";
import RestaurantSkeleton from "../components/cards/RestaurantSkeleton";
import PageLayout from "../layouts/PageLayout";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
// @ts-ignore
import "../styles/RestaurantGridPage.css";


/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {Array<any>} [props.restaurants]
 * @param {boolean} [props.loading]
 * @param {string} [props.emptyText]
 * @param {import('react').ReactNode} [props.children]
 */

// shared grid for main page
function RestaurantGridPage({
  title,
  restaurants = [],
  loading = false,
  emptyText = "",
  children,
}) {
  const { pathname } = useLocation();

  // go to top of the page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <PageLayout>
      <main className="restaurant-grid-page">
        {title && <h1>{title}</h1>}

        {children ? (
          children
        ) : (
          <>
            <div className="restaurant-grid">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <RestaurantSkeleton key={index} />
                  ))
                : restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                    />
                  ))}
            </div>

            {!loading && restaurants.length === 0 && (
              <p className="restaurant-grid-empty">{emptyText}</p>
            )}
          </>
        )}
      </main>
    </PageLayout>
  );
}

export default RestaurantGridPage;