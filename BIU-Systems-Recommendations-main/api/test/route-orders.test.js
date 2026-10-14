// @ts-check

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  list_orders,
  create_order,
  get_order,
  update_order,
  delete_order,
  cancel_order,
} from "../src/controller/orders.js";
import { requireAuth } from "../src/middleware/auth.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
/** @param {number} user_id */
const sign_token = (user_id) => jwt.sign({ user_id }, JWT_SECRET, { expiresIn: "2h" });
import { create_order_storage, set_order_storage, get_by_id as orders_model_get_by_id } from "../src/model/orders.js";
import { set_recommender, backend_recommender } from "../src/service/recommender.js";
import * as users_model from "../src/model/users.js";
import * as restaurants from "../src/model/restaurants.js";
import * as products from "../src/model/products.js";

/**
 * The order code talks to the real restaurant + product models directly (no catalog
 * seam), so each test seeds them with beforeEach and uses the ids the models assign.
 * RID is the restaurant under test, OTHER_RID a different one, MENU1 its four products,
 * and OTHER_PRODUCT a product that exists only at OTHER_RID. 9999 is an id never created.
 */
let RID = 0;
let OTHER_RID = 0;
let OTHER_PRODUCT = 0;
/** @type {number[]} */
let MENU1 = [];

/** What the (mocked) recommender was asked to record on a purchase. */
/** @type {{ user: number, products: number[] }[]} */
let recommended = [];

/**
 * A stub express response that records what the controller sent back.
 * @typedef {object} RecordingRes
 * @property {number} statusCode
 * @property {any} body
 * @property {Record<string, string>} headers
 * @property {boolean} ended
 * @property {(code: number) => RecordingRes} status
 * @property {(payload: unknown) => RecordingRes} json
 * @property {(url: string) => RecordingRes} location
 * @property {() => RecordingRes} end
 */

/** @returns {RecordingRes} */
const make_res = () => {
  /** @type {RecordingRes} */
  const res = /** @type {RecordingRes} */ ({});
  res.statusCode = 0;
  res.body = undefined;
  res.headers = {};
  res.ended = false;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; res.ended = true; return res; };
  res.location = (url) => { res.headers["Location"] = url; return res; };
  res.end = () => { res.ended = true; return res; };
  return res;
};

/**
 * A stub Express request- the "user_id" header carries the user id.
 * @param {{ headers?: Record<string, string>, params?: Record<string, string>, body?: unknown }} [opts]
 */
const make_req = ({ headers = {}, params = {}, body = undefined } = {}) => ({
  get: (/** @type {string} */ name) => headers[name.toLowerCase()],
  params,
  body,
});

/**
 * Invoke a controller exactly as a real request would: run requireAuth first
 * (attaching user_id) and only then the handler, awaiting it so async controllers
 * (create/update await the recommender) have finished by the time res is read.
 * "auth" is the user id to sign a JWT for.
 * @param {import("express").RequestHandler} handler
 * @param {string | number} auth
 * @param {{ params?: Record<string, string>, body?: unknown }} [opts]
 * @returns {Promise<RecordingRes>}
 */
const call = async (handler, auth, { params = {}, body } = {}) => {
  const token = sign_token(Number(auth));
  const req = make_req({ headers: { authorization: `Bearer ${token}` }, params, body });
  const res = make_res();
  let passed = false;
  await requireAuth(/** @type {any} */ (req), /** @type {any} */ (res), () => { passed = true; });
  if (passed) await handler(/** @type {any} */ (req), /** @type {any} */ (res), () => {});
  return res;
};

/**
 * @param {string | number} auth
 * @param {number[]} [content]
 * @param {number} [restaurant]
 * @returns {Promise<RecordingRes>}
 */
const create_as = async (auth, content = [MENU1[0], MENU1[1]], restaurant = RID) =>
  await call(create_order, auth, { body: { restaurant, content } });

/**
 * requireAuth only lets a request in if the user id
 * actually exists in the users model. So the test creates the users it logs in
 * as: ids 1..9 are created here, which covers the ids 5 and 9 used below.
 */
const seed_users = async () => {
  for (let i = 1; i <= 9; i++) {
    await users_model.add({ username: `user_${i}`, password: "p", name: "n", role:"user", image: "data:image/png;base64,AAAA", location: { lat: 0, lng: 0 } });
  }
};

beforeEach(async () => {
  set_order_storage(create_order_storage());
  // fresh users every test, then create the ones the test authenticates as.
  users_model.set_user_storage(users_model.create_user_storage());
  await seed_users();
  recommended = [];
  set_recommender(async (user, products) => {
    recommended.push({ user, products });
    return null;
  });
  // Rebuild the real restaurant + product models fresh, then seed a menu and remember
  // the ids the models handed back (ids are model generated, not chosen by us).
  restaurants.setRestaurantStorage(restaurants.createRestaurantStorage());
  products.set_products_storage(products.create_products_storage());
  RID = (await restaurants.createRestaurant({ name: "Pizza Place", address: "1 Main",
  description: "pizza", category: "Italian", vegetarian: false, promoted: false, rating: 0, imgURL: "", location: { lat: 0, lng: 0 } })).id;
  OTHER_RID = (await restaurants.createRestaurant({ name: "Sushi Bar", address: "2 Main",
  description: "sushi", category: "Asian", vegetarian: false, promoted: false, rating: 0, imgURL: "", location: { lat: 0, lng: 0 } })).id;
  MENU1 = [
  (await products.add(RID, { name: "Margherita",   price: 50, category: "Mains", pic: "" })).id,
  (await products.add(RID, { name: "Pepperoni",    price: 55, category: "Mains", pic: "" })).id,
  (await products.add(RID, { name: "Calzone",      price: 60, category: "Mains", pic: "" })).id,
  (await products.add(RID, { name: "Garlic Bread", price: 20, category: "Sides", pic: "" })).id,
  ];
  OTHER_PRODUCT = (await products.add(OTHER_RID, { name: "Maki", price: 40, category: "Mains", pic: "" })).id;
});

// Auth tests.

test("requireAuth rejects a missing token with 401", async () => {
  const req = make_req({ headers: {} });
  const res = make_res();
  let passed = false;
  await requireAuth(/** @type {any} */ (req), /** @type {any} */ (res), () => { passed = true; });
  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

test("requireAuth rejects an invalid token with 401", async () => {
  const req = make_req({ headers: { authorization: "Bearer not.a.valid.token" } });
  const res = make_res();
  let passed = false;
  await requireAuth(/** @type {any} */ (req), /** @type {any} */ (res), () => { passed = true; });
  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

test("requireAuth accepts a valid token for a real user and calls next", async () => {
  const req = make_req({ headers: { authorization: `Bearer ${sign_token(5)}` } });
  const res = make_res();
  let passed = false;
  await requireAuth(/** @type {any} */ (req), /** @type {any} */ (res), () => { passed = true; });
  assert.equal(passed, true);
});

test("requireAuth rejects a valid token for an unknown user with 401", async () => {
  const req = make_req({ headers: { authorization: `Bearer ${sign_token(999)}` } }); // 999 was never created
  const res = make_res();
  let passed = false;
  await requireAuth(/** @type {any} */ (req), /** @type {any} */ (res), () => { passed = true; });
  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
});

// Create tests.

test("create returns 201 with a Location header and the new order id", async () => {
  const res = await call(create_order, "5", { body: { restaurant: RID, content: [MENU1[0], MENU1[1]] } });
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers["Location"], "/api/orders/1");
  assert.deepEqual(res.body, { id: 1 });
});

test("create rejects a non-number restaurant with 400", async () => {
  const res = await call(create_order, "5", { body: { restaurant: "1", content: [MENU1[0]] } });
  assert.equal(res.statusCode, 400);
});

test("create rejects content that is not an array of numbers with 400", async () => {
  const res = await call(create_order, "5", { body: { restaurant: RID, content: ["a", "b"] } });
  assert.equal(res.statusCode, 400);
});

test("create rejects an empty order with 400 and records nothing", async () => {
  const res = await call(create_order, "5", { body: { restaurant: RID, content: [] } });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(recommended, []);
});

test("create stamps created_at as YYYY-MM-DD hh:mm", async () => {
  await create_as("5");
  const res = await call(get_order, "5", { params: { id: "1" } });
  assert.match(res.body.created_at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
});

test("placing an order (buying) records the products to recommendations", async () => {
  await create_as("5", [MENU1[0], MENU1[1]]);
  assert.deepEqual(recommended, [{ user: 5, products: [MENU1[0], MENU1[1]] }]);
});

test("create rejects an unknown restaurant with 400 and records nothing", async () => {
  const res = await create_as("5", [MENU1[0]], 9999);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(recommended, []);
});

test("create rejects a product not on the restaurant's menu with 400 and records nothing", async () => {
  const res = await call(create_order, "5", { body: { restaurant: RID, content: [MENU1[0], 9999] } });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(recommended, []);
});

test("create rejects a product that exists only at another restaurant with 400", async () => {
  const res = await call(create_order, "5", { body: { restaurant: RID, content: [OTHER_PRODUCT] } });
  assert.equal(res.statusCode, 400);
});

test("create calculates the order total from product prices", async () => {
  await create_as("5", [MENU1[0], MENU1[1], MENU1[3]]);

  const res = await call(get_order, "5", { params: { id: "1" } });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 125);
});

// List tests.

test("list returns only the logged-in user's orders", async () => {
  await create_as("5", [MENU1[0]]);
  await create_as("9", [MENU1[1]]);
  await create_as("5", [MENU1[2]]);
  const res = await call(list_orders, "5");
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 2);
  assert.ok(res.body.every((/** @type {{ user: number }} */ o) => o.user === 5));
});

// Get tests.

test("get returns the owner's order with 200", async () => {
  await create_as("5");
  const res = await call(get_order, "5", { params: { id: "1" } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, 1);
});

test("get returns 404 for an unknown id", async () => {
  const res = await call(get_order, "5", { params: { id: "999" } });
  assert.equal(res.statusCode, 404);
});

test("get returns 404 when the order belongs to another user", async () => {
  await create_as("5");
  const res = await call(get_order, "9", { params: { id: "1" } });
  assert.equal(res.statusCode, 404);
});

// Patch tests.

test("patch updates the owner's content and returns 204", async () => {
  await create_as("5", [MENU1[0]]);
  const patched = await call(update_order, "5", { params: { id: "1" }, body: { content: [MENU1[3], MENU1[3]] } });
  assert.equal(patched.statusCode, 204);
  const got = await call(get_order, "5", { params: { id: "1" } });
  assert.deepEqual(got.body.content, [MENU1[3], MENU1[3]]);
});

test("editing an order records the new products to recommendations too", async () => {
  await create_as("5", [MENU1[0]]);
  recommended = []; // ignore what the create recorded; we want the edit's record
  await call(update_order, "5", { params: { id: "1" }, body: { content: [MENU1[1], MENU1[2]] } });
  assert.deepEqual(recommended, [{ user: 5, products: [MENU1[1], MENU1[2]] }]);
});

test("patch returns 404 for unknown id and 400 for bad content", async () => {
  assert.equal((await call(update_order, "5", { params: { id: "999" }, body: { content: [MENU1[0]] } })).statusCode, 404);
  await create_as("5", [MENU1[0]]);
  assert.equal((await call(update_order, "5", { params: { id: "1" }, body: { content: "nope" } })).statusCode, 400);
});

test("patch rejects emptying an order with 400, order intact", async () => {
  await create_as("5", [MENU1[0]]);
  assert.equal((await call(update_order, "5", { params: { id: "1" }, body: { content: [] } })).statusCode, 400);
  assert.deepEqual((await call(get_order, "5", { params: { id: "1" } })).body.content, [MENU1[0]]);
});

test("patch rejects a product not on the order's restaurant menu with 400, order intact", async () => {
  await create_as("5", [MENU1[0]]);
  assert.equal((await call(update_order, "5", { params: { id: "1" }, body: { content: [9999] } })).statusCode, 400);
  assert.deepEqual((await call(get_order, "5", { params: { id: "1" } })).body.content, [MENU1[0]]);
});

test("patch returns 404 when the order belongs to another user, leaving it intact", async () => {
  await create_as("5", [MENU1[0]]);
  assert.equal((await call(update_order, "9", { params: { id: "1" }, body: { content: [MENU1[3]] } })).statusCode, 404);
  assert.deepEqual((await call(get_order, "5", { params: { id: "1" } })).body.content, [MENU1[0]]);
});

test("patch recalculates total after changing content", async () => {
  await create_as("5", [MENU1[0]]);

  const patched = await call(update_order, "5", {
    params: { id: "1" },
    body: { content: [MENU1[2], MENU1[3]] },
  });

  assert.equal(patched.statusCode, 204);

  const got = await call(get_order, "5", { params: { id: "1" } });

  assert.equal(got.statusCode, 200);
  assert.deepEqual(got.body.content, [MENU1[2], MENU1[3]]);
  assert.equal(got.body.total, 80); // 60 + 20
});

// Delete tests

test("delete removes the owner's order (204) and then it is gone (404)", async () => {
  await create_as("5");
  assert.equal((await call(delete_order, "5", { params: { id: "1" } })).statusCode, 204);
  assert.equal((await call(get_order, "5", { params: { id: "1" } })).statusCode, 404);
});

test("delete returns 404 for an unknown id", async () => {
  assert.equal((await call(delete_order, "5", { params: { id: "999" } })).statusCode, 404);
});

test("delete returns 404 when the order belongs to another user, leaving it intact", async () => {
  await create_as("5");
  assert.equal((await call(delete_order, "9", { params: { id: "1" } })).statusCode, 404);
  assert.equal((await call(get_order, "5", { params: { id: "1" } })).statusCode, 200);
});

// The stored order keeps a copy of content, so mutating the caller's array afterwards
// must not change the saved order.

test("the stored order is not affected by later mutation of the caller's array", async () => {
  const items = [MENU1[0], MENU1[1]];
  await create_as("5", items);
  items.push(MENU1[2]); // mutate the array we passed in
  const got = await call(get_order, "5", { params: { id: "1" } });
  assert.deepEqual(got.body.content, [MENU1[0], MENU1[1]]);
});

// Error handling- a failed recording is reported, not silently swallowed.

test("a recommender failure makes create return 500 with the error", async () => {
  set_recommender(async () => ({ error: "ex2 unavailable" }));
  const res = await call(create_order, "5", { body: { restaurant: RID, content: [MENU1[0]] } });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "ex2 unavailable" });
});

test("a recommender failure makes patch return 500 with the error", async () => {
  await create_as("5", [MENU1[0]]);
  set_recommender(async () => ({ error: "ex2 unavailable" }));
  const res = await call(update_order, "5", { params: { id: "1" }, body: { content: [MENU1[1]] } });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "ex2 unavailable" });
});

// Cancel tests.

test("cancel marks a fresh order as cancelled (200) and keeps it in history", async () => {
  await create_as("5");
  const res = await call(cancel_order, "5", { params: { id: "1" } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.cancelled, true);
  // still retrievable (kept in history, just flagged).
  const got = await call(get_order, "5", { params: { id: "1" } });
  assert.equal(got.statusCode, 200);
  assert.equal(got.body.cancelled, true);
});

test("cancel returns 404 for an unknown id", async () => {
  assert.equal((await call(cancel_order, "5", { params: { id: "999" } })).statusCode, 404);
});

test("cancel returns 404 when the order belongs to another user", async () => {
  await create_as("5");
  assert.equal((await call(cancel_order, "9", { params: { id: "1" } })).statusCode, 404);
});

test("cancel is idempotent: cancelling an already-cancelled order returns 200", async () => {
  await create_as("5");
  await call(cancel_order, "5", { params: { id: "1" } });
  const again = await call(cancel_order, "5", { params: { id: "1" } });
  assert.equal(again.statusCode, 200);
  assert.equal(again.body.cancelled, true);
});

test("cancel is refused with 403 once 15 minutes have passed", async () => {
  await create_as("5");
  // Force the stored order's created_at to be 16 minutes ago.
  const sixteen_min_ago = new Date(Date.now() - 16 * 60 * 1000);
  const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");
  const stamp = `${sixteen_min_ago.getFullYear()}-${pad(sixteen_min_ago.getMonth() + 1)}-${pad(sixteen_min_ago.getDate())} ${pad(sixteen_min_ago.getHours())}:${pad(sixteen_min_ago.getMinutes())}`;
  const order = await orders_model_get_by_id(1);
  if (order) order.created_at = stamp;
  const res = await call(cancel_order, "5", { params: { id: "1" } });
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "cant cancel an order after 15 minutes" });
});

// Cancel with PATCH { cancelled: true } on the existing /orders/:id route.

test("patch { cancelled: true } cancels a fresh order (200) and keeps it", async () => {
  await create_as("5");
  const res = await call(update_order, "5", { params: { id: "1" }, body: { cancelled: true } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.cancelled, true);
  const got = await call(get_order, "5", { params: { id: "1" } });
  assert.equal(got.body.cancelled, true);
});

test("patch { cancelled: true } returns 404 for another user's order", async () => {
  await create_as("5");
  assert.equal(
    (await call(update_order, "9", { params: { id: "1" }, body: { cancelled: true } })).statusCode,
    404
  );
});

test("patch { cancelled: true } is refused with 403 after 15 minutes", async () => {
  await create_as("5");
  const past = new Date(Date.now() - 16 * 60 * 1000);
  const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");
  const stamp = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())} ${pad(past.getHours())}:${pad(past.getMinutes())}`;
  const order = await orders_model_get_by_id(1);
  if (order) order.created_at = stamp;
  const res = await call(update_order, "5", { params: { id: "1" }, body: { cancelled: true } });
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "cant cancel an order after 15 minutes" });
});

test("patch with content still updates normally (cancel branch doesn't interfere)", async () => {
  await create_as("5", [MENU1[0]]);
  const res = await call(update_order, "5", { params: { id: "1" }, body: { content: [MENU1[3], MENU1[3]] } });
  assert.equal(res.statusCode, 204);
  const got = await call(get_order, "5", { params: { id: "1" } });
  assert.deepEqual(got.body.content, [MENU1[3], MENU1[3]]);
  assert.equal(got.body.cancelled, false);
});

// backend_recommender (the ex2 adapter): PATCH first, and POST only when PATCH says 404
// (no list yet). Products cross to ex2 as their (global) id strings.

test("backend_recommender: a returning buyer is appended in ex2 (PATCH 204, no POST)", async () => {
  /** @type {any[]} */
  const calls = [];
  /** @type {{ post: (u: string, p: string[]) => Promise<{ status: number }>, patch: (u: string, p: string[]) => Promise<{ status: number }> }} */
  const fake = {
    patch: async (u, p) => { calls.push(["patch", u, p]); return { status: 204 }; },
    post: async (u, p) => { calls.push(["post", u, p]); return { status: 201 }; },
  };
  assert.equal(await backend_recommender(fake)(5, [101, 102]), null);
  assert.deepEqual(calls, [["patch", "5", ["101", "102"]]]);
});

test("backend_recommender: a first-time buyer is created in ex2 (PATCH 404 -> POST 201)", async () => {
  /** @type {any[]} */
  const calls = [];
  /** @type {{ post: (u: string, p: string[]) => Promise<{ status: number }>, patch: (u: string, p: string[]) => Promise<{ status: number }> }} */
  const fake = {
    patch: async (u, p) => { calls.push(["patch", u, p]); return { status: 404 }; },
    post: async (u, p) => { calls.push(["post", u, p]); return { status: 201 }; },
  };
  assert.equal(await backend_recommender(fake)(7, [103]), null);
  assert.deepEqual(calls, [["patch", "7", ["103"]], ["post", "7", ["103"]]]);
});

test("backend_recommender: duplicate products in one order are sent once", async () => {
  /** @type {any[]} */
  const calls = [];
  /** @type {{ post: (u: string, p: string[]) => Promise<{ status: number }>, patch: (u: string, p: string[]) => Promise<{ status: number }> }} */
  const fake = {
    patch: async (u, p) => { calls.push(["patch", u, p]); return { status: 204 }; },
    post: async (u, p) => { calls.push(["post", u, p]); return { status: 201 }; },
  };
  await backend_recommender(fake)(5, [101, 101, 102]);
  assert.deepEqual(calls, [["patch", "5", ["101", "102"]]]);
});

test("backend_recommender: an unexpected PATCH status is reported as an error", async () => {
  /** @type {{ post: (u: string, p: string[]) => Promise<{ status: number }>, patch: (u: string, p: string[]) => Promise<{ status: number }> }} */
  const fake = {
    patch: async () => ({ status: 500 }),
    post: async () => ({ status: 201 }),
  };
  assert.deepEqual(await backend_recommender(fake)(5, [101]), {
    error: "recommender PATCH failed (status 500)",
  });
});

test("backend_recommender: an unexpected POST status (after PATCH 404) is reported as an error", async () => {
  /** @type {{ post: (u: string, p: string[]) => Promise<{ status: number }>, patch: (u: string, p: string[]) => Promise<{ status: number }> }} */
  const fake = {
    patch: async () => ({ status: 404 }),
    post: async () => ({ status: 500 }),
  };
  assert.deepEqual(await backend_recommender(fake)(5, [101]), {
    error: "recommender POST failed (status 500)",
  });
});