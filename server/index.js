require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const {
  checkDischargeDelays,
  checkCleaningDelays,
  checkCapacity,
  checkLOSOutliers,
} = require("./src/services/escalationService");
const Ward = require("./src/models/Ward");

// Initialize Automated Workers
require("./src/cron/handoverCron");

const app = express();

// DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", require("./src/routes/userRoutes"));
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/events", require("./src/routes/sseRoutes"));
app.use("/api/wards", require("./src/routes/wardRoutes"));
app.use("/api/beds", require("./src/routes/bedRoutes"));
app.use("/api/admissions", require("./src/routes/admissionRoutes"));
app.use("/api/discharges", require("./src/routes/dischargeRoutes"));
app.use("/api/escalations", require("./src/routes/escalationRoutes"));
app.use("/api/capacity", require("./src/routes/capacityRoutes"));
app.use("/api/staff", require("./src/routes/staffRoutes"));
app.use("/api/handover", require("./src/routes/handoverRoutes"));
app.use("/api/patients", require("./src/routes/patientRoutes"));
app.use("/api/analytics", require("./src/routes/analyticsRoutes"));

setInterval(async () => {
  const wards = await Ward.find();

  for (let ward of wards) {
    await checkDischargeDelays(ward._id);
    await checkCleaningDelays(ward._id);
    await checkCapacity(ward._id);
    await checkLOSOutliers(ward._id); 
  }
}, 60000);

// Start server  
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`),
);
