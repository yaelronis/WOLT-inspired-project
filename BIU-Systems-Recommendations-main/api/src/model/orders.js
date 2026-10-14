// @ts-check
import mongoose from "mongoose";
import * as products from "./products.js";
/**
 * Alias for the order id type. Kept as an alias so it can change later.
 * @typedef {number} OrderId
 */

/**
 *  Id of the user that made the order (matches the users model's id).
 * @typedef {number} UserId
 */

/**
 * Ids owned by the restaurants products parts.
 * aliased here since orders only stores them. 
 * @typedef {number} RestaurantId
 * @typedef {number} ProductId
 */

/**
 * @typedef {object} Order
 * @property {OrderId} id
 * @property {UserId} user
 * @property {RestaurantId} restaurant
 * @property {ProductId[]} content - product ids ordered, may contain duplicates.
 * @property {string} created_at - datetime of POST, format "YYYY-MM-DD hh:mm".
 * @property {number} total
 * @property {boolean} cancelled - whether the order was cancelled by the user (kept in history).
 */

/**
 * The order storage interface- the data operations this model relies on. 
 * Defined by behavior and not a data shape so the array backed store below and a
 * database backed store both conform to it and can be injected without changing
 * the model functions or the controllers.
 * Same behavior as before- the only difference is every method now returns a
 * Promise (DB access is async). The Order/OrderId types are unchanged, and a
 * missing order is still reported as null.
 * @typedef {object} OrderStorage
 * @property {() => Promise<Order[]>} get_all
 * @property {(id: OrderId) => Promise<Order?>} get_by_id
 * @property {(user: UserId) => Promise<Order[]>} get_by_user
 * @property {(data: { user: UserId, restaurant: RestaurantId, content: ProductId[] }) => Promise<Order>} add
 * @property {(id: OrderId, content: ProductId[]) => Promise<Order?>} set_content
 * @property {(id: OrderId) => Promise<Order?>} set_cancelled
 * @property {(id: OrderId) => Promise<boolean>} remove
 */

/**
 * Current local time formatted as "YYYY-MM-DD hh:mm".
 * @returns {string}
 */
const now_timestamp = () => {
  const d = new Date();
  const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * @param {RestaurantId} restaurant
 * @param {ProductId[]} content
 * @returns {Promise<number>}
 */
const calculate_total = async (restaurant, content) => {
  const menu = await products.get_all(restaurant);

  return content.reduce((sum, productId) => {
    const product = menu.find((p) => p.id === productId);

    if (!product) {
      throw new Error(`unknown product: ${productId}`);
    }

    return sum + product.price;
  }, 0);
};

/**
 * Creates a fresh in memory OrderStorage.
 * The orders array and id counter are private to the closure (never exposed).
 * id and created_at are generated on add. database backed OrderStorage can implement the same interface.
 * @returns {OrderStorage}
 */
const create_order_storage = () => {
  /** @type {Order[]} */
  const orders = [];
  /** @type {OrderId} */
  let next_id = 1;
  return {
    get_all: async () => [...orders],
    get_by_id: async (id) => orders.find((o) => o.id === id) ?? null,
    get_by_user: async (user) => orders.filter((o) => o.user === user),
    add: async (data) => {


      /** @type {Order} */
      const order = {
        id: next_id++,
        user: data.user,
        restaurant: data.restaurant,
        // store a copy- content is an array, so keeping the caller's reference would
        // let a later mutation of it change the saved order (history must stay put).
        content: [...data.content],
        created_at: now_timestamp(),
        total: await calculate_total(data.restaurant, data.content),
        cancelled: false,
      };
      orders.push(order);
      return order;
    },
    set_content: async (id, content) => {
      const order = orders.find((o) => o.id === id);
      if (order === undefined) return null;
      order.content = [...content]; // store a copy (not the caller's array reference).
      order.total = await calculate_total(order.restaurant, content);
      return order;
    },
    set_cancelled: async (id) => {
      const order = orders.find((o) => o.id === id);
      if (order === undefined) return null;
      order.cancelled = true;
      return order;
    },
    remove: async (id) => {
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) return false;
      orders.splice(index, 1);
      return true;
    },
  };
};

/* MongoDB storage: the production backend */
const order_schema = new mongoose.Schema({
  id:         { type: Number, required: true, unique: true, index: true },
  user:       { type: Number, required: true, index: true },
  restaurant: { type: Number, required: true },
  // content is a list of product ids and may contain duplicates.
  content:    { type: [Number], required: true },
  created_at: { type: String, required: true },
  total:      { type: Number, required: true },
  // cancelled orders stay in history (marked), so this defaults to false.
  cancelled:  { type: Boolean, default: false },
});
const OrderModel = mongoose.model("Order", order_schema);

/**
 * Strip Mongo internals so callers always get the exact same order shape.
 * @param {any} doc
 * @returns {Order?}
 */
function clean(doc) {
  if (!doc) return null;
  const { _id, __v, ...order } = doc;
  return /** @type {Order} */ (order);
}

/**
 * Creates a MongoDB backed OrderStorage. Implements the same interface as the
 * in memory store, so the model and controllers don't change. id and created_at
 * are generated on add, exactly like the array backed store.
 * @returns {OrderStorage}
 */
const create_mongo_order_storage = () => ({
  get_all: async () =>
    /** @type {Order[]} */ ((await OrderModel.find().lean()).map(clean)),
  get_by_id: async (id) => clean(await OrderModel.findOne({ id }).lean()),
  get_by_user: async (user) =>
    /** @type {Order[]} */ ((await OrderModel.find({ user }).lean()).map(clean)),
  add: async (data) => {
    // ids start at 1 to match the previous in-memory behaviour.
    const last = await OrderModel.findOne().sort({ id: -1 }).lean();
    const id = last ? last.id + 1 : 1;
    /** @type {Order} */
    const order = {
      id,
      user: data.user,
      restaurant: data.restaurant,
      // store a copy- content is an array, so keeping the caller's reference would
      // let a later mutation of it change the saved order (history must stay put).
      content: [...data.content],
      created_at: now_timestamp(),
      total: await calculate_total(data.restaurant, data.content),
      cancelled: false,
    };
    const doc = await OrderModel.create(order);
    return /** @type {Order} */ (clean(doc.toObject()));
  },
  set_content: async (id, content) => {
    // need the order's restaurant to recompute the total.
    const existing = await OrderModel.findOne({ id }).lean();
    if (existing === null) return null;
    const total = await calculate_total(existing.restaurant, content);
    const doc = await OrderModel.findOneAndUpdate(
      { id },
      // store a copy (not the caller's array reference).
      { content: [...content], total },
      { new: true }
    ).lean();
    return doc ? clean(doc) : null;
  },
  set_cancelled: async (id) => {
    const doc = await OrderModel.findOneAndUpdate(
      { id },
      { cancelled: true },
      { new: true }
    ).lean();
    return doc ? clean(doc) : null;
  },
  remove: async (id) => {
    const doc = await OrderModel.findOneAndDelete({ id }).lean();
    return doc !== null;
  },
});

/* Active storage + injector */
/* Default is the MongoDB backend so production persists with no extra wiring. the
   test suite injects a fresh in-memory backend with set_order_storage (so tests
   never need a live Mongo). */
/**
 * The active order storage. Overwrite it only in tests or to inject a database backed implementation.
 * @type {OrderStorage}
 */
let storage = create_mongo_order_storage();

/**
 * Overwrites the active order storage (tests inject a fresh one).
 * @param {OrderStorage} next
 */
const set_order_storage = (next) => {
  storage = next;
};

/** @returns {Promise<Order[]>} a shallow copy of every order. */
const get_all = () => storage.get_all();
/**
 * @param {OrderId} id
 * @returns {Promise<Order?>} the matching order or null.
 */
const get_by_id = (id) => storage.get_by_id(id);
/**
 * @param {UserId} user
 * @returns {Promise<Order[]>} every order made by this user.
 */
const get_by_user = (user) => storage.get_by_user(user);
/**
 * @param {{ user: UserId, restaurant: RestaurantId, content: ProductId[] }} data
 * @returns {Promise<Order>} the stored order.
 */
const add = (data) => storage.add(data);
/**
 * @param {OrderId} id
 * @param {ProductId[]} content
 * @returns {Promise<Order?>} the updated order, or null if no such order.
 */
const set_content = (id, content) => storage.set_content(id, content);
/**
 * Mark an order as cancelled (kept in history).
 * @param {OrderId} id
 * @returns {Promise<Order?>} the updated order, or null if no such order.
 */
const set_cancelled = (id) => storage.set_cancelled(id);
/**
 * @param {OrderId} id
 * @returns {Promise<boolean>} whether an order was removed.
 */
const remove = (id) => storage.remove(id);

export {
  get_all,
  get_by_id,
  get_by_user,
  add,
  set_content,
  set_cancelled,
  remove,
  create_order_storage,
  create_mongo_order_storage,
  set_order_storage,
};