const express = require("express");
const router = express.Router();

const { updateBedStatus } = require("../controllers/bedController");

router.put("/:bedId/status", updateBedStatus);

module.exports = router;
