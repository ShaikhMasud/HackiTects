const express = require("express");
const router = express.Router();

const { getAllWardsSummary } = require("../controllers/adminController");

router.get("/summary", getAllWardsSummary);

module.exports = router;
