// @ts-check

import express from "express";

import { login, login_jwt } from "../controller/tokens.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", login);
router.post("/jwt", requireAuth, login_jwt);

export { router };