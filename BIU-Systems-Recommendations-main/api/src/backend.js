// @ts-check

import net from "node:net";

/**
 * @typedef {Object} Config
 * @property {String} host
 * @property {Number} port
 */

/** @type {Config} */
var config = {
    host: "localhost",
    port: 8080
}

/** @param {Config} object */
function set_config(object) {
    config = object;
}

/**
 * @typedef {"get" | "post" | "patch" | "delete"} Method
 */

/** 
 * @typedef {Object} BackendRequest
 * @property {Method} method
 * @property {String[]} args
 */

/**
 * @template T
 * @typedef BackendResponse<T>
 * @property {Number} status
 * @property {String} reason
 * @property {T} value
 */


/**
 * parses `"{status} {reason}\n\n{value}\n"` to a response
 * @param {String} response 
 * @returns {BackendResponse<String>}
 */
function parse_into_response(response) {
    const newline_index = response.indexOf("\n");
    // split into "{status} {reason}" and "{value}"
    const status_line = response.slice(0, newline_index);
    const value = response.slice(newline_index + 2, response.length - 1);
    // split `{status} {reason} -> [status, reason]`
    const space_index = status_line.indexOf(" ");
    const status_str = status_line.slice(0, space_index);
    const reason = status_line.slice(space_index + 1);
    const status = Number(status_str);
    return { status, reason, value };
}

/**
 * maps a function unto a response's value
 * @template T, U
 * @param {BackendResponse<T>} response 
 * @param {function(T): U} map
 * @returns {BackendResponse<U>}
 */
function map_value(response, map) {
    const { status, reason, value } = response;
    return { status, reason, value: map(value) };
}

/**
 * sends generic request to backend
 * @template T
 * @argument {BackendRequest} req
 * @returns {Promise<BackendResponse<String>>}
 */
async function request(req) {
    // spawns a promise that resolves on received data
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        var {host, port} = config;
        client.connect({host, port}, () => {
            // format backend input line
            const args = req.args.join(' ');
            const message = `${req.method} ${args}`;
            client.write(message);
        });
        client.setEncoding("utf-8");
        /** @param {String} data - encoding is set to utf-8  */
        const handle = data => {
            client.end();
            const parsed = parse_into_response(data);
            return resolve(parsed);
        };
        client.once('data', handle);
        client.once('error', (err) => {
            client.end();
            reject(err);
        });
    });
}

/**
 * @param {String} user 
 * @param {String} product 
 * @returns {Promise<BackendResponse<String[]>>}
 */
async function get(user, product) {
    const res = await request({ method: "get", args: [user, product] });
    return map_value(res, (value) => value.split(" ").filter(s => s));
}

/**
 * @param {String} user 
 * @param {String[]} products
 * @returns {Promise<BackendResponse<null>>}
 */
async function post(user, products) {
    const res = await request({ method: "post", args: [user, ...products] });
    return map_value(res, (value) => null);
}

/**
 * @param {String} user 
 * @param {String[]} products
 * @returns {Promise<BackendResponse<null>>}
 */
async function patch(user, products) {
    const res = await request({ method: "patch", args: [user, ...products] });
    return map_value(res, (value) => null);
}

/**
 * note: "delete" is not a valid identifier -> delete_
 * @param {String} user 
 * @param {String[]} products
 * @returns {Promise<BackendResponse<null>>}
 */
async function delete_(user, products) {
    const res = await request({ method: "delete", args: [user, ...products] });
    return map_value(res, (value) => null);
}

export { set_config, get, post, patch, delete_, request };
