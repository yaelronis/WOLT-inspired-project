// @ts-check

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  list_orders,
  create_order,
  get_order,
  update_order,
  delete_order,
  cancel_order,
} from "../controller/orders.js";

const router = express.Router();

// Every order route needs auth: unlike restaurants/products (public),
// orders are private to a user so even reading needs the logged in user.
router.route("/")
  .get(requireAuth, list_orders)
  .post(requireAuth, create_order);

// Cancel an order (soft- keeps it in history, marked cancelled). Distinct path
// from "/:id", registered explicitly.
router.post("/:id/cancel", requireAuth, cancel_order);

router.route("/:id")
  .get(requireAuth, get_order)
  .patch(requireAuth, update_order)
  .delete(requireAuth, delete_order);

export { router };