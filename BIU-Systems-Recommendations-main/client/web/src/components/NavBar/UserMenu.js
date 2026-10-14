// @ts-check

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import "../../styles/UserMenu.css";

/**
 * @typedef {import("../../../../../api/src/model/users").User} User
 * @typedef {import("../../../../../api/src/model/users").Location} UserLocation
 */

/**
 * User profile dropdown menu.
 *
 * @param {object} props
 * @param {User | null} props.user
 * @param {() => void} props.onLogout
 * 
 */
export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(/** @type {HTMLDivElement | null} */(null));
  const navigate = useNavigate();

  const userName = user?.username;
  const userDisplay = user?.name;
  const userLocation = user?.location;

  const userAddressText = userLocation
    ? `${userLocation.lat}, ${userLocation.lng}`
    : "";
  const userImage = user?.image || "/logo192.png";

  // When clicking image -> set open to true
  useEffect(() => {
    /**
     * @param {MouseEvent} e
     */
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        e.target instanceof Node &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function goToOrders() {
    navigate("/orders");
    setOpen(false);
  }

  function logout() {

    setOpen(false);
    onLogout?.();
    navigate("/login");
  }

  /* In Nav Bar - if user logged in:
    1. show profile picture of user
    2. when clicking the image -> show menu:
        a. user profile pic + name 
        b. All orders 
        c. Log out
  */
  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-avatar-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open user menu"
        aria-expanded={open}
      >
        <img src={userImage} alt="profile" className="user-avatar" />
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="profile-preview">
            <img
              src={userImage}
              alt="profile"
              className="profile-preview-img"
            />

            <div className="profile-info">
              <span className="profile-name">{userName}</span>
              <div className="profile-details">
                <section className="profile-subtitle">{userDisplay}</section>
                <section className="profile-address">{userAddressText}</section>
              </div>
            </div>
          </div>

          <button type="button" className="menu-option" onClick={goToOrders}>
            All orders
          </button>

          <button
            type="button"
            className="menu-option logout-btn"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}