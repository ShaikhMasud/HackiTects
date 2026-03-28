const Escalation = require("../models/Escalation");
const Discharge = require("../models/Discharge");
const Bed = require("../models/Bed");
const { sendEvent } = require("../sse/eventStream");
const Patient = require("../models/Patients");

// DISCHARGE DELAY CHECK
exports.checkDischargeDelays = async (wardId) => {
  const discharges = await Discharge.find({
    wardId,
    status: "pending",
  });

  const now = new Date();

  for (let d of discharges) {
    if (!d.scheduledDischargeTime) continue;

    const delayMinutes =
      (now - new Date(d.scheduledDischargeTime)) / (1000 * 60);

    // ✅ NORMAL CASE → resolve if exists
    if (delayMinutes <= 30) {
      const result = await Escalation.updateMany(
        {
          wardId,
          type: "discharge-delay",
          relatedPatientId: d.patientId,
          resolved: false,
        },
        { resolved: true },
      );

      if (result.modifiedCount > 0) {
        sendEvent("escalation-resolved", {
          wardId,
          type: "discharge-delay",
          patientId: d.patientId,
        });
      }

      continue;
    }

    // 🚨 PROBLEM CASE → create if not exists
    const exists = await Escalation.findOne({
      wardId,
      type: "discharge-delay",
      relatedPatientId: d.patientId,
      resolved: false,
    });

    if (!exists) {
      const severity = delayMinutes > 120 ? "RED" : "YELLOW";

      const escalation = await Escalation.create({
        wardId,
        type: "discharge-delay",
        severity,
        description: `Discharge delayed by ${Math.floor(delayMinutes)} minutes`,
        relatedPatientId: d.patientId,
      });

      sendEvent("escalation-created", escalation);
    }
  }
};

// 🧹 CLEANING DELAY CHECK
exports.checkCleaningDelays = async (wardId) => {
  const beds = await Bed.find({
    wardId,
    status: "cleaning",
  });

  const now = new Date();

  for (let bed of beds) {
    if (!bed.cleaningStartTime) continue;

    const delayMinutes = (now - new Date(bed.cleaningStartTime)) / (1000 * 60);

    // ✅ NORMAL CASE → resolve if exists
    if (delayMinutes <= 30) {
      const result = await Escalation.updateMany(
        {
          wardId,
          type: "cleaning-delay",
          relatedBedId: bed._id,
          resolved: false,
        },
        { resolved: true },
      );

      if (result.modifiedCount > 0) {
        sendEvent("escalation-resolved", {
          wardId,
          type: "cleaning-delay",
          bedId: bed._id,
        });
      }

      continue;
    }

    // 🚨 PROBLEM CASE → create if not exists
    const exists = await Escalation.findOne({
      wardId,
      type: "cleaning-delay",
      relatedBedId: bed._id,
      resolved: false,
    });

    if (!exists) {
      const escalation = await Escalation.create({
        wardId,
        type: "cleaning-delay",
        severity: "YELLOW",
        description: `Bed cleaning delayed ${Math.floor(delayMinutes)} minutes`,
        relatedBedId: bed._id,
      });

      sendEvent("escalation-created", escalation);
    }
  }
};

// 📊 CAPACITY WARNING CHECK
exports.checkCapacity = async (wardId) => {
  const totalBeds = await Bed.countDocuments({ wardId });

  const occupied = await Bed.countDocuments({
    wardId,
    status: "occupied",
  });

  const percent = totalBeds === 0 ? 0 : (occupied / totalBeds) * 100;

  // ✅ NORMAL CASE → resolve if exists
  if (percent <= 90) {
    const result = await Escalation.updateMany(
      {
        wardId,
        type: "capacity-warning",
        resolved: false,
      },
      { resolved: true },
    );

    if (result.modifiedCount > 0) {
      sendEvent("escalation-resolved", {
        wardId,
        type: "capacity-warning",
      });
    }

    return;
  }

  // 🚨 PROBLEM CASE → create if not exists
  const exists = await Escalation.findOne({
    wardId,
    type: "capacity-warning",
    resolved: false,
  });

  if (!exists) {
    const escalation = await Escalation.create({
      wardId,
      type: "capacity-warning",
      severity: "RED",
      description: `Ward at ${percent.toFixed(2)}% capacity`,
    });

    sendEvent("escalation-created", escalation);
  }
};

exports.checkLOSOutliers = async (wardId) => {
  const now = new Date();

  // ✅ Get patients via beds (correct approach)
  const beds = await Bed.find({
    wardId,
    status: "occupied",
  }).populate("occupantPatientId");

  const patients = beds.map((b) => b.occupantPatientId).filter(Boolean);

  // 🔥 Dynamic thresholds (bonus)
  const thresholds = {
    ICU: 5,
    Cardiology: 7,
    General: 10,
  };

  for (let p of patients) {
    if (!p.admissionDate) continue;

    const losDays = (now - new Date(p.admissionDate)) / (1000 * 60 * 60 * 24);

    const thresholdDays = thresholds[p.conditionCategory] || 7;

    // ✅ NORMAL CASE → resolve
    if (losDays <= thresholdDays) {
      const result = await Escalation.updateMany(
        {
          wardId,
          type: "los-outlier",
          relatedPatientId: p._id,
          resolved: false,
        },
        { resolved: true },
      );

      if (result.modifiedCount > 0) {
        sendEvent("escalation-resolved", {
          wardId,
          type: "los-outlier",
          patientId: p._id,
        });
      }

      continue;
    }

    // 🚨 OUTLIER CASE → create if not exists
    const exists = await Escalation.findOne({
      wardId,
      type: "los-outlier",
      relatedPatientId: p._id,
      resolved: false,
    });

    if (!exists) {
      const escalation = await Escalation.create({
        wardId,
        type: "los-outlier",
        severity: "BLUE",
        description: `Patient LOS exceeded ${Math.floor(losDays)} days`,
        relatedPatientId: p._id,
      });

      sendEvent("escalation-created", escalation);
    }
  }
};