const express = require("express");
const router = express.Router();
const PdfController = require("../controllers/pdfController");
const protectedKey = require("../utils/protectedKey");


router.post("/",protectedKey,PdfController.mergePDFs);

module.exports = router;
