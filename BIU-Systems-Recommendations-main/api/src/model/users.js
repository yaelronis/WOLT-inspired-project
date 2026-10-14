// @ts-check
import mongoose from "mongoose";

/** @typedef {number} UserID */
/** @typedef {{ lat: number, lng: number }} Location */
/**
 * @typedef {object} User
 * @property {UserID} id
 * @property {string} username
 * @property {string} password
 * @property {string} name
 * @property {string} image
 * @property {Location} location
 * @property {"owner" | "user"} role
 */

/**
 * Same behavior as before- only difference is every method now
 * returns a Promise (DB access is async). The User/UserID types are unchanged.
 * @typedef {object} UserStorage
 * @property {() => Promise<User[]>} get_all
 * @property {(id: UserID) => Promise<User?>} get_by_id
 * @property {(username: string, password: string) => Promise<User?>} get_by_credentials
 * @property {(username: string) => Promise<boolean>} exists_by_username
 * @property {(data: Omit<User, "id">) => Promise<User>} add
 */

/**
 * Strip Mongo internals so callers always get the exact same User shape.
 * @param {any} doc
 * @returns {User | null}
 */
function clean(doc) {
  if (!doc) return null;
  const { _id, __v, ...user } = doc;
  return /** @type {User} */ (user);
}

/* In-memory storage: the TEST backend */
/** @returns {UserStorage} */
export const create_user_storage = () => {
  /** @type {User[]} */
  const users = [];
  let next_id = 1;
  return {
    get_all: async () => users.map((u) => ({ ...u })),
    get_by_id: async (id) => { const u = users.find((u) => u.id === id); return u ? { ...u } : null; },
    get_by_credentials: async (username, password) => {
      const u = users.find((u) => u.username === username && u.password === password);
      return u ? { ...u } : null;
    },
    exists_by_username: async (username) => users.some((u) => u.username === username),
    add: async (data) => { const user = { id: next_id++, ...data }; users.push(user); return { ...user }; },
  };
};

/* MongoDB storage: the PRODUCTION backend */
const location_schema = new mongoose.Schema(
  { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  { _id: false }
);
const user_schema = new mongoose.Schema({
  id:       { type: Number, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name:     { type: String, required: true },
  image:    { type: String, required: true },
  location: { type: location_schema, required: true },
  role:     { type: String, required: true, enum: ["owner", "user"] },
});
const UserModel = mongoose.model("User", user_schema);

/** @returns {UserStorage} */
export const create_mongo_user_storage = () => ({
  get_all: async () => /** @type {User[]} */ ((await UserModel.find().lean()).map(clean)),
  get_by_id: async (id) => clean(await UserModel.findOne({ id }).lean()),
  get_by_credentials: async (username, password) =>
    clean(await UserModel.findOne({ username, password }).lean()),
  exists_by_username: async (username) => (await UserModel.exists({ username })) !== null,
  add: async (data) => {
    // keeps UserID = number.
    const last = await UserModel.findOne().sort({ id: -1 }).lean();
    const id = last ? last.id + 1 : 1;
    const doc = await UserModel.create({ id, ...data });
    return /** @type {User} */ (clean(doc.toObject()));
  },
});

/* Active storage + injector */
/* Default is the MongoDB backend so production persists with no extra wiring. the
   test suite injects a fresh in-memory backend with set_user_storage (so tests
   never need a live Mongo). */
/** @type {UserStorage} */
let storage = create_mongo_user_storage();
/** @param {UserStorage} next */
export const set_user_storage = (next) => { storage = next; };

export const get_all = () => storage.get_all();
/** @param {UserID} id */
export const get_by_id = (id) => storage.get_by_id(id);
export const get_by_credentials = (/** @type {string} */ u, /** @type {string} */ p) => storage.get_by_credentials(u, p);
export const exists_by_username = (/** @type {string} */ u) => storage.exists_by_username(u);
export const add = (/** @type {Omit<User,"id">} */ data) => storage.add(data);