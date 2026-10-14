//@ts-check
import * as restaurants from '../model/restaurants.js'
import * as products_model from '../model/products.js'
import { mockables } from "./products.js";
import { getAuthUserId } from "../middleware/auth.js";

/**
 * @type {readonly string[]}
 */
const ALLOWED_CATEGORIES = [
    "Cafe",
    "Italian",
    "Middle Eastern",
    "Seafood",
    "Asian",
    "Hamburger",
    "Vegan",
    "Dessert",
];


/**
 * Checks if restaurant category is supported.
 *
 * @param {unknown} category
 * @returns {category is string}
 */
function isValidCategory(category) {
    return (
        typeof category === "string" &&
        ALLOWED_CATEGORIES.includes(category)
    );
}
/**
 * Returns the list of allowed restaurant categories.
 * The frontend fetches this so the category list has a single source of truth.
 * @type {import("express").RequestHandler}
 */
const getCategories = (req, res) => {
    res.status(200).json(ALLOWED_CATEGORIES)
    return
};

/**
 * 
 * @type {import("express").RequestHandler}
 */
const getAllRestaurants = async (req, res) => {
    res.status(200).json(await restaurants.getAllRestaurants())
    return
};

/**
 * Returns a restaurant by its id.
 * Converts the route parameter to number before accessing the model.
 * Responds with 404 if the restaurant does not exist.
 * @type {import("express").RequestHandler}
 */
const getRestaurantById = async (req, res) => {
    const id_str = req.params.id;
    if (typeof id_str !== 'string') {
        res.status(400).json({ error: 'expected to get `id` in url params' })
        return
    }
    const id = Number(id_str);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: 'expected id to be numeric' })
        return
    }
    const restaurant = await restaurants.getRestaurantById(id)
    if (!restaurant) {
        res.status(404).json({ error: 'restaurant not found' })
        return
    }
    res.status(200).json(restaurant)
};

/**
 * Creates a new restaurant.
 * Validates the request body
 * Responds with 201 and a Location header containing the created resource URL.
 * @type {import("express").RequestHandler}
 */
const createRestaurant = async (req, res) => {
    if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        res.status(400).json({ error: "Invalid restaurant data" });
        return;
    }
    const { name, address, description, category, vegetarian, promoted, rating, imgURL, location } = req.body
    const parsedRate = Number(rating);
    const isValidLocation =
        location &&
        typeof location === "object" &&
        !Array.isArray(location) &&
        typeof location.lat === "number" &&
        typeof location.lng === "number";
    if (
        typeof name !== "string" ||
        typeof address !== "string" ||
        typeof description !== "string" ||
        typeof category !== "string" ||
        typeof vegetarian !== "boolean" ||
        isNaN(parsedRate) ||
        parsedRate < 0 || parsedRate > 5 ||
        !isValidCategory(category) || !isValidLocation
    ) {
        res.status(400).json({ error: "Invalid restaurant data" })
        return
    }
    const restaurant = await restaurants.createRestaurant(
        { name, address, description, category, vegetarian, promoted, rating, imgURL, location, owner: getAuthUserId(req) })
    res.status(201).location(`/api/restaurants/${restaurant.id}`).json(restaurant)
};


/**
 * Updates an existing restaurant.
 * Only allows updating known restaurant fields.
 * Rejects with 400 if there's invalid fields or values
 * @type {import("express").RequestHandler}
 */
const updateRestaurant = async (req, res) => {
    if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        res.status(400).json({ error: "Invalid restaurant data" });
        return;
    }

    const id_str = req.params.id;

    if (typeof id_str !== "string") {
        res.status(400).json({ error: "expected to get `id` in url params" });
        return;
    }

    const id = Number(id_str);

    if (Number.isNaN(id)) {
        res.status(400).json({ error: "expected id to be numeric" });
        return;
    }

    const allowedFields = [
        "name",
        "address",
        "description",
        "category",
        "vegetarian",
        "promoted",
        "rating",
        "imgURL",
        "location",
    ];

    /**
     * @typedef {import("../model/restaurants").Restaurant} Restaurant
     * @type {Partial<Omit<Restaurant, "id">>}
     */
    const updates = {};

    for (const field of Object.keys(req.body)) {
        if (!allowedFields.includes(field)) {
            res.status(400).json({ error: "Invalid restaurant field" });
            return;
        }

        const value = req.body[field];

        if (field === "name" || field === "description" || field === "imgURL" || field === "address") {
            if (typeof value !== "string") {
                res.status(400).json({ error: "Invalid restaurant value" });
                return;
            }

            updates[field] = value;
        }

        if (field === "category") {
            if (!isValidCategory(value)) {
                res.status(400).json({ error: "Invalid restaurant category" });
                return;
            }

            updates[field] = value;
        }

        if (field === "vegetarian") {
            if (typeof value !== "boolean") {
                res.status(400).json({ error: "Invalid vegetarian value" });
                return;
            }

            updates[field] = value;
        }

        if (field === "rating") {
            const parsedRate = Number(value);

            if (Number.isNaN(parsedRate) || parsedRate < 0 || parsedRate > 5) {
                res.status(400).json({ error: "Invalid restaurant rating" });
                return;
            }

            updates[field] = parsedRate;
        }

        if (field === "promoted") {
            if (typeof value !== "boolean") {
                res.status(400).json({ error: "Invalid promoted value" });
                return;
            }
            updates[field] = value;
        }

        if (field === "location") {
            const isValidLocation =
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                typeof value.lat === "number" &&
                typeof value.lng === "number";

            if (!isValidLocation) {
                res.status(400).json({ error: "Invalid restaurant location" });
                return;
            }

            updates[field] = value;
        }
    }

    const restaurant = await restaurants.updateRestaurant(id, updates);

    if (!restaurant) {
        res.status(404).json({ error: "Restaurant not found" });
        return;
    }

    res.status(200).json(restaurant);
};

/**
 * Deletes a restaurant by id.
 * 
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

const deleteRestaurant = async (req, res) => {
    const id_str = req.params.id;
    if (typeof id_str !== 'string') {
        res.status(400).json({ error: 'expected to get `id` in url params' })
        return
    }
    const id = Number(id_str);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: 'expected id to be numeric' })
        return
    }
    const restaurant = await restaurants.getRestaurantById(id);
    if (!restaurant) {
        res.status(404).json({ error: "Restaurant not found" });
        return;
    }
    // Only the owner who created this restaurant may delete it. Legacy/seeded
    // restaurants have no owner stamped- those stay deletable (no owner to check).
    const owner = restaurant.owner;
    if (owner !== undefined && owner !== null && owner !== getAuthUserId(req)) {
        res.status(403).json({ error: "only the owner can delete this restaurant" });
        return;
    }
    const products = await products_model.get_all(id);
    for (const product of products) {
        await products_model.remove(id, product.id);
        const backend_error = await mockables.backend_remove_product(product.id);
        if (backend_error !== null) {
            return res.status(500).json(backend_error);
        }

    }
    await restaurants.removeRestaurant(id);
    res.status(204).end()
};

/**
 * Searches restaurants using a query parameter.
 * @type {import("express").RequestHandler}
 */
const search = async (req, res) => {
    const query = req.params.query
    if (typeof query !== "string" || query.trim() === "") {
        res.status(400).json({ error: "expected `query` in url params" })
        return
    }
    const result = await restaurants.search(query);
    res.status(200).json(result)
};
export {
    ALLOWED_CATEGORIES,
    getCategories,
    getAllRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    search
}