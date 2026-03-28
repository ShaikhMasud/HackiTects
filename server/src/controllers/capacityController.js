const { getCapacityForecast } = require("../services/capacityService");

exports.getWardCapacityForecast = async (req, res) => {
  try {
    const { wardId } = req.params;

    const forecast4hr = await getCapacityForecast(wardId, 4);
    const forecast8hr = await getCapacityForecast(wardId, 8);

    res.json({
      success: true,
      current: forecast4hr.currentOccupied,
      forecast_4hr: forecast4hr,
      forecast_8hr: forecast8hr,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
