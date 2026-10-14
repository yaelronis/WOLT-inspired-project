//@ts-check
import express from "express";

import { search } from "../controller/restaurants.js";

const router = express.Router();

router.get("/:query", search);

export {router}