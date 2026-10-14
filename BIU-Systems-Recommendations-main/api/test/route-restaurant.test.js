// @ts-check

import { test, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";

import {
    createRestaurant,
    getRestaurantById,
    deleteRestaurant,
    updateRestaurant,
    search
} from "../src/controller/restaurants.js"

import { createRestaurantStorage, setRestaurantStorage } from "../src/model/restaurants.js";
import * as ProductsController from "../src/controller/products.js";
import * as MockResponse from "./mock/response.js";
import * as ProductsModel from "../src/model/products.js";


/**
 * Records what the controller sent back.
 * @typedef {object} RecordingRes
 * @property {number} statusCode
 * @property {unknown} payload
 * @property {string | undefined} loc
 * @property {(code: number) => RecordingRes} status
 * @property {(body: unknown) => RecordingRes} json
 * @property {(l: string) => RecordingRes} location
 * @property {() => RecordingRes} end
 */

/**
 * Invoke a controller. "body" is the JSON body. "params" carries route params like :id.
 * Body/validation in, status out.
 * @param {import("express").RequestHandler} handler
 * @param {unknown} body
 * @param {Record<string, string>} [params]
 * @returns {RecordingRes}
 */
const run = MockResponse.run;
const run_async = MockResponse.run_async;

let n = 0;

const uniq = () => `restaurant_${Date.now()}_${n++}`;

const fullRestaurant = (
    /** @type {string} */ name
) => ({
    name,
    address: "Tel Aviv",
    description: "Italian food",
    category: "Italian",
    vegetarian: false,
    promoted: false,
    rating: 4,
    imgURL: "",
    location: { lat: 32.0853, lng: 34.7818 }
});

const invalidRestaurantMissingName = () => ({
    address: "Tel Aviv",
    description: "Italian food"
});
/** 
 * @param {RecordingRes} res 
 * @returns {string} id parsed from Location header.
 */
const created_id = (res) => String(res.loc).split("/").pop() ?? "";
// Fresh isolated storage before each test- no shared state or side effects.
beforeEach(async () => {
    setRestaurantStorage(createRestaurantStorage())
    ProductsModel.set_products_storage(ProductsModel.create_products_storage());
    ProductsController.mockables.backend_remove_product = async function (_) {
        return null;
    }
})
// valid tests.
test("create: a complete valid body is accepted (201 + Location)", async () => {
    const res = await run_async(createRestaurant, fullRestaurant(uniq()));
    assert.equal(res.statusCode, 201);
    assert.match(String(res.loc), /^\/api\/restaurants\/\d+$/);
});

test("get: existing restaurant returns restaurant (200)", async () => {
    const name = uniq();
    const createRes = await run_async(createRestaurant, fullRestaurant(name));
    const id = created_id(createRes);

    const getRes = await run_async(getRestaurantById, undefined, { id });
    assert.equal(getRes.statusCode, 200);

    const restaurant = /** @type {any} */ (getRes.payload);

    assert.equal(restaurant.name, name);

});

test("delete: removes restaurant and its products successfully (204)", async () => {
    const id_str = created_id(await run_async(createRestaurant, fullRestaurant(uniq())));
    const restaurant_id = Number(id_str);
    await ProductsModel.add(restaurant_id, { name: "Test Product", price: 10, category: "Mains", pic: "" });
    const res = await run_async(deleteRestaurant, undefined, { id: id_str });
    assert.equal(res.statusCode, 204);
    assert.deepEqual(await ProductsModel.get_all(restaurant_id), []);
});

test("patch: update restaurant fields", async () => {
    const id = created_id(await run_async(createRestaurant, fullRestaurant(uniq())))
    const res = await run_async(updateRestaurant, { address: "Jerusalem" }, { id });
    assert.equal(res.statusCode, 200)
    const restaurant = /** @type {any} */ (res.payload)
    assert.equal(restaurant.address, "Jerusalem")
    assert.equal(restaurant.description, "Italian food");
})

test("search: existing restaurant returns matching restaurants", async () => {
    const name = uniq();
    await run_async(createRestaurant, fullRestaurant(name));
    const res = await run_async(search, undefined, { query: name });
    assert.equal(res.statusCode, 200);
    const result = /** @type {any[]} */ (res.payload);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, name);
});

test("search: partial name returns restaurant", async () => {
    await run_async(createRestaurant, fullRestaurant(uniq()));
    const res = await run_async(search, undefined, {
        query: "Ital"
    });
    const result = /** @type {any[]} */ (res.payload);
    assert.equal(result.length, 1);
    assert.equal(result[0].description, "Italian food");
});
//

test("get: non exsiting id returns 404", async () => {
    const res = await run_async(getRestaurantById, undefined, { id: "1" })
    assert.equal(res.statusCode, 404)
})

test("create_restaurant: missing name returns 400", async () => {
    const res = await run_async(createRestaurant, invalidRestaurantMissingName())
    assert.equal(res.statusCode, 400);
});


test("delete_restaurant: missing restaurant returns 404", async () => {
    const res = await run_async(deleteRestaurant, undefined, { id: '999' })
    assert.equal(res.statusCode, 404);
});

test("patch: non existing restaurant returns 404", async () => {
    const res = await run_async(
        updateRestaurant,
        { address: "Jerusalem" },
        { id: "999999" }
    );

    assert.equal(res.statusCode, 404);
});