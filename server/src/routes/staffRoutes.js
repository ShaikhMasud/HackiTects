const express = require("express");
const router = express.Router();

const {
  assignNurseToBeds,
  getWardStaff,
} = require("../controllers/staffController");

// assign nurse
router.put("/nurse/:nurseId", assignNurseToBeds);

// get staff view
router.get("/ward/:wardId", getWardStaff);

module.exports = router;
