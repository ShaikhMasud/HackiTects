const express = require("express");
const router = express.Router();
const { addClient } = require("../sse/eventStream");

router.get("/stream", addClient);

module.exports = router;
