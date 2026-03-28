const express = require("express");
const router = express.Router();

// Example GET route
router.get("/", (req, res) => {
  res.send("Get all users");
});

// Example POST route
router.post("/register", (req, res) => {
  res.send("User registered");
});

module.exports = router;