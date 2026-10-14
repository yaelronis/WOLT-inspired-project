// @ts-check

import express from "express";
import { create_user, get_user } from "../controller/users.js";

const router = express.Router();

router.post("/", create_user);
router.get("/:id", get_user);

export { router };