const mongoose = require("mongoose");

const handoverSnapshotSchema = new mongoose.Schema({
  shiftName: {
    type: String,
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  shareId: {
    type: String,
    required: true,
    unique: true,
  },
  reportData: {
    type: Object,
    required: true,
  },
});

module.exports = mongoose.model("HandoverSnapshot", handoverSnapshotSchema);
