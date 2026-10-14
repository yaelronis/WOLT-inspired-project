// @ts-check

// @ts-ignore
import '../../styles/bubbleCategory.css';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

/**
 * @typedef {import("../../../../../api/src/model/restaurants").Restaurant} Restaurant
 */

// Number of categories moved when clicking the arrows.
const STEP = 1;

/**
 * @param {{ restaurants?: Restaurant[] }} props
 */
function BubbleCategory({ restaurants = [] }) {
    const [startIndex, setStartIndex] = useState(0);
    // Amount of visible categories depends on the screen size.
    const [visibleCount, setVisibleCount] = useState(
        window.innerWidth < 1000 ? 4 : 6
    );
    const navigate = useNavigate();
    // Extract all categories from restaurants and remove duplicates.
    const allCategories = restaurants.map(res => res.category);
    const uniqueCategoryNames = [...new Set(allCategories)].filter(Boolean);

    // Convert category names into display objects:
    // name, matching image path and number of restaurants.
    const categoriesWithImages = uniqueCategoryNames.map((name, index) => {
        const cleanFileName = name.toLowerCase().replace(/ /g, "-");
        const restaurantCount = restaurants.filter(res => res.category === name).length;
        return {
            id: index,
            name: name,
            image: `/images/${cleanFileName}.jpg`,
            count: restaurantCount
        }
    });

    // Update number of visible categories when window size changes.
    useEffect(() => {
        const handleResize = () => {
            setVisibleCount(window.innerWidth < 1000 ? 4 : 6);
        };

        window.addEventListener("resize", handleResize);

        return () =>
            window.removeEventListener("resize", handleResize);
    }, []);

    const visibleCategories = categoriesWithImages.slice(
        startIndex,
        startIndex + visibleCount
    );

    const goNext = () => {
        setStartIndex((prev) =>
            Math.min(prev + STEP, Math.max(categoriesWithImages.length - visibleCount, 0)));
    };

    const goPrev = () => {
        setStartIndex((prev) => Math.max(prev - STEP, 0));
    };

    return (
        <section className="categories-container">
            <div className="category-header">
                <h2>Categories</h2>
                <div className="category-actions">
                    <button className="arrow-btn" onClick={goPrev} disabled={startIndex === 0}>
                        ←
                    </button>

                    <button className="arrow-btn" onClick={goNext}
                        disabled={startIndex + visibleCount >= categoriesWithImages.length}>
                        →
                    </button>
                </div>
            </div>
            <div className="categories-list">
                {visibleCategories.map((category) => (
                    <div key={category.name} className="category-bubble-item"
                        onClick={() => navigate(`/restaurants/category/${category.name}`)}>
                        <div className="bubble">
                            <img src={category.image} alt={category.name} />
                        </div>
                        <span className="category-bubble-name">{category.name}</span>
                        <span className="category-count">{category.count} places</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default BubbleCategory;