const express = require("express");
const router = express.Router();

const {
  scheduleDischarge,
  getWardDischarges,
  completeDischarge,
} = require("../controllers/dischargeController");

router.post("/", scheduleDischarge);
router.get("/ward/:wardId", getWardDischarges);
router.put("/:dischargeId/complete", completeDischarge);

module.exports = router;
