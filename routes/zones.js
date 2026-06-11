const express = require("express");
const router = express.Router();
const Zone = require("../models/Zone");

// Validation helper middleware for POST/PUT requests
const validateZoneInput = (req, res, next) => {
  const { name, boundary, baseFare, perKmRate } = req.body;

  if (req.method === "POST" || (req.method === "PUT" && (name || boundary || baseFare !== undefined || perKmRate !== undefined))) {
    if (req.method === "POST" && (!name || !boundary || baseFare === undefined || perKmRate === undefined)) {
      return res.status(400).json({ error: "Missing required fields: name, boundary, baseFare, perKmRate" });
    }

    if (baseFare !== undefined && (typeof baseFare !== "number" || baseFare < 0)) {
      return res.status(400).json({ error: "baseFare must be a positive number" });
    }

    if (perKmRate !== undefined && (typeof perKmRate !== "number" || perKmRate < 0)) {
      return res.status(400).json({ error: "perKmRate must be a positive number" });
    }

    if (boundary !== undefined) {
      if (boundary.type !== "Polygon") {
        return res.status(400).json({ error: "boundary.type must be 'Polygon'" });
      }

      if (!Array.isArray(boundary.coordinates) || boundary.coordinates.length === 0) {
        return res.status(400).json({ error: "boundary.coordinates must be a non-empty array" });
      }

      const outerRing = boundary.coordinates[0];
      if (!Array.isArray(outerRing) || outerRing.length < 4) {
        return res.status(400).json({ error: "Polygon outer ring must have at least 4 coordinate pairs (points)" });
      }

      const firstPoint = outerRing[0];
      const lastPoint = outerRing[outerRing.length - 1];
      if (!Array.isArray(firstPoint) || !Array.isArray(lastPoint) || firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        return res.status(400).json({ error: "Polygon boundary ring must close (first and last coordinate must be identical)" });
      }

      // Check if coordinates are numbers
      for (const point of outerRing) {
        if (!Array.isArray(point) || point.length !== 2 || typeof point[0] !== "number" || typeof point[1] !== "number") {
          return res.status(400).json({ error: "All coordinate pairs must consist of two numbers: [longitude, latitude]" });
        }
      }
    }
  }

  next();
};

// Create a new zone
router.post("/", validateZoneInput, async (req, res) => {
  try {
    const { name, boundary, baseFare, perKmRate } = req.body;

    const existingZone = await Zone.findOne({ name: name.trim() });
    if (existingZone) {
      return res.status(409).json({ error: `A zone named '${name}' already exists` });
    }

    const newZone = new Zone({
      name: name.trim(),
      boundary,
      baseFare,
      perKmRate
    });

    await newZone.save();
    res.status(201).json(newZone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all zones
router.get("/", async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a zone by ID
router.get("/:id", async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a zone
router.put("/:id", validateZoneInput, async (req, res) => {
  try {
    const { name, boundary, baseFare, perKmRate } = req.body;

    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    if (name) {
      const existingZone = await Zone.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (existingZone) {
        return res.status(409).json({ error: `A zone named '${name}' already exists` });
      }
      zone.name = name.trim();
    }

    if (boundary) zone.boundary = boundary;
    if (baseFare !== undefined) zone.baseFare = baseFare;
    if (perKmRate !== undefined) zone.perKmRate = perKmRate;

    await zone.save();
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a zone
router.delete("/:id", async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }
    res.json({ message: `Zone '${zone.name}' deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
