// @ts-check
import mongoose from "mongoose";

/** @typedef {number} RestaurantID */
/** @typedef {number} ProductID */

/**
 * @typedef {Object} Product
 * @prop {ProductID} id
 * @prop {String} name
 * @prop {Number} price
 * @prop {String} category
 * @prop {String} pic
 */

/** @typedef {Omit<Product, "id">} ProductPreInsert */
/** @typedef {Partial<ProductPreInsert>} ProductFields */

/**
 * Same behavior as before- the only difference is every method now
 * returns a Promise (DB access is async). The Product/ ProductID/RestaurantID
 * *types* are unchanged.
 *
 * @typedef {Object} ModelProducts
 *
 * @prop {(restaurant: RestaurantID) => Promise<Product[]>} get_all
 * get products associated with restaurant's menu.
 *
 * @prop {(restaurant: RestaurantID, product: ProductPreInsert) => Promise<Product>} add
 * add new product to a restaurant's menu.
 *
 * @prop {(restaurant: RestaurantID, product: ProductID) => Promise<Product?>} get
 * get product using id's of it and it's restaurant, if it exists.
 *
 * @prop {(restaurant: RestaurantID, product: ProductID, fields: ProductFields) => Promise<Product?>} modify
 * modifies product's fields, found with the ids of restaurant and product,
 * if product does not exist, returns null.
 *
 * @prop {(restaurant: RestaurantID, product: ProductID) => Promise<Product?>} remove
 * deletes a product from a restaurant's menu.
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
 * Strip Mongo internals so callers always get the exact same Product shape.
 * @param {any} doc
 * @returns {Product | null}
 */
function clean(doc) {
    if (!doc) return null;
    const { _id, __v, restaurant, ...product } = doc;
    return /** @type {Product} */ (product);
}

/* In-memory storage: the TEST backend */
/**
 * A fresh, isolated in-memory product store. Identical behaviour to the previous
 * model, just async. Each call returns its own state so tests never share or
 * mutate each other's data.
 * @returns {ModelProducts}
 */
export const create_products_storage = () => {
    /** @type {Map<RestaurantID, Product[]>} */
    const map = new Map();
    let next_id = 0;
    return {
        get_all: async (restaurant_id) => {
            const array = map.get(restaurant_id) ?? [];
            return array.map((p) => ({ ...p }));
        },

        add: async (restaurant_id, product_pre_insert) => {
            const product = { ...product_pre_insert, id: next_id++ };
            const products = map.get(restaurant_id) ?? [];
            products.push(product);
            map.set(restaurant_id, products);
            return { ...product };
        },

        get: async (restaurant_id, product_id) => {
            const products = map.get(restaurant_id) ?? [];
            const product = products.find((item) => item.id === product_id);
            return product ? { ...product } : null;
        },

        modify: async (restaurant_id, product_id, fields) => {
            fields = filter_undefined_fields(fields);
            const products = map.get(restaurant_id);
            if (products === undefined) return null;
            const index = products.findIndex((item) => item.id === product_id);
            if (index === -1) return null;
            const modified = { ...products[index], ...fields };
            products[index] = modified;
            return { ...modified };
        },

        remove: async (restaurant_id, product_id) => {
            const products = map.get(restaurant_id) ?? [];
            const index = products.findIndex((obj) => obj.id === product_id);
            if (index === -1) return null;
            const [product] = products.splice(index, 1);
            map.set(restaurant_id, products);
            return { ...product };
        },
    };
};

/* MongoDB storage: the production backend*/
const product_schema = new mongoose.Schema({
    // restaurant is stored as a plain field (products are scoped per restaurant).
    restaurant: { type: Number, required: true, index: true },
    id:         { type: Number, required: true, unique: true, index: true },
    name:       { type: String, required: true },
    price:      { type: Number, required: true },
    category:   { type: String, required: true },
    // pic is not required.
    pic:        { type: String, default: "" },
});
const ProductModel = mongoose.model("Product", product_schema);

/** @returns {ModelProducts} */
export const create_mongo_products_storage = () => ({
    get_all: async (restaurant_id) =>
        /** @type {Product[]} */ (
            (await ProductModel.find({ restaurant: restaurant_id }).lean()).map(clean)
        ),

    add: async (restaurant_id, product_pre_insert) => {
        // keeps ProductID = number.
        const last = await ProductModel.findOne().sort({ id: -1 }).lean();
        const id = last ? last.id + 1 : 0;
        const doc = await ProductModel.create({ id, restaurant: restaurant_id, ...product_pre_insert });
        return /** @type {Product} */ (clean(doc.toObject()));
    },

    get: async (restaurant_id, product_id) =>
        clean(await ProductModel.findOne({ restaurant: restaurant_id, id: product_id }).lean()),

    modify: async (restaurant_id, product_id, fields) => {
        const update = filter_undefined_fields(fields);
        const doc = await ProductModel.findOneAndUpdate(
            { restaurant: restaurant_id, id: product_id },
            update,
            { new: true }
        ).lean();
        return clean(doc);
    },

    remove: async (restaurant_id, product_id) =>
        clean(await ProductModel.findOneAndDelete({ restaurant: restaurant_id, id: product_id }).lean()),
});

/* Active storage + injector*/
/* Default is the MongoDB backend so production persists with no extra wiring. the
   test suite injects a fresh in-memory backend with set_products_storage (so tests
   never need a live Mongo). */
/** @type {ModelProducts} */
let storage = create_mongo_products_storage();
/** @param {ModelProducts} next */
export const set_products_storage = (next) => { storage = next; };

/** @param {RestaurantID} restaurant */
export const get_all = (restaurant) => storage.get_all(restaurant);
/** @param {RestaurantID} restaurant @param {ProductPreInsert} product */
export const add = (restaurant, product) => storage.add(restaurant, product);
/** @param {RestaurantID} restaurant @param {ProductID} product */
export const get = (restaurant, product) => storage.get(restaurant, product);
/** @param {RestaurantID} restaurant @param {ProductID} product @param {ProductFields} fields */
export const modify = (restaurant, product, fields) => storage.modify(restaurant, product, fields);
/** @param {RestaurantID} restaurant @param {ProductID} product */
export const remove = (restaurant, product) => storage.remove(restaurant, product);