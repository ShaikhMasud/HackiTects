const express = require("express");
const router = express.Router();

const { 
  generateHandover,
  getHandoverHistory,
  getSharedHandover,
  deleteHandover 
} = require("../controllers/handoverController");

// 1. Get List of recently Generated Historical Handovers 
router.get("/history", getHandoverHistory);

// 2. Fetch specific shareable link handover uniquely via secure UUID token
router.get("/shared/:shareId", getSharedHandover); 

// 3. Generate on-the-fly shift handover
router.get("/:wardId", generateHandover);

// 4. Delete Historical Handover Record
router.delete("/history/:shareId", deleteHandover);

module.exports = router;
