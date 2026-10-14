// @ts-check

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { create_user, get_user } from "../src/controller/users.js";
import { login } from "../src/controller/tokens.js";
import { create_user_storage, set_user_storage } from "../src/model/users.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";

import * as MockResponse from "./mock/response.js";

// Fresh isolated storage before each test- no shared state or side effects.
beforeEach(() => set_user_storage(create_user_storage()));

// Controllers are async (DB), so use the awaiting invoker.
const run = MockResponse.run_async;

let n = 0;
const uniq = () => `u_${Date.now()}_${n++}`;
const fullUser = (/** @type {string} */ username) => ({ username, password: "Passw0rd", name: "Name", image: "data:image/png;base64,AAAA", location: { lat: 32.0, lng: 34.0 } });
/** @param {MockResponse.RecordingRes} res @returns {string} id parsed from the Location header */
const created_id = (res) => String(res.loc).split("/").pop() ?? "";

// POST/api/users- body interpretation.

test("create: a complete valid body is accepted (201 + Location)", async () => {
  const res = await run(create_user, fullUser(uniq()));
  assert.equal(res.statusCode, 201);
  assert.match(String(res.loc), /^\/api\/users\/\d+$/);
});

test("create: a duplicate username is rejected (409)", async () => {
  const username = uniq();
  assert.equal((await run(create_user, fullUser(username))).statusCode, 201);
  assert.equal((await run(create_user, fullUser(username))).statusCode, 409);
});

test("create: a missing required field is rejected (400)", async () => {
  const body = fullUser(uniq());
  // @ts-expect-error intentionally drop a required field for the test.
  delete body.image;
  assert.equal((await run(create_user, body)).statusCode, 400);
});

test("create: a non-string field is rejected (400)", async () => {
  const res = await run(create_user, { ...fullUser(uniq()), name: 5 });
  assert.equal(res.statusCode, 400);
});

test("create: a missing/non-object body is rejected (400)", async () => {
  assert.equal((await run(create_user, undefined)).statusCode, 400);
  assert.equal((await run(create_user, "not json")).statusCode, 400);
});

// GET/api/users/:id

test("get: returns the user's details without the password (200)", async () => {
  const username = uniq();
  const id = created_id(await run(create_user, fullUser(username)));
  const res = await run(get_user, undefined, { id });
  assert.equal(res.statusCode, 200);
  const user = /** @type {any} */ (res.payload);
  assert.equal(user.username, username);
  assert.equal("password" in user, false);
});

test("get: an unknown id is not found (404)", async () => {
  assert.equal((await run(get_user, undefined, { id: "999" })).statusCode, 404);
});

// POST/api/tokens- login.

test("login: missing credentials are rejected (400)", async () => {
  assert.equal((await run(login, { username: "x" })).statusCode, 400);
});

test("login: non-string credentials are rejected (400)", async () => {
  assert.equal((await run(login, { username: 1, password: 2 })).statusCode, 400);
});

test("login: valid credentials return a JWT for the user (200)", async () => {
  const username = uniq();
  const id = Number(created_id(await run(create_user, fullUser(username))));
  const res = await run(login, { username, password: "Passw0rd" });
  assert.equal(res.statusCode, 200);
  const payload = /** @type {any} */ (res.payload);
  assert.equal(typeof payload.token, "string");
  // The token must verify and carry the correct user id.
  const decoded = /** @type {any} */ (jwt.verify(payload.token, JWT_SECRET));
  assert.equal(decoded.user_id, id);
});

test("login: wrong password is rejected (401)", async () => {
  const username = uniq();
  await run(create_user, fullUser(username));
  assert.equal((await run(login, { username, password: "WRONG" })).statusCode, 401);
});