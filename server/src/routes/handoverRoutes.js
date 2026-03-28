const express = require("express");
const router = express.Router();

const { generateHandover } = require("../controllers/handoverController");

router.get("/:wardId", generateHandover);

module.exports = router;
