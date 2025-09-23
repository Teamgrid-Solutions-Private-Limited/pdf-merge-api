const express = require("express");
const router = express.Router();
const PdfController = require("../controllers/pdfController");
const protectedKey = require("../utils/protectedKey");


router.post("/processRecords",PdfController.processRecords);

module.exports = router;
