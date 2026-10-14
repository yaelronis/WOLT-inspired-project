// @ts-check

import RestaurantCard from "../cards/ResCard.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// @ts-ignore
import "../../styles/ResCatagory.css";
/**
 * @typedef {import("../../../../../api/src/model/restaurants").Restaurant} Restaurant
 *  */
/**
 * @param {{
 *   title: string,
 *   pageType: string,
 *   restaurants?: Restaurant[]
 * }} props
 */
function RestaurantCategory({ title, pageType, restaurants = [] }) {
    const navigate = useNavigate();
    // Number of visible restaurant cards depends on screen width.
    const [visibleCount, setVisibleCount] = useState(
        window.innerWidth < 1200 ? 3 : 4
    );

    const [startIndex, setStartIndex] = useState(0);

    // Update carousel layout when screen size changes.
    useEffect(() => {
        const handleResize = () => {
            setVisibleCount(window.innerWidth < 1200 ? 3 : 4);
            setStartIndex(0);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Do not render empty categories.
    if (restaurants.length === 0) {
        return null;
    }

    const visibleRestaurants = restaurants.slice(
        startIndex,
        startIndex + visibleCount
    );

    const goNext = () => {
        setStartIndex((prev) =>
            Math.min(
                prev + visibleCount,
                Math.max(restaurants.length - visibleCount, 0)
            )
        );
    };

    const goPrev = () => {
        setStartIndex((prev) => Math.max(prev - visibleCount, 0));
    };

    return (
        <section className="category-section">
            <div className="category-header">
                <h2>{title}</h2>

                <div className="category-actions">
                    <button
                        className="view-all-btn"
                        onClick={() => navigate(`/restaurants/category/${pageType}`)}
                    >
                        View all
                    </button>

                    <button
                        className="arrow-btn"
                        onClick={goPrev}
                        disabled={startIndex === 0}
                    >
                        ←
                    </button>

                    <button
                        className="arrow-btn"
                        onClick={goNext}
                        disabled={startIndex + visibleCount >= restaurants.length}
                    >
                        →
                    </button>
                </div>
            </div>

            <div className="restaurants-list">
                {visibleRestaurants.map((restaurant) => (
                    <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                    />
                ))}
            </div>
        </section>
    );
}

export default RestaurantCategory;