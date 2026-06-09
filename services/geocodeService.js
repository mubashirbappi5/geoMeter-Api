const axios = require("axios");

const getCoordinates = async (place) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "distance-pricing-app"
    }
  });

  if (!res.data.length) {
    throw new Error("Location not found");
  }

  return {
    lat: res.data[0].lat,
    lon: res.data[0].lon
  };
};

module.exports = { getCoordinates };
