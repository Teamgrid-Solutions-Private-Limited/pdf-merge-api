const express = require("express");
const { processRecordsHandler } = require("../controllers/pdfController");
const router = express.Router();


router.post("/DemoMYGA", processRecordsHandler(process.env.API_URLMYGA));
router.post("/DemoFIA", processRecordsHandler(process.env.API_URLFIA));

module.exports = router;
