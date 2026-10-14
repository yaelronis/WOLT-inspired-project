// @ts-check
import jwt from "jsonwebtoken";
import { get_by_id } from "../model/users.js";

// Must be identical to the secret in controller/tokens.js.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";

/**
 *  @typedef {import("express").Request & { user_id: number }} AuthedRequest
 */

/**
 * Auth Middleware- Protects routes using a JWT.
 * Requires "Authorization: Bearer <token>" header.
 * Verifies token validity and ensures the user still exists.
 * @modifies {express.Request} Sets "req.user_id" on success (getAuthUserId).
 * @throws {401} If token is missing, invalid, or user does not exist.
 * @type {import("express").RequestHandler}
 */
const requireAuth = async (req, res, next) => {
    const header = req.get("authorization") ?? "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        res.status(401).json({ error: "missing or malformed Authorization header" });
        return;
    }

    let user_id;
    try {
        const payload = jwt.verify(match[1], JWT_SECRET);
        if (
            typeof payload !== "object" ||
            payload === null ||
            typeof (/** @type {any} */ (payload).user_id) !== "number"
        ) {
            res.status(401).json({ error: "invalid token" });
            return;
        }
        user_id = /** @type {any} */ (payload).user_id;
    } catch {
        res.status(401).json({ error: "invalid or expired token" });
        return;
    }

    const user = await get_by_id(user_id);
    if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    /** @type {AuthedRequest} */
    (req).user_id = user_id;
    next();
}

/**
 * @param {import("express").Request} req
 * @returns {number}
 */
const getAuthUserId = (req) => /** @type {AuthedRequest} */(req).user_id;

export { requireAuth, getAuthUserId };