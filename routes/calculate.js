const express = require("express");
const router = express.Router();
const { getCoordinates } = require("../services/geocodeService");
const { getDistance } = require("../services/distanceService");

router.post("/calculate", async (req, res) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: "Please provide 'from' and 'to' fields" });
    }

    // STEP 1: convert address → lat/lng
    const fromCoord = await getCoordinates(from);
    const toCoord = await getCoordinates(to);

    // STEP 2: get distance from OSRM
    const distanceKm = await getDistance(
      fromCoord.lat,
      fromCoord.lon,
      toCoord.lat,
      toCoord.lon
    );

    // STEP 3: pricing logic
    let price = 2;

    if (distanceKm > 3) price = 5;
    if (distanceKm > 10) price = 10;

    res.json({
      distanceKm,
      finalPrice: price,
      from: fromCoord,
      to: toCoord
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
