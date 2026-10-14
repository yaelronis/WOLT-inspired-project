// @ts-check

/**
 * @typedef {import("../../../../api/src/model/restaurants").Location} Location
 */

/**
 * 
 * @param {Location} a 
 * @param {Location} b 
 * @returns {number}
 */
export function getDistanceKm(a, b) {
    // The Haversine Formula
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}