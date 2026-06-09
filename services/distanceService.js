const axios = require("axios");

const getDistance = async (fromLat, fromLng, toLat, toLng) => {
  const url = `http://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;

  const res = await axios.get(url);

  if (!res.data || !res.data.routes || !res.data.routes.length) {
    throw new Error("Route not found");
  }

  const distanceMeters = res.data.routes[0].distance;

  return distanceMeters / 1000; // km
};

module.exports = { getDistance };