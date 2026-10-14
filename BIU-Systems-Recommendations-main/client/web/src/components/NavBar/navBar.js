// @ts-check
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import ThemeToggle from "../ThemeToggle";
import { api } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// @ts-ignore
import "../../styles/NavBar.css"

/**
 * @typedef {import("../../../../../api/src/model/users").User} User
 */ 
function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [fullUser, setFullUser] = useState(user);
  // api GET user request
  useEffect(() => {
    async function loadUser() {
      if (!user?.id) return;
      // If I recieved user image -> dont call GET api 
      if (user.image) return;
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
      setFullUser(/** @type {User} */(data));
    }

    loadUser();
  }, [user]);

  /* If client scrolled -> keep nav bar sticky. 
    If user in the top of the page, disable shadow
  */
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);


  /* show NavBar:
    1. logo in the left
    2. search bar in the middle
    3. user/actions in the right
  */
  return (
    <header className={`navbar ${isScrolled ? "scrolled" : ""}`}>

      <div className="logo">
        <img
          src="/wolt-logo.png"
          alt="Wolt Logo"
          onClick={() => navigate("/")}
        />
      </div>

      <div className="nav-search">
        <SearchBar />
      </div>

      <div className="nav-side">
        {/* If user logged in show me user menu
    If not, show me log in sign up buttons */}
        
        <ThemeToggle/>

        {user ? (
          <UserMenu
            user={/** @type {User} */(fullUser)}
            onLogout={logout} />
        ) : (
          <>
            <button
              className="login-btn"
              onClick={() => navigate("/login")} >
              Log in
            </button>

            <button
              className="signup-btn"
              onClick={() => navigate("/register")} >
              Sign up
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;