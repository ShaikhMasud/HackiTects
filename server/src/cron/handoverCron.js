const cron = require("node-cron");
const { generateAndStoreHandover } = require("../controllers/handoverController");

// Auto-generate Shift Handover Summaries for predefined hospital shifts
// Morning Shift (08:00) -> Runs at 08:00 everyday
cron.schedule("0 8 * * *", () => {
    console.log("CRON: Generating Morning Shift Handover...");
    generateAndStoreHandover("Morning Shift (08:00)");
});

// Evening Shift (16:00) -> Runs at 16:00 everyday
cron.schedule("0 16 * * *", () => {
    console.log("CRON: Generating Evening Shift Handover...");
    generateAndStoreHandover("Evening Shift (16:00)");
});

// Night Shift (00:00) -> Runs at midnight everyday
cron.schedule("0 0 * * *", () => {
    console.log("CRON: Generating Night Shift Handover...");
    generateAndStoreHandover("Night Shift (00:00)");
});
