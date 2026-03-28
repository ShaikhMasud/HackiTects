const Bed = require("../models/Bed");

exports.getWardOccupancy = async (wardId) => {
  const total = await Bed.countDocuments({ wardId });
  const occupied = await Bed.countDocuments({
    wardId,
    status: "occupied",
  });

  const percentage = total === 0 ? 0 : (occupied / total) * 100;

  return {
    totalBeds: total,
    occupiedBeds: occupied,
    occupancyRate: percentage.toFixed(2),
  };
};
