// @ts-check

import express from "express";

import * as backend from "../backend.js";
import * as Products from "../model/products.js";
import * as Restaurants from "../model/restaurants.js";
import * as Users from "../model/users.js";
import { getAuthUserId } from "../middleware/auth.js";

// The five fixed menu sections a product can belong to.
const PRODUCT_CATEGORIES = ["Starters", "Mains", "Sides", "Desserts", "Drinks"];

/** @param {Products.RestaurantID} id */
async function restaurant_exists(id) {
    return (await Restaurants.getRestaurantById(id)) !== undefined;
}

/**
 * Returns an error string if the authenticated user may not manage this
 * restaurant's menu, or null if they may. Ownership is only enforced when an
 * owner is recorded on the restaurant (data without one is left open).
 * @param {import("express").Request} req
 * @param {Products.RestaurantID} restaurant_id
 * @returns {Promise<string | null>}
 */
async function ownership_error(req, restaurant_id) {
    const restaurant = await Restaurants.getRestaurantById(restaurant_id);
    const owner = restaurant && /** @type {any} */ (restaurant).owner;
    if (owner === undefined || owner === null) return null;
    if (getAuthUserId(req) !== owner) return "only the restaurant owner may change its menu";
    return null;
}

const mockables = {
    /**
     * @param {Products.ProductID} id
     * @returns {Promise<{error: String}?>} 
    */
    backend_remove_product: async function (id) {
        let users = await Users.get_all();
        let product = String(id);
        for (const user of users) {
            const user_id = String(user.id);
            try {
                const { status } = await backend.delete_(user_id, [product]);
                if (status !== 204 && status !== 404) {
                    return { error: `backend returned unexpected status: ${status}` };
                };
            }
            catch (exc) {
                console.warn("Backend is unreachable:");
                console.warn(exc);
                return null;
            }
        }
        return null;
    },

    /**
     * @param {Users.UserID} user_id
     * @param {Products.ProductID} product_id
     * @returns {Promise<{error: String}?>} 
    */
    backend_add_product: async function (user_id, product_id) {
        let user_id_str = String(user_id);
        let product_id_str = String(product_id);
        try {
            const res_patch = await backend.patch(user_id_str, [product_id_str]);
            if (res_patch.status === 204) return null;
            if (res_patch.status !== 404) {
                return { error: `backend returned unexpected status: ${res_patch.status}` };
            }
            const res_post = await backend.post(user_id_str, [product_id_str]);
            if (res_post.status === 201) return null;
            return { error: `backend returned unexpected status: ${res_post.status}` };
        } catch (exc) {
            console.warn("Backend is unreachable:");
            console.warn(exc);
            return null;
        }
    },
};


/**
 * @template T 
 * @typedef {{value: T, error?: undefined} | {value?: undefined, error: String}} Result<T>
 */

/**
 *  @param {any} obj 
 *  @param {String} id_name
 * @returns {Result<Number>}
*/
function parse_id(obj, id_name) {
    if (typeof (obj) !== "string") {
        return { error: `expected ${id_name} in url parameters` };
    }
    const id = Number(obj);
    if (isNaN(id) || !obj) {
        return { error: `expected ${id_name} to be a number` };
    }
    return { value: id };
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function get_all(req, res) {
    const id_result = parse_id(req.params.id, "restaurant id");
    if (id_result.error !== undefined) {
        return res.status(400).json({ error: id_result.error })
    }
    const restaurant_id = id_result.value;
    if (!(await restaurant_exists(restaurant_id))) {
        return res.status(404).json({ error: "restaurant not found" });
    }
    const products = await Products.get_all(restaurant_id);
    return res.status(200).json(products);
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function get(req, res) {
    const id_result = parse_id(req.params.id, "restaurant id");
    const pid_result = parse_id(req.params.pid, "product id");
    if (id_result.error !== undefined) {
        return res.status(400).json({ error: id_result.error })
    } else if (pid_result.error !== undefined) {
        return res.status(400).json({ error: pid_result.error })
    }
    const restaurant_id = id_result.value;
    const product_id = pid_result.value;
    if (!(await restaurant_exists(restaurant_id))) {
        return res.status(404).json({ error: "restaurant not found" });
    }
    const product = await Products.get(restaurant_id, product_id);
    if (product === null) {
        return res.status(404).json({ error: "no such product for this restaurant" });
    }
    const user_id_str = req.get("user_id");
    const user_id = user_id_str ? Number(user_id_str) : undefined;
    if (user_id !== undefined && Number.isInteger(user_id)) {
        const backend_error = await mockables.backend_add_product(user_id, product.id);
        if (backend_error !== null) {
            return res.status(500).json(backend_error);
        }
    }
    return res.status(200).json(product);
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function add(req, res) {
    const id_result = parse_id(req.params.id, "restaurant id");
    if (id_result.error !== undefined) {
        return res.status(400).json({ error: id_result.error })
    }
    const restaurant_id = id_result.value;
    if (!(await restaurant_exists(restaurant_id))) {
        return res.status(404).json({ error: "restaurant not found" });
    }
    const own_err = await ownership_error(req, restaurant_id);
    if (own_err !== null) {
        return res.status(403).json({ error: own_err });
    }
    const { name, price, category, pic } = req.body;
    if (typeof (name) !== "string") {
        return res.status(400).json({ error: "expected field 'name' to be a string" });
    }
    if (typeof (price) !== "number") {
        return res.status(400).json({ error: "expected field 'price' to be a number" });
    }
    if (typeof (category) !== "string" || !PRODUCT_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `expected field 'category' to be one of: ${PRODUCT_CATEGORIES.join(", ")}` });
    }
    if (pic !== undefined && typeof (pic) !== "string") {
        return res.status(400).json({ error: "expected field 'pic' to be a string" });
    }
    const product = await Products.add(restaurant_id, { name, price, category, pic: pic ?? "" });
    return res.status(201)
        .location(`/api/restaurants/${restaurant_id}/products/${product.id}`)
        .json(product);
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function modify(req, res) {
    const id_result = parse_id(req.params.id, "restaurant id");
    const pid_result = parse_id(req.params.pid, "product id");
    if (id_result.error !== undefined) {
        return res.status(400).json({ error: id_result.error })
    } else if (pid_result.error !== undefined) {
        return res.status(400).json({ error: pid_result.error })
    }
    const restaurant_id = id_result.value;
    const product_id = pid_result.value;
    if (!(await restaurant_exists(restaurant_id))) {
        return res.status(404).json({ error: "restaurant not found" });
    }
    const own_err = await ownership_error(req, restaurant_id);
    if (own_err !== null) {
        return res.status(403).json({ error: own_err });
    }
    const { name, price, category, pic } = req.body;
    if (name !== undefined && typeof (name) !== "string") {
        return res.status(400).json({ error: "expected field 'name' to be a string" });
    }
    if (price !== undefined && typeof (price) !== "number") {
        return res.status(400).json({ error: "expected field 'price' to be a number" });
    }
    if (category !== undefined && (typeof (category) !== "string" || !PRODUCT_CATEGORIES.includes(category))) {
        return res.status(400).json({ error: `expected field 'category' to be one of: ${PRODUCT_CATEGORIES.join(", ")}` });
    }
    if (pic !== undefined && typeof (pic) !== "string") {
        return res.status(400).json({ error: "expected field 'pic' to be a string" });
    }
    const product = await Products.modify(restaurant_id, product_id, { name, price, category, pic });
    if (product === null) {
        return res.status(404).json({ error: "no such product for this restaurant" });
    }
    return res.status(204).end();
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function remove(req, res) {
    const id_result = parse_id(req.params.id, "restaurant id");
    const pid_result = parse_id(req.params.pid, "product id");
    if (id_result.error !== undefined) {
        return res.status(400).json({ error: id_result.error })
    } else if (pid_result.error !== undefined) {
        return res.status(400).json({ error: pid_result.error })
    }
    const restaurant_id = id_result.value;
    const product_id = pid_result.value;
    if (!(await restaurant_exists(restaurant_id))) {
        return res.status(404).json({ error: "restaurant not found" });
    }
    const own_err = await ownership_error(req, restaurant_id);
    if (own_err !== null) {
        return res.status(403).json({ error: own_err });
    }
    const product = await Products.remove(restaurant_id, product_id);
    if (product === null) {
        return res.status(404).json({ error: "no such product for this restaurant" });
    }
    const backend_error = await mockables.backend_remove_product(product.id);
    if (backend_error !== null) {
        return res.status(500).json(backend_error);
    }
    return res.status(204).end();
}

export { get, get_all, add, modify, remove, mockables };