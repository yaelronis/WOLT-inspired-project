// @ts-check

import express from "express";

/**
 * Records what the controller sent back.
 * @typedef {object} RecordingRes
 * @property {number} statusCode
 * @property {unknown} payload
 * @property {string | undefined} loc
 * @property {(code: number) => RecordingRes} status
 * @property {(body: unknown) => RecordingRes} json
 * @property {(l: string) => RecordingRes} location
 * @property {() => RecordingRes} end
 */

/** @returns {RecordingRes} */
const makeRes = () => {
    /** @type {RecordingRes} */
    const res = /** @type {RecordingRes} */ ({});
    res.statusCode = 0;
    res.payload = undefined;
    res.loc = undefined;
    res.status = (code) => ((res.statusCode = code), res);
    res.json = (body) => ((res.payload = body), res);
    res.location = (l) => ((res.loc = l), res);
    res.end = () => res;
    return res;
};

/**
 * Invoke a controller. "body" is the JSON body. "params" carries route params like :id.
 * Body/validation in, status out.
 * @param {import("express").RequestHandler} handler
 * @param {unknown} body
 * @param {Record<string, string>} [params]
 * @param {Record<string, string>} [headers]
 * @returns {RecordingRes}
 */
const run = (handler, body, params = {}, headers = {}) => {
  const res = makeRes();
  const req = {
    body,
    params,
    headers,

    /** @type {(header: string) => string | undefined} */
    get: (header) => headers[header],
  };
  // @ts-expect-error response is a mock object
  handler(req,  res, () => {});
  return res;
};

/**
 * Invoke a controller. "body" is the JSON body. "params" carries route params like :id.
 * Body/validation in, status out.
 * @param {import("express").RequestHandler} handler
 * @param {unknown} body
 * @param {Record<string, string>} [params]
 * @param {Record<string, string>} [headers]
 * 
 * @returns {Promise<RecordingRes>}
 */
async function run_async(handler, body, params = {}, headers = {}){
  const res = makeRes();
  const req = {
    body,
    params,
    headers,

    /** @type {(header: string) => string | undefined} */
    get: (header) => headers[header],
  };
  // @ts-expect-error response is a mock object
  await handler(req, res, () => {});
  return res;
}

export { makeRes, run, run_async };