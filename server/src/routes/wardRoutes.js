const express = require("express");
const router = express.Router();

const {
  createWard,
  getWards,
  getWardDetails,
  getWardOccupancy,
  updateWard,
  deleteWard
} = require("../controllers/wardController");

router.post("/", createWard);
router.get("/", getWards);
router.get("/:wardId", getWardDetails);
router.get("/:wardId/occupancy", getWardOccupancy);
router.put("/:wardId", updateWard);
router.delete("/:wardId", deleteWard);

module.exports = router;
