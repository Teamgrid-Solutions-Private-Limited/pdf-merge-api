// const express = require("express");
// const { PDFDocument } = require("pdf-lib");
// // Node-fetch for CommonJS
// const fetch = (...args) =>
//   import("node-fetch").then(({ default: fetch }) => fetch(...args));

// const router = express.Router();

// /**
//  * POST /api/pdf/merge
//  * Body: { responseObject }
//  */
// router.post("/merge", async (req, res) => {
//   try {
//     const { responseObject } = req.body;
//     if (!responseObject)
//       return res.status(400).json({ error: "responseObject required" });

//     // Build pdfList from responseObject
//     const pdfList = Object.keys(responseObject)
//       .map((key) => {
//         if (key.startsWith("ILLUSTRATION_")) {
//           const page = key.replace("ILLUSTRATION_", "Pages ");
//           const pageInfo = responseObject.pagecounts?.find(
//             (p) => p.Page === page
//           );
//           const pageCount = pageInfo ? pageInfo.PageCount : 0;

//           if (pageCount > 0) {
//             return {
//               PDFUrl: responseObject[key].PDFUrl,
//               PageCount: pageCount,
//             };
//           }
//         }
//         return null;
//       })
//       .filter(Boolean);

//     if (!pdfList.length)
//       return res.status(400).json({ error: "No PDFs to merge" });

//     // Download PDFs using fetch
//     const pdfBuffers = await Promise.all(
//       pdfList.map(async ({ PDFUrl }) => {
//         const response = await fetch(PDFUrl);
//         if (!response.ok) {
//           throw new Error(`Failed to fetch PDF from ${PDFUrl}`);
//         }
//         const arrayBuffer = await response.arrayBuffer();
//         return Buffer.from(arrayBuffer);
//       })
//     );

//     // Merge PDFs
//     const mergedPdf = await PDFDocument.create();
//     for (let i = 0; i < pdfList.length; i++) {
//       const { PageCount } = pdfList[i];
//       const pdfDoc = await PDFDocument.load(pdfBuffers[i]);
//       const totalPages = pdfDoc.getPageCount();
//       const pagesToCopy = Array.from(
//         { length: Math.min(PageCount, totalPages) },
//         (_, idx) => idx
//       );
//       const copiedPages = await mergedPdf.copyPages(pdfDoc, pagesToCopy);
//       copiedPages.forEach((page) => mergedPdf.addPage(page));
//     }

//     const finalPdfBytes = await mergedPdf.save();

//     // Generate dynamic filename
//     const reportTitle = responseObject.reportTitle || "Illustration";
//     const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//     const fileName = `${reportTitle}_${timestamp}.pdf`;

//     // Send PDF with dynamic filename
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     res.send(Buffer.from(finalPdfBytes));
//   } catch (err) {
//     console.error("PDF merge failed:", err);
//     res.status(500).json({ error: "Failed to generate merged PDF" });
//   }
// });

// module.exports = router;


const express = require("express");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");

const router = express.Router();

/**
 * POST /api/pdf/merge
 * Body: { responseObject }
 */
router.post("/merge", async (req, res) => {
  try {
    const { responseObject } = req.body;
    if (!responseObject)
      return res.status(400).json({ error: "responseObject required" });

    // Build pdfList from responseObject
    const pdfList = Object.keys(responseObject)
      .map((key) => {
        if (key.startsWith("ILLUSTRATION_")) {
          const page = key.replace("ILLUSTRATION_", "Pages ");
          const pageInfo = responseObject.pagecounts?.find(
            (p) => p.Page === page
          );
          const pageCount = pageInfo ? pageInfo.PageCount : 0;

          if (pageCount > 0) {
            return {
              PDFUrl: responseObject[key].PDFUrl,
              PageCount: pageCount,
            };
          }
        }
        return null;
      })
      .filter(Boolean);

    if (!pdfList.length)
      return res.status(400).json({ error: "No PDFs to merge" });

    // Download PDFs using axios
    const pdfBuffers = await Promise.all(
      pdfList.map(async ({ PDFUrl }) => {
        const response = await axios.get(PDFUrl, {
          responseType: "arraybuffer",
        });

        if (response.status !== 200) {
          throw new Error(`Failed to fetch PDF from ${PDFUrl}`);
        }

        return Buffer.from(response.data);
      })
    );

    // Merge PDFs
    const mergedPdf = await PDFDocument.create();
    for (let i = 0; i < pdfList.length; i++) {
      const { PageCount } = pdfList[i];
      const pdfDoc = await PDFDocument.load(pdfBuffers[i]);
      const totalPages = pdfDoc.getPageCount();
      const pagesToCopy = Array.from(
        { length: Math.min(PageCount, totalPages) },
        (_, idx) => idx
      );
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pagesToCopy);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const finalPdfBytes = await mergedPdf.save();

    // Generate dynamic filename
    const reportTitle = responseObject.reportTitle || "Illustration";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${reportTitle}_${timestamp}.pdf`;

    // Send PDF with dynamic filename
    res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
       res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      console.log("File Name:", fileName);
    res.send(Buffer.from(finalPdfBytes));
  } catch (err) {
    console.error("PDF merge failed:", err);
    res.status(500).json({ error: "Failed to generate merged PDF" });
  }
});

module.exports = router;