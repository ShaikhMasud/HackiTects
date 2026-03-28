const express = require("express");
const router = express.Router();

const {
  getWardCapacityForecast,
} = require("../controllers/capacityController");

router.get("/:wardId/forecast", getWardCapacityForecast);

module.exports = router;
