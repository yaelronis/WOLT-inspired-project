// @ts-check

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import RestaurantCard from "../cards/ResCard";
// @ts-ignore
import searchIcon from "../../assets/search.svg";
// @ts-ignore
import "../../styles/SearchBar.css";

/**
 * Search bar component.
 * Shows quick restaurant results and navigates to full results page.
 *
 * @returns {import("react").JSX.Element}
 */
function SearchBar() {
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);

  /** @type {[string, Function]} */
  const [query, setQuery] = useState("");

  /** @type {[Array<any>, Function]} */
  const [results, setResults] = useState([]);

  /**
   * Handles search input changes.
   * @param {import("react").ChangeEvent<HTMLInputElement>} e
   */
  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setResults([]);
      return;
    }

    try {
      const res = await api.search(value);

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  /**
   * Closes search popup and resets state.
   */
  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  /**
   * Opens the full search results page.
   */
  const goToAllResults = () => {
    const cleanQuery = query.trim();

    if (!cleanQuery) return;

    navigate(`/search/${encodeURIComponent(cleanQuery)}`);
    closeSearch();
  };

  return (
    <>
      {searchOpen && <div className="search-overlay" onClick={closeSearch} />}

      <div className={`search-area ${searchOpen ? "active" : ""}`}>
        <div className="search-box">
          <input
            value={query}
            placeholder="Search"
            onFocus={() => setSearchOpen(true)}
            onChange={handleChange}
          />

          {!searchOpen && (
            <img src={searchIcon} alt="Search" className="search-icon" />
          )}

          {searchOpen && (
            <button className="close-search" onClick={closeSearch}>
              ✕
            </button>
          )}
        </div>

        {searchOpen && results.length > 0 && (
          <div className="search-results">
            <h2>Search results</h2>

            {results.length > 4 && (
              <button className="view-all-btn" onClick={goToAllResults}>
                View all ({results.length})
              </button>
            )}

            <div className="search-results-list">
              {results.slice(0, 4).map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SearchBar;