const express = require("express");
const { processRecordsHandler } = require("../controllers/pdfController");
const protectedKey = require("../utils/protectedKey");
const router = express.Router();

router.get(['/DemoMYGA', '/DemoFIA'], (req, res) => {
  res.json({
    "Error 405": "Method Not Allowed. Use POST requests to interact.",
  });
});
router.post(
  "/DemoMYGA",
  protectedKey,
  processRecordsHandler(process.env.API_URLMYGA)
);
router.post(
  "/DemoFIA",
  protectedKey,
  processRecordsHandler(process.env.API_URLFIA)
);

module.exports = router;
