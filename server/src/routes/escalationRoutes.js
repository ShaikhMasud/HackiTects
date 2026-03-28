const express = require("express");
const router = express.Router();

const {
  getAllEscalations,
  getWardEscalations,
  resolveEscalation,
} = require("../controllers/escalationController");

router.get("/", getAllEscalations);
router.get("/ward/:wardId", getWardEscalations);
router.put("/:escalationId/resolve", resolveEscalation);

module.exports = router;
