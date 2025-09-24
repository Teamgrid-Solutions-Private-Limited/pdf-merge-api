const express = require("express");
const { processRecordsHandler } = require("../controllers/pdfController");
const protectedKey = require("../utils/protectedKey");
const router = express.Router();

router.get('/DemoMYGA', (req, res) => {
  res.json({
    message: "This is the DemoMYGA API endpoint. Use POST requests to interact."
  });
});
router.get('/DemoFIA', (req, res) => {
  res.json({
    message: "This is the DemoFIA API endpoint. Use POST requests to interact."
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
