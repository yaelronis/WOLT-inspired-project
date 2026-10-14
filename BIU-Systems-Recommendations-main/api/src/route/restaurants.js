// @ts-check
import express from 'express'
const router = express.Router()
import {
        getAllRestaurants,
        getCategories,
        getRestaurantById,
        createRestaurant,
        updateRestaurant,
        deleteRestaurant,
} from "../controller/restaurants.js";
import { requireAuth } from '../middleware/auth.js'

router.route('/')
        .get(getAllRestaurants)
        .post(requireAuth, createRestaurant)

// Allowed categories- registered before '/:id' so it isn't captured as an id.
router.get('/categories', getCategories)

router.route('/:id')
        .get(getRestaurantById)
        .patch(requireAuth, updateRestaurant)
        .delete(requireAuth, deleteRestaurant)


export { router }