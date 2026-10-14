// @ts-check
import mongoose from "mongoose";

/**
 * A geographic location, as sent by the EX4 registration form.
 * @typedef {object} Location
 * @property {number} lat
 * @property {number} lng
 */

/**  @typedef {number} RestaurantId */
/**
 * @typedef {Object} Restaurant
 * @property {RestaurantId} id
 * @property {string} name
 * @property {string} address
 * @property {string} description
 * @property {string} category
 * @property {boolean} vegetarian
 * @property {boolean} promoted
 * @property {number} rating
 * @property {string} imgURL
 * @property {Location} location
 * @property {number} [owner] - user id of the owner who created it (set on the server).
 */

/**
 * Same behavior as before- the only difference is every method now
 * returns a Promise (DB access is async). The Restaurant/RestaurantId types
 * are unchanged, and a missing restaurant is still reported as "undefined".
 *
 * @typedef {Object} RestaurantStorage
 * @property {() => Promise<Restaurant[]>} getAllRestaurants
 * @property {(id: number) => Promise<Restaurant | undefined>} getRestaurantById
 * @property {(restaurant: Omit<Restaurant, "id">) => Promise<Restaurant>} createRestaurant
 * @property {(id: number, fields: Partial<Omit<Restaurant, "id">>) => Promise<Restaurant | undefined>} updateRestaurant
 * @property {(id: number) => Promise<boolean>} removeRestaurant
 * @property {(query: string) => Promise<Restaurant[]>} search
 */

/**
 * filters undefined fields out of objects as such: \
 * @template {Object.<string, Object>} T
 * @param {Partial<T>} obj
 * @returns {Partial<T>}
 */
function filter_undefined_fields(obj) {
    const keys = Object.keys(obj);
    return keys.reduce(
        (acc, key) => {
            return obj[key] === undefined
                ? { ...acc }
                : { ...acc, [key]: obj[key] };
        },
        {}
    );
}

/**
 * Escape user input so it can be used as a literal substring inside a RegExp.
 * @param {string} s
 * @returns {string}
 */
function escape_regex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strip Mongo internals so callers always get the exact same Restaurant shape.
 * @param {any} doc
 * @returns {Restaurant}
 */
function clean(doc) {
    const { _id, __v, ...restaurant } = doc;
    // "location" is required.
    if (restaurant.location) {
        const { _id: _loc_id, ...location } = restaurant.location;
        restaurant.location = location;
    }
    return /** @type {Restaurant} */ (restaurant);
}

/* In-memory storage: the test backend */
/**
 * A fresh, isolated in-memory restaurant store. Identical behaviour to the
 * previous model, just async. Each call returns its own state so tests never
 * share or mutate each other's data.
 * @returns {RestaurantStorage}
 */
const createRestaurantStorage = () => {
    /** @type {Restaurant[]} */
    const restaurants = [];
    /** @type {RestaurantId} */
    let restId = 1;
    return {
        getAllRestaurants: async () => [...restaurants],

        getRestaurantById: async (id) => {
            return restaurants.find((restaurant) => restaurant.id === id);
        },

        createRestaurant: async (restaurant) => {
            const newRestaurant = {
                id: restId++,
                ...restaurant
            };
            restaurants.push(newRestaurant);
            return newRestaurant;
        },

        updateRestaurant: async (id, fields) => {
            const restaurant = restaurants.find((restaurant) => restaurant.id === id);
            if (!restaurant) {
                return undefined
            }
            Object.assign(restaurant, fields);
            return restaurant;
        },

        removeRestaurant: async (id) => {
            const index = restaurants.findIndex(
                restaurant => restaurant.id === id
            );
            if (index === -1) {
                return false;
            }
            restaurants.splice(index, 1);
            return true;
        },

        search: async (query) => {
            const lower = query.toLowerCase();
            return restaurants.filter(r =>
                r.name.toLowerCase().includes(lower) ||
                r.description.toLowerCase().includes(lower)
            );
        }
    }
}

/* MongoDB storage: the production backend */
const restaurant_schema = new mongoose.Schema({
    id:          { type: Number, required: true, unique: true, index: true },
    name:        { type: String, required: true },
    address:     { type: String, required: true },
    description: { type: String },
    category:    { type: String, required: true },
    vegetarian:  { type: Boolean, required: true },
    // promoted/imgURL are not validated on create, so keep them lenient with defaults.
    promoted:    { type: Boolean, default: false },
    rating:      { type: Number, required: true },
    imgURL:      { type: String, default: "" },
    // location is required. Using a typed nested object makes the whole object
    location: {
        type: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        required: true
    },
    // owner is optional (only set when an authenticated user creates it).
    owner:       { type: Number },
});
const RestaurantModel = mongoose.model("Restaurant", restaurant_schema);

/** @returns {RestaurantStorage} */
const createMongoRestaurantStorage = () => ({
    getAllRestaurants: async () =>
        (await RestaurantModel.find().lean()).map(clean),

    getRestaurantById: async (id) => {
        const doc = await RestaurantModel.findOne({ id }).lean();
        return doc ? clean(doc) : undefined;
    },

    createRestaurant: async (restaurant) => {
        // keeps RestaurantId = number.
        // ids start at 1 to match the previous in-memory behaviour.
        const last = await RestaurantModel.findOne().sort({ id: -1 }).lean();
        const id = last ? last.id + 1 : 1;
        const doc = await RestaurantModel.create({ id, ...restaurant });
        return clean(doc.toObject());
    },

    updateRestaurant: async (id, fields) => {
        const update = filter_undefined_fields(fields);
        const doc = await RestaurantModel.findOneAndUpdate(
            { id },
            update,
            { new: true }
        ).lean();
        return doc ? clean(doc) : undefined;
    },

    removeRestaurant: async (id) => {
        const doc = await RestaurantModel.findOneAndDelete({ id }).lean();
        return doc !== null;
    },

    search: async (query) => {
        const rx = new RegExp(escape_regex(query), "i");
        return (
            await RestaurantModel.find({
                $or: [{ name: rx }, { description: rx }],
            }).lean()
        ).map(clean);
    },
});

/* Active storage + injector */
/* Default is the MongoDB backend so production persists with no extra wiring. the
   test suite injects a fresh in-memory backend with setRestaurantStorage (so tests
   never need a live Mongo). */
/** @type {RestaurantStorage} */
let storage = createMongoRestaurantStorage()

/**
 * Overwrites the active restaurant storage (tests inject a fresh one).
 * @param {RestaurantStorage} next
 */
const setRestaurantStorage = (next) => {
  storage = next;
};

const getAllRestaurants = () => storage.getAllRestaurants()
/**
 * @type {RestaurantStorage["getRestaurantById"]}
 */
const getRestaurantById = (id) => storage.getRestaurantById(id)

/**
 * @type {RestaurantStorage["createRestaurant"]}
 */
const createRestaurant = (restaurant) => storage.createRestaurant(restaurant)

/**
 * @type {RestaurantStorage["updateRestaurant"]}
 */
const updateRestaurant = (id, fields) => storage.updateRestaurant(id, fields)

/**
 * @type {RestaurantStorage["removeRestaurant"]}
 */
const removeRestaurant = (id) => storage.removeRestaurant(id)

/**
 * @type {RestaurantStorage["search"]}
 */
const search = (query) => storage.search(query)


export {
    createRestaurantStorage,
    createMongoRestaurantStorage,
    setRestaurantStorage,
    getAllRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    removeRestaurant,
    search
}