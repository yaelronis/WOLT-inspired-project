// @ts-check

import * as users_model from "../model/users.js";

/**
* Server side registration validation (Mirrors client/web/src/utils/validation.js from ex4).
 * Expects type checked values.
 * @returns {string|null} Error message string, or null if valid.
 */

/** @param {string} v */
const validate_name = (v) => {
  const t = v.trim();
  if (t.length < 2) return "name must be at least 2 characters";
  if (t.length > 50) return "name must be at most 50 characters";
  if (!/^[a-zA-Z\s-]+$/.test(t)) return "name may only contain letters, spaces, and hyphens";
  return null;
};

/** @param {string} v */
const validate_username = (v) => {
  const t = v.trim();
  if (t.length < 3) return "username must be at least 3 characters";
  if (t.length > 20) return "username must be at most 20 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(t)) return "username may only contain letters, numbers, and underscores";
  return null;
};

/** @param {string} v */
const validate_password = (v) => {
  if (v.length < 8) return "password must be at least 8 characters";
  if (!/[a-z]/.test(v)) return "password must contain at least one lowercase letter";
  if (!/[A-Z]/.test(v)) return "password must contain at least one uppercase letter";
  if (!/[0-9]/.test(v)) return "password must contain at least one number";
  return null;
};

/** @param {string} v */
const validate_image = (v) => {
  if (!/^data:image\/(png|jpe?g);base64,/i.test(v)) return "image must be a PNG or JPEG data URL";
  return null;
};

/** @param {{ lat: number, lng: number }} loc */
const validate_location = (loc) => {
  if (loc.lat < -90 || loc.lat > 90) return "latitude must be between -90 and 90";
  if (loc.lng < -180 || loc.lng > 180) return "longitude must be between -180 and 180";
  return null;
};

/** @param {string} v */
const validate_role = (v) => {
  if (v !== "user" && v !== "owner") return "role must be either 'user' or 'owner'";
  return null;
};

/**
* POST/api/users - Create a new user.
 * Expects- username, password, name, image (strings), location ({lat, lng}).
 * * Workflow:
 * - Validate presence & types.
 * - Validate field logic. returns { errors: { [field]: msg } } for inline UI.
 * - Check username uniqueness. returns 409 on conflict.
 * @type {import("express").RequestHandler}
 */
const create_user = async (req, res) => {
  const body = req.body;
  const location = body?.location;

  // 1. Type gate.
  if (
    typeof body?.username !== "string" ||
    typeof body?.password !== "string" ||
    typeof body?.name !== "string" ||
    typeof body?.image !== "string" ||
    typeof location !== "object" ||
    location === null ||
    typeof location.lat !== "number" ||
    typeof location.lng !== "number"
  ) {
    res.status(400).json({
      error:
        "username, password, name and image are required strings, and location must be { lat, lng } numbers",
    });
    return;
  }

  // 2. Field logic validation.
  // role is optional for backward compatibility. defaults to a regular user.
  const role = typeof body?.role === "string" ? body.role : "user";

  /** @type {Record<string, string>} */
  const errors = {};
  const name_err = validate_name(body.name);
  if (name_err) errors.name = name_err;
  const username_err = validate_username(body.username);
  if (username_err) errors.username = username_err;
  const password_err = validate_password(body.password);
  if (password_err) errors.password = password_err;
  const image_err = validate_image(body.image);
  if (image_err) errors.image = image_err;
  const location_err = validate_location(location);
  if (location_err) errors.location = location_err;
  const role_err = validate_role(role);
  if (role_err) errors.role = role_err;

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors });
    return;
  }

  // 3. Uniqueness.
  if (await users_model.exists_by_username(body.username.trim())) {
    res.status(409).json({ error: "username already taken" });
    return;
  }

  const user = await users_model.add({
    username: body.username.trim(),
    password: body.password,
    name: body.name.trim(),
    image: body.image,
    location: { lat: location.lat, lng: location.lng },
    role,
  });

  res.status(201).location(`/api/users/${user.id}`).end();
};

/**
 * GET/api/users/:id- return a user's details without the password.
 * @type {import("express").RequestHandler}
 */
const get_user = async (req, res) => {
  const id = Number(req.params.id);
  const user = await users_model.get_by_id(id);

  if (user === null) {
    res.status(404).json({ error: "user not found" });
    return;
  }

  const { password, ...public_user } = user;
  res.status(200).json(public_user);
};

export { create_user, get_user };