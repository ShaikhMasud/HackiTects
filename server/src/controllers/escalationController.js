const Escalation = require("../models/Escalation");

// Get escalations for ward
exports.getWardEscalations = async (req, res) => {
  const escalations = await Escalation.find({
    wardId: req.params.wardId,
    resolved: false,
  });

  res.json(escalations);
};

// Resolve escalation
exports.resolveEscalation = async (req, res) => {
  const escalation = await Escalation.findByIdAndUpdate(
    req.params.escalationId,
    { resolved: true },
    { new: true },
  );

  res.json(escalation);
};
