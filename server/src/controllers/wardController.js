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
  const beds = await Bed.find({ wardId }).populate("occupantPatientId");

  res.json({ ward, beds });
};

// Get occupancy
exports.getWardOccupancy = async (req, res) => {
  const data = await getWardOccupancy(req.params.wardId);
  res.json(data);
};

// Update ward
exports.updateWard = async (req, res) => {
  try {
    const { wardId } = req.params;
    const { wardName, specialization, totalBeds } = req.body;
    
    const ward = await Ward.findById(wardId);
    if (!ward) return res.status(404).json({ message: "Ward not found" });

    if (wardName !== undefined) ward.wardName = wardName;
    if (specialization !== undefined) ward.specialization = specialization;

    // Handle bed adjustments
    if (totalBeds !== undefined && totalBeds !== ward.totalBeds) {
       const currentTotal = ward.totalBeds;
       if (totalBeds > currentTotal) {
          // Add beds
          const newBeds = [];
          const currentHighestBed = await Bed.findOne({ wardId }).sort('-bedNumber');
          let startNumber = currentHighestBed ? currentHighestBed.bedNumber + 1 : 1;
          for (let i = 0; i < (totalBeds - currentTotal); i++) {
             newBeds.push({ wardId, bedNumber: startNumber++ });
          }
          await Bed.insertMany(newBeds);
       } else if (totalBeds < currentTotal) {
          // Find empty beds to delete
          const bedsToDeleteCount = currentTotal - totalBeds;
          const emptyBeds = await Bed.find({ wardId, status: "available" }).limit(bedsToDeleteCount);
          if (emptyBeds.length < bedsToDeleteCount) {
             return res.status(400).json({ message: `Cannot reduce total beds to ${totalBeds}. Only ${emptyBeds.length} beds are currently available/empty.` });
          }
          const emptyBedIds = emptyBeds.map(b => b._id);
          await Bed.deleteMany({ _id: { $in: emptyBedIds } });
       }
       ward.totalBeds = totalBeds;
    }

    await ward.save();
    res.json({ success: true, ward });
  } catch(e) {
    res.status(500).json({ message: e.message });
  }
};

// Delete ward
exports.deleteWard = async (req, res) => {
  try {
     const { wardId } = req.params;
     const occupiedBeds = await Bed.countDocuments({ wardId, status: "occupied" });
     if (occupiedBeds > 0) {
        return res.status(400).json({ message: "Cannot delete ward. There are occupied beds in it." });
     }
     
     await Ward.findByIdAndDelete(wardId);
     await Bed.deleteMany({ wardId });
     
     res.json({ success: true, message: "Ward deleted" });
  } catch(e) {
     res.status(500).json({ message: e.message });
  }
};
