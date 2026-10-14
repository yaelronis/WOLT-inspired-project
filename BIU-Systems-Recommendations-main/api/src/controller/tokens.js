// @ts-check

import jwt from "jsonwebtoken";
import * as users_model from "../model/users.js";
import { getAuthUserId } from "../middleware/auth.js";

// JWT. Set JWT_SECRET in env. Fallback is for local dev only.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const JWT_EXPIRES_IN = "2h";

/**
 * POST /api/tokens- User Login.
 * 1. Validates username and password strings.
 * 2. Returns a signed JWT on success.
 * 3. Client must send token in "Authorization: Bearer <token>" header for authenticated requests.
 * @type {import("express").RequestHandler}
 */
const login = async (req, res) => {
  const body = req.body;

  if (typeof body?.username !== "string" || typeof body?.password !== "string") {
    res.status(400).json({ error: "missing or non-string credentials" });
    return;
  }

  const user = await users_model.get_by_credentials(body.username, body.password);
  if (user === null) {
    res.status(401).json({ error: "invalid username or password" });
    return;
  }

  const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.status(200).json({ token });
};

 /** @type {import("express").RequestHandler}  */
async function login_jwt(req, res) {
  const id = getAuthUserId(req);
  const user = await users_model.get_by_id(id);
  if (user === null) return res.status(500).json({error: "user logged in, but user not found"});
  const {password: _, ...rest} = user;
  return res.status(200).json(rest);
}

export { login, login_jwt };