const express = require("express");
const router = express.Router();

const {
  assignNurseToBeds,
  getWardStaff,
  getAllDoctors,
  getAllNurses,
} = require("../controllers/staffController");

// get all doctors
router.get("/doctors", getAllDoctors);

// get all nurses
router.get("/nurses", getAllNurses);

// assign nurse
router.put("/nurse/:nurseId", assignNurseToBeds);

// get staff view
router.get("/ward/:wardId", getWardStaff);

module.exports = router;
