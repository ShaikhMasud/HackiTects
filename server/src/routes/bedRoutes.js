const express = require("express");
const router = express.Router();

const { updateBedStatus, getAllBeds, transferPatient } = require("../controllers/bedController");

router.get("/", getAllBeds);
router.post("/transfer", transferPatient);
router.put("/:bedId/status", updateBedStatus);

module.exports = router;
