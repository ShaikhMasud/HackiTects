const Bed = require("../models/Bed");
const Admission = require("../models/Admission");
const Discharge = require("../models/Discharge");

// 🧠 Core function
exports.getCapacityForecast = async (wardId, hoursAhead) => {
  const now = new Date();
  const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  // 1️⃣ Current occupancy
  const totalBeds = await Bed.countDocuments({ wardId });

  const occupiedBeds = await Bed.countDocuments({
    wardId,
    status: "occupied",
  });

  // 2️⃣ Expected discharges within time window
  const expectedDischarges = await Discharge.countDocuments({
    wardId,
    status: "pending",
    scheduledDischargeTime: {
      $gte: now,
      $lte: futureTime,
    },
  });

  // 3️⃣ Expected admissions within time window
  const expectedAdmissions = await Admission.countDocuments({
    wardId,
    status: "pending",
    createdAt: {
      $gte: now,
      $lte: futureTime,
    },
  });

  // 4️⃣ Forecast calculation
  let projectedOccupied =
    occupiedBeds + expectedAdmissions - expectedDischarges;

  // Boundaries
  if (projectedOccupied < 0) projectedOccupied = 0;
  if (projectedOccupied > totalBeds) projectedOccupied = totalBeds;

  const occupancyRate =
    totalBeds === 0 ? 0 : (projectedOccupied / totalBeds) * 100;

  return {
    hoursAhead,
    totalBeds,
    currentOccupied: occupiedBeds,
    expectedAdmissions,
    expectedDischarges,
    projectedOccupied,
    projectedAvailable: totalBeds - projectedOccupied,
    occupancyRate: occupancyRate.toFixed(2),
  };
};
