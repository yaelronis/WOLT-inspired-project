// @ts-check
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../utils/api";
// @ts-ignore
import "../../styles/RestaurantCard.css"
/**
 * @typedef {import("../../../../../api/src/model/restaurants").Restaurant} Restaurant
 */

/**
 *
 * @param {{restaurant: Restaurant, onDeleted?: (id: number) => void}} param0
 */
function RestaurantCard({ restaurant, onDeleted }) {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const defaultImage = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600";

  // Hide the card the moment its restaurant is deleted, so it disappears from
  // whatever list it sits in (home, category, search...) without a refetch.
  const [deleted, setDeleted] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Owner controls show only to the owner who created this restaurant (the
  // server stamps "owner" with the creator's user id on create).
  const isOwner =
    user?.role === "owner" &&
    restaurant.owner != null &&
    Number(restaurant.owner) === Number(user?.id);

  const openRestaurant = () => {
    navigate(`/restaurants/${restaurant.id}`);
  };

  /** @param {import("react").MouseEvent} e */
  const handleDelete = async (e) => {
    // Don't let the click bubble to the card (which would open the restaurant).
    e.stopPropagation();
    if (removing) return;
    setRemoving(true);
    try {
      const res = await api.deleteRestaurant(restaurant.id, token);
      if (res.ok || res.status === 204) {
        setDeleted(true);
        onDeleted?.(Number(restaurant.id));
      } else {
        // Couldn't delete (not the owner)- do nothing.
        setRemoving(false);
      }
    } catch {
      setRemoving(false);
    }
  };

  if (deleted) return null;

  /* Display a restaurant details:
    1. Restaurant image
    2. Restaurant name
    3. Restaurant rate
    4. Restaurant description
    Clicking (or pressing Enter/Space on) the card opens its screen (/restaurants/:id).
    The owner of the restaurant also sees a butten to delete it.
  */
  return (
    <article className="restaurant-card"
      onClick={openRestaurant}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRestaurant(); } }}
      role="button"
      tabIndex={0}>
      {isOwner && (
        <button
          type="button"
          className="restaurant-card-delete"
          title="Delete this restaurant"
          aria-label={`Delete ${restaurant.name}`}
          onClick={handleDelete}
          disabled={removing}
        >
          {'\u00D7'}
        </button>
      )}
      <div className="restaurant-image">
        <img
          src={restaurant.imgURL || defaultImage}
          alt={restaurant.name}
          className="restaurant-img"
        /> </div>
      <div className="restaurant-content">
        <div className="restaurant-title-row">
          <h3 className="restaurant-name">{restaurant.name}</h3>
          {restaurant.rating > 0 && (
            <span className="restaurant-card-rating">
              ⭐ {Number(restaurant.rating).toFixed(1)}
            </span>
          )}
        </div>
        <p className="restaurant-address">
          {restaurant.address}
        </p>
        <p className="restaurant-description">
          {restaurant.description}
        </p>
      </div>
    </article >
  );
}

export default RestaurantCard;