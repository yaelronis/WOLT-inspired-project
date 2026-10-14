// @ts-check

import { getDistanceKm } from "../utils/distance";

/**
 * Home page collections configuration.
 *
 * Each collection defines:
 * 1. the title displayed on the home page
 * 2. the route identifier used for "View all"
 * 3. the logic for selecting and ordering restaurants
 *
 * Adding a new section to the home page only requires
 * adding a new object to this array.
 */

/**
 * @typedef {import("../../../../api/src/model/restaurants").Restaurant} Restaurant
 * @typedef {import("../../../../api/src/model/restaurants").Location} Location
 */

export const HOME_COLLECTIONS = [

    {
        title: "Near you 📍",
        pageType: "near-you",


        /**
 * @param {Restaurant[]} restaurants
 * @param {Location=} userLocation
 */
        getRestaurants: (restaurants, userLocation) => {
            if (!userLocation) {
                return [];
            }

            return [...restaurants]
                .filter(
                    (res) =>
                        res.location?.lat != null &&
                        res.location?.lng != null
                )
                .sort(
                    (a, b) =>
                        getDistanceKm(userLocation, a.location) -
                        getDistanceKm(userLocation, b.location)
                )
                .slice(0, 10);
        }
    },

    {
        title: "Top rated ⭐",
        pageType: "top-rated",

        /**
         * @param {Restaurant[]} restaurants
         */
        getRestaurants: (restaurants) =>
            [...restaurants]
                .sort((a, b) => Number(b.rating) - Number(a.rating))
                .slice(0, 10),
    },

    {
        title: "For the Veggies 🥦",
        pageType: "vegetarian",

        /**
         * @param {Restaurant[]} restaurants
         */
        getRestaurants: (restaurants) =>
            restaurants.filter(
                (res) => res.vegetarian === true
            ),
    },

    {
        title: "Munchies 🍪",
        pageType: "Desserts",

        /**
         * @param {Restaurant[]} restaurants
         */
        getRestaurants: (restaurants) =>
            restaurants.filter(
                (res) => res.category === "Dessert"
            ),
    },

    {
        title: "Promoted",
        pageType: "promoted",
        /**
                * @param {Restaurant[]} restaurants
                */
        getRestaurants: (restaurants) =>
            restaurants.filter(
                (res) => res.promoted === true
            ),
    },
];