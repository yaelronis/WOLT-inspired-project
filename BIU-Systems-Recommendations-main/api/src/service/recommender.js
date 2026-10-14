// @ts-check

/**
 * Connects to the recommendation server (ex2).
 * We send new orders here so the system learns what users like (like Wolt).
 * Product IDs are unique everywhere, so we don't need the restaurant ID. 
 * We only send (user, products) to the recommender.
 * We use an interface- "orders" code doesn't talk to the backend directly,
 * making it easy to switch between the real server and a fake mock for testing.
 * Returns null on success, or {error} so the caller (controller) can report the
 * failure instead of silently ignoring it.
 * @typedef {(user: number, products: number[]) => Promise<{ error: string } | null>} Recommender
 */

/**
 * Default: records nothing and reports success.
 * The real ex2 server is loaded when the app starts and a mock is used for testing.
 * This keeps the orders code separated from the backend, and allows tests to run 
 * without making real network requests.
 */
/** @type {Recommender} */
let current = () => Promise.resolve(null);

/**
 * @returns {Recommender} the active recommender.
 */
const get_recommender = () => current;

/**
 * Changes the active recommender.
 * The application inserts the real recommender when it starts, but tests use a mock.
 * @param {Recommender} recommender
 */
const set_recommender = (recommender) => {
  current = recommender;
};

/**
 * Connects to the ex2 recommendation server using backend.js.
 * How it records a purchase:
 * We PATCH first (append to the user's list). 204 means appended.
 * 404 means there is no list for that user yet, so we POST to create it- 201 means created.
 * "no list yet" signal is PATCH 404.
 * Any other status (or a thrown network error) is an unexpected failure and is returned
 * as {error} so the controller can respond with 500 instead of ignoring it.
 * The data format:
 * User IDs and Product IDs are sent as strings.
 * The server only tracks unique products, so duplicates are removed before sending.
 * Setup- Initialize this once when the app starts:
 * import * as backend from "<path-to>/backend.js";
 * set_recommender(backend_recommender(backend));
 * @param {{
 *   post: (user: string, products: string[]) => Promise<{ status: number }>,
 *   patch: (user: string, products: string[]) => Promise<{ status: number }>,
 * }} backend
 * @returns {Recommender}
 */
const backend_recommender = (backend) => async (user, products) => {
  const ids = [...new Set(products)].map((product) => String(product));
  try {
    const appended = await backend.patch(String(user), ids);
    if (appended.status === 204) return null; // user already had a list- appended.
    if (appended.status !== 404) {
      // 404 means no list for this user yet (created below). anything else is unexpected.
      return { error: `recommender PATCH failed (status ${appended.status})` };
    }
    const created = await backend.post(String(user), ids); // no list yet- create it.
    if (created.status === 201) return null;
    return { error: `recommender POST failed (status ${created.status})` };
  } catch (e) {
    return { error: `recommender request failed: ${e instanceof Error ? e.message : String(e)}` };
  }
};

/**
 * In-process recommender. Records each user's purchased products in memory and
 * reports success, with no external ex2 server. This lets the app run standalone
 * (e.g. `node api/src/app.js` with no host/port) for development and demos.
 * @returns {Recommender}
 */
const memory_recommender = () => {
  /** @type {Map<number, Set<number>>} */
  const lists = new Map();
  return async (user, products) => {
    const set = lists.get(user) ?? new Set();
    for (const product of products) set.add(product);
    lists.set(user, set);
    return null;
  };
};

export { get_recommender, set_recommender, backend_recommender, memory_recommender };