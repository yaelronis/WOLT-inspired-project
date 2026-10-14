// @ts-check

import express from "express";

import { requireAuth } from "../middleware/auth.js";
import * as ControllerProducts from "../controller/products.js";

const router = express.Router({mergeParams: true});

router.route("/")
    .get(ControllerProducts.get_all)
    .post(requireAuth, ControllerProducts.add);

router.route("/:pid")
    .get(ControllerProducts.get)
    .patch(requireAuth, ControllerProducts.modify)
    .delete(requireAuth, ControllerProducts.remove);

export { router };
