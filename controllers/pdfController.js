// const axios = require("axios");
// const { PDFDocument } = require("pdf-lib");

// // Merge PDFs Controller
// exports.mergePDFs = async (req, res) => {
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

//     // Download PDFs
//     const pdfBuffers = await Promise.all(
//       pdfList.map(async ({ PDFUrl }) => {
//         const response = await axios.get(PDFUrl, {
//           responseType: "arraybuffer",
//         });

//         if (response.status !== 200) {
//           throw new Error(`Failed to fetch PDF from ${PDFUrl}`);
//         }

//         return Buffer.from(response.data);
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

//     // Send PDF response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

//     console.log("File Name:", fileName);
//     res.send(Buffer.from(finalPdfBytes));
//     console.log("PDF sent successfully");
//   } catch (err) {
//     console.error("PDF merge failed:", err);
//     res.status(500).json({ error: "Failed to generate merged PDF" });
//   }
// };
const axios = require("axios");
const { PDFDocument } = require("pdf-lib");

// Submit and merge PDFs
exports.submitAndMergePDFs = async (req, res) => {
  try {
    const { annuiyInputData, request_meta } = req.body;

    // Validate input
    if (!annuiyInputData || !request_meta) {
      return res.status(400).json({ error: "Input data required" });
    }

    // Determine internal API URL
    let url;
    if (annuiyInputData.Product === "Demo FIA") {
      url = process.env.API_URL_FIA 
    } else if (annuiyInputData.Product === "Demo MYGA") {
      url = process.env.API_URL_MYGA 
    }

    if (!url) {
      console.error(
        "Internal API URL is undefined. Product:",
        annuiyInputData.Product
      );
      return res.status(500).json({ error: "Internal API URL is not defined" });
    }

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
      "x-tenant-name": "life-innovators",
      "x-synthetic-key": "da13cd4d-23ad-4987-8fac-037a3530d338",
    };

    // Call internal API
    const apiResponse = await axios.post(
      url,
      { request_data: { inputs: annuiyInputData }, request_meta },
      { headers }
    );

    const responseOutput = apiResponse.data;

    if (
      !responseOutput.status ||
      responseOutput.status !== "Success" ||
      !responseOutput.response_data ||
      !responseOutput.response_data.outputs ||
      !responseOutput.response_data.outputs.Illustration ||
      responseOutput.response_data.outputs.Illustration.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Internal API returned no valid data" });
    }

    const responseObject = responseOutput.response_data.outputs;

    // Build list of PDFs to merge
    const pdfList = Object.keys(responseObject)
      .map((key) => {
        if (key.startsWith("ILLUSTRATION_")) {
          const page = key.replace("ILLUSTRATION_", "Pages ");
          const pageInfo = responseObject.pagecounts?.find(
            (p) => p.Page === page
          );
          const pageCount = pageInfo ? pageInfo.PageCount : 0;

          if (pageCount > 0) {
            return { PDFUrl: responseObject[key].PDFUrl, PageCount: pageCount };
          }
        }
        return null;
      })
      .filter(Boolean);

    if (!pdfList.length) {
      return res.status(400).json({ error: "No PDFs to merge" });
    }

    // Download PDFs
    const pdfBuffers = await Promise.all(
      pdfList.map(async ({ PDFUrl }) => {
        if (!PDFUrl)
          throw new Error("PDFUrl is undefined for one of the illustrations");
        const resp = await axios.get(PDFUrl, { responseType: "arraybuffer" });
        if (resp.status !== 200)
          throw new Error(`Failed to fetch PDF: ${PDFUrl}`);
        return Buffer.from(resp.data);
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

    // Send PDF response
    const reportTitle = responseObject.reportTitle || "Illustration";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${reportTitle}_${timestamp}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.send(Buffer.from(finalPdfBytes));

    console.log("PDF successfully generated and sent:", fileName);
  } catch (err) {
    console.error("Submit & merge failed:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
};
