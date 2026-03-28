const Ward = require("../models/Ward");
const Bed = require("../models/Bed");
const { getWardOccupancy } = require("../services/wardService");
const mongoose = require("mongoose");

// Create ward
exports.createWard = async (req, res) => {
  const ward = await Ward.create(req.body);

  // Auto-create beds
  const beds = [];
  for (let i = 1; i <= ward.totalBeds; i++) {
    beds.push({
      wardId: ward._id,
      bedNumber: i,
    });
  }

  await Bed.insertMany(beds);

  res.json({ success: true, ward });
};

// Get all wards
exports.getWards = async (req, res) => {
  const wards = await Ward.find();
  res.json(wards);
};

// Get ward details + beds
exports.getWardDetails = async (req, res) => {
  const { wardId } = req.params;

  const ward = await Ward.findById(wardId);
  const beds = await Bed.find({ wardId });

  res.json({ ward, beds });
};

// Get occupancy
exports.getWardOccupancy = async (req, res) => {
  const data = await getWardOccupancy(req.params.wardId);
  res.json(data);
};
