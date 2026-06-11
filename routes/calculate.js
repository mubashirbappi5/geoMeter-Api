const express = require("express");
const router = express.Router();
const { getCoordinates } = require("../services/geocodeService");
const { getDistance } = require("../services/distanceService");
const Zone = require("../models/Zone");

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
    let price;
    let pricingMethod = "default";
    let zoneDetails = null;

    // Check if the pickup coordinates fall inside any defined zone.
    // MongoDB $geoIntersects expects GeoJSON Point: coordinates [longitude, latitude].
    const pickupZone = await Zone.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(fromCoord.lon), parseFloat(fromCoord.lat)]
          }
        }
      }
    });

    if (pickupZone) {
      pricingMethod = "zone-based";
      zoneDetails = {
        id: pickupZone._id,
        name: pickupZone.name,
        baseFare: pickupZone.baseFare,
        perKmRate: pickupZone.perKmRate
      };
      price = pickupZone.baseFare + (distanceKm * pickupZone.perKmRate);
    } else {
      price = 2;
      if (distanceKm > 3) price = 5;
      if (distanceKm > 10) price = 10;
    }

    res.json({
      distanceKm,
      finalPrice: Number(price.toFixed(2)),
      pricingMethod,
      zoneDetails,
      from: fromCoord,
      to: toCoord
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
