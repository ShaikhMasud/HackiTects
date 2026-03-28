const express = require("express");
const router = express.Router();

const {
  createWard,
  getWards,
  getWardDetails,
  getWardOccupancy,
} = require("../controllers/wardController");

router.post("/", createWard);
router.get("/", getWards);
router.get("/:wardId", getWardDetails);
router.get("/:wardId/occupancy", getWardOccupancy);

module.exports = router;
