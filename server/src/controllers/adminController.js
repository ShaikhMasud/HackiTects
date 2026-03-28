const Ward = require("../models/Ward");
const Bed = require("../models/Bed");
const Escalation = require("../models/Escalation");

exports.getAllWardsSummary = async (req, res) => {
  const wards = await Ward.find();

  const result = [];

  for (let ward of wards) {
    const totalBeds = await Bed.countDocuments({ wardId: ward._id });

    const occupied = await Bed.countDocuments({
      wardId: ward._id,
      status: "occupied",
    });

    const escalations = await Escalation.find({
      wardId: ward._id,
      resolved: false,
    });

    result.push({
      wardId: ward._id,
      wardName: ward.wardName,
      totalBeds,
      occupiedBeds: occupied,
      occupancyRate:
        totalBeds === 0 ? 0 : ((occupied / totalBeds) * 100).toFixed(2),
      activeEscalations: escalations.length,
    });
  }

  res.json(result);
};
