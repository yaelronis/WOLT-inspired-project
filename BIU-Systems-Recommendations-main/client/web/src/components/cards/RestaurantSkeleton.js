// @ts-check

// @ts-ignore
import "../../styles/RestaurantCard.css"

// Restaurant skeleton
function RestaurantSkeleton() {
    return (
        <div className="restaurant-card-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
        </div>
    )
}
export default RestaurantSkeleton