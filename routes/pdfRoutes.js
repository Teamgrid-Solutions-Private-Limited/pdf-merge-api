const express = require("express");
const { processRecordsHandler } = require("../controllers/pdfController");
const protectedKey = require("../utils/protectedKey");
const router = express.Router();


router.all(["/DemoMYGA", "/DemoFIA"], (req, res, next) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ message: "Method not allowed. Please use POST." });
  }
  next();
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
