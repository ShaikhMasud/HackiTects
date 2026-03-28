const express = require("express");
const router = express.Router();

const {
  getWardEscalations,
  resolveEscalation,
} = require("../controllers/escalationController");

router.get("/ward/:wardId", getWardEscalations);
router.put("/:escalationId/resolve", resolveEscalation);

module.exports = router;
