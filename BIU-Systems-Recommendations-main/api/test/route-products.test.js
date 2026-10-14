// @ts-check

import { test, suite, beforeEach } from "node:test";
import assert from "node:assert/strict";

import * as Model from "../src/model/products.js";
import * as Controller from "../src/controller/products.js";
import * as Restaurants from "../src/model/restaurants.js";

import * as MockResponse from "./mock/response.js";

// mock objects.
const run = MockResponse.run;
const run_async = MockResponse.run_async;
Controller.mockables.backend_add_product = async function (_) { return null; };
Controller.mockables.backend_remove_product = async function (_) { return null; };

/** @type {Model.ProductPreInsert[]} */
const mock_products = [
    { name: "Margherita",   price: 50, category: "Mains", pic: "" },
    { name: 'fries', price: 13.0, category: "sides", pic: "" },
    { name: 'salad', price: 99.0, category: "sides", pic: "" },
];

/** @type {Omit<Restaurants.Restaurant, "id">} */
const mock_restaurant = {
    name: 'mcdonlans',
    address: 'disjointed tribes',
    description: 'the actual name is mcdonlans, yes',
    category: 'Hamburger',
    vegetarian: false,
    promoted: false,
    rating: 0,
    imgURL: '',
    location: { lat: 0, lng: 0 }
};
function reset() {
    // this model: inject a fresh in-memory store (no shared/mutated state).
    Model.set_products_storage(Model.create_products_storage());
    // restaurant model.
    const store_restaurants = Restaurants.createRestaurantStorage();
    Restaurants.setRestaurantStorage(store_restaurants);
}


suite('ModelSanity.Products', () => {
    beforeEach(reset);

    // get_all.
    test('get all: default is empty array', async () => {
        assert.deepEqual(await Model.get_all(0), []);
    });
    test('get all: gets item post insert', async () => {
        const restaurant_id = 0;
        const product = await Model.add(restaurant_id, mock_products[0]);
        const { id: _, ...product_preinsert } = product;
        assert.deepEqual(await Model.get_all(restaurant_id), [product]);
        assert.deepEqual(product_preinsert, mock_products[0]);
    });
    test('get all: gets several items post insert', async () => {
        const restaurant_id = 0;
        const items = [];
        for (const product of mock_products) {
            items.push(await Model.add(restaurant_id, product));
        }
        const items_preinsert = items.map((product) => {
            const { id: _, ...product_preinsert } = product;
            return product_preinsert;
        })
        assert.deepEqual(await Model.get_all(restaurant_id), items);
        assert.deepEqual(items_preinsert, mock_products);
    });

    // note: all these use add implicitly.

    // get
    test('get: default is null', async () => {
        assert.deepEqual(await Model.get(0, 0), null);
    });
    test('get: gets item post insert', async () => {
        const restaurant_id = 0;
        const product = await Model.add(restaurant_id, mock_products[0]);
        const { id: _, ...product_preinsert } = product;
        assert.deepEqual(await Model.get(restaurant_id, product.id), product);
        assert.deepEqual(mock_products[0], product_preinsert);
    });

    // modify.
    test('modify: default is null', async () => {
        assert.deepEqual(await Model.modify(0, 0, {}), null);
    });
    test('modify: modifies item post insert', async () => {
        const restaurant_id = 0;
        const product = await Model.add(restaurant_id, mock_products[0]);
        const { id: _, ...product_pre_insert } = product;
        const product_pre_insert_modified = { ...product_pre_insert, price: 15 };
        const product_modified = await Model.modify(restaurant_id, product.id, product_pre_insert_modified);
        if (product_modified === null) assert.fail("item inserted should not return null on modify");
        const { id: __, ...product_pre_insert_modified_actual } = product_modified;
        assert.deepEqual(product_pre_insert_modified_actual, product_pre_insert_modified)
    });

    // remove.
    test('remove: default is null', async () => {
        assert.deepEqual(await Model.modify(0, 0, {}), null);
    });
    test('remove: removes item post insert', async () => {
        const restaurant_id = 0;
        const product = await Model.add(restaurant_id, mock_products[0]);
        const { id: _, ...product_pre_insert } = product;
        const product_removed = await Model.remove(restaurant_id, product.id);
        if (product_removed === null) assert.fail("item inserted should not return null on remove");
        const { id: __, ...product_pre_insert_removed } = product_removed;
        assert.deepEqual(product_pre_insert_removed, product_pre_insert)
        assert.deepEqual(await Model.get(restaurant_id, product.id), null);
    });
});

suite('Integration.Products', () => {
    beforeEach(reset);

    // controller.get_all.
    test('get all: existing restaurant', async () => {
        const restaurant = await Restaurants.createRestaurant(mock_restaurant);
        const product = await Model.add(restaurant.id, mock_products[0]);
        const res = await run_async(Controller.get_all, {}, { 'id': `${restaurant.id}` });
        assert.deepEqual(res.statusCode, 200);
        assert.deepEqual(res.payload, [product]);
    });
    test('get all: bad ids', async () => {
        const res1 = await run_async(Controller.get_all, {}, {});
        assert.deepEqual(res1.statusCode, 400);
        const res2 = await run_async(Controller.get_all, {}, { 'id': 'asd' });
        assert.deepEqual(res2.statusCode, 400);
    });
    test('get all: no such restaurant', async () => {
        const res = await run_async(Controller.get_all, {}, { 'id': '0' });
        assert.deepEqual(res.statusCode, 404);
    });

    // controller.get.
    test('get: existing product', async() => {
        const restaurant = await Restaurants.createRestaurant(mock_restaurant);
        const product = await Model.add(restaurant.id, mock_products[0]);
        const res = await run_async(Controller.get, {}, { 'id': `${restaurant.id}`, 'pid': `${product.id}` });
        assert.deepEqual(res.statusCode, 200);
        assert.deepEqual(res.payload, product);
    });
    test('get: bad ids', async() => {
        const ress = {
            empty_l: await run_async(Controller.get, {}, { 'id': '', 'pid': '0' }),
            empty_r: await run_async(Controller.get, {}, { 'id': '0', 'pid': '' }),
            text_l: await run_async(Controller.get, {}, { 'id': 'asd', 'pid': '0' }),
            text_r: await run_async(Controller.get, {}, { 'id': '0', 'pid': 'asd' }),
        };
        assert.deepEqual(ress.empty_l.statusCode, 400);
        assert.deepEqual(ress.empty_r.statusCode, 400);
        assert.deepEqual(ress.text_l.statusCode, 400);
        assert.deepEqual(ress.text_r.statusCode, 400);
    });
    test('get: no such restaurant/product', async() => {
        // neither restaurant exists in the restaurant model, so both are 404.
        const ress = {
            restaurant: await run_async(Controller.get, {}, { 'id': '0', 'pid': '0' }),
            product: await run_async(Controller.get, {}, { 'id': '1', 'pid': '0' }),
        };
        assert.deepEqual(ress.restaurant.statusCode, 404);
        assert.deepEqual(ress.product.statusCode, 404);
    });

    // controller.add.
    test('add: new product', async () => {
        const restaurant = await Restaurants.createRestaurant(mock_restaurant);
        const res = await run_async(Controller.add, mock_products[0], { 'id': `${restaurant.id}` });
        assert.deepEqual(res.statusCode, 201);
        assert.deepEqual(res.loc, `/api/restaurants/${restaurant.id}/products/0`)
        assert.deepEqual(res.payload, { id: 0, ...mock_products[0] });
    });
    test('add: bad id', async () => {
        const ress = {
            empty: await run_async(Controller.add, {}, { 'id': '' }),
            text: await run_async(Controller.add, {}, { 'id': 'asd' }),
        };
        assert.deepEqual(ress.empty.statusCode, 400);
        assert.deepEqual(ress.text.statusCode, 400);
    });
    test('add: bad fields', async () => {
        const restaurant = await Restaurants.createRestaurant(mock_restaurant);
        const ress = {
            name: await run_async(Controller.add, { ...mock_products[0], name: 0 }, { 'id': `${restaurant.id}` }),
            price: await run_async(Controller.add, { ...mock_products[0], price: '0' }, { 'id': `${restaurant.id}` }),
        };
        assert.deepEqual(ress.name.statusCode, 400);
        assert.deepEqual(ress.price.statusCode, 400);
    });

    // controller.modify.
    test('modify: existing product', async() => {
        const restaurant = await Restaurants.createRestaurant(mock_restaurant);
        const url_params = { 'id': `${restaurant.id}` };
        await run_async(Controller.add, mock_products[0], url_params);
        const res = await run_async(Controller.modify, { ...mock_products[0], name: 'diff' }, { ...url_params, pid: '0' });
        const res_get = await run_async(Controller.get, {}, { ...url_params, pid: '0' });
        assert.deepEqual(res.statusCode, 204);
        assert.deepEqual(res_get.payload, { id: 0, ...mock_products[0], name: 'diff' });
    });
    test('modify: bad ids', async () => {
        const ress = {
            empty_l: await run_async(Controller.modify, {}, { 'id': '', 'pid': '0' }),
            empty_r: await run_async(Controller.modify, {}, { 'id': '0', 'pid': '' }),
            text_l: await run_async(Controller.modify, {}, { 'id': 'asd', 'pid': '0' }),
            text_r: await run_async(Controller.modify, {}, { 'id': '0', 'pid': 'asd' }),
        };
        assert.deepEqual(ress.empty_l.statusCode, 400);
        assert.deepEqual(ress.empty_r.statusCode, 400);
        assert.deepEqual(ress.text_l.statusCode, 400);
        assert.deepEqual(ress.text_r.statusCode, 400);
    });
    test('modify: no such restaurant/product', async () => {
        const ress = {
            restaurant: await run_async(Controller.modify, {}, { 'id': '0', 'pid': '0' }),
            product: await run_async(Controller.modify, {}, { 'id': '1', 'pid': '0' }),
        };
        assert.deepEqual(ress.restaurant.statusCode, 404);
        assert.deepEqual(ress.product.statusCode, 404);
    });

    // controller.remove.
    test('remove: existing product', async () => {
        const restaurant = await Restaurants.createRestaurant(mock_restaurant);
        const url_params = { 'id': `${restaurant.id}` };
        await Model.add(restaurant.id, mock_products[0]); // id 0
        await Model.add(restaurant.id, mock_products[1]); // id 1
        const res = await run_async(Controller.remove, {}, { ...url_params, pid: '0' });
        const res_get_0 = await run_async(Controller.get, {}, { ...url_params, pid: '0' });
        const res_get_1 = await run_async(Controller.get, {}, { ...url_params, pid: '1' });
        assert.deepEqual(res.statusCode, 204);
        assert.deepEqual(res_get_0.statusCode, 404);
        assert.deepEqual(res_get_1.statusCode, 200);
    });
    test('remove: bad ids', async () => {
        const ress = {
            empty_l: await run_async(Controller.remove, {}, { 'id': '', 'pid': '0' }),
            empty_r: await run_async(Controller.remove, {}, { 'id': '0', 'pid': '' }),
            text_l: await run_async(Controller.remove, {}, { 'id': 'asd', 'pid': '0' }),
            text_r: await run_async(Controller.remove, {}, { 'id': '0', 'pid': 'asd' }),
        };
        assert.deepEqual(ress.empty_l.statusCode, 400);
        assert.deepEqual(ress.empty_r.statusCode, 400);
        assert.deepEqual(ress.text_l.statusCode, 400);
        assert.deepEqual(ress.text_r.statusCode, 400);
    });
    test('remove: no such restaurant/product', async () => {
        const ress = {
            restaurant: await run_async(Controller.remove, {}, { 'id': '0', 'pid': '0' }),
            product: await run_async(Controller.remove, {}, { 'id': '1', 'pid': '0' }),
        };
        assert.deepEqual(ress.restaurant.statusCode, 404);
        assert.deepEqual(ress.product.statusCode, 404);
    });
});