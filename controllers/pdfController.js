// utils/pdfHandler.js
const axios = require("axios");

const { PDFDocument } = require("pdf-lib");
 const headers = {
      "Content-Type": "application/json",
      "x-tenant-name": "life-innovators",
      "x-synthetic-key": "da13cd4d-23ad-4987-8fac-037a3530d338",
    };
    const request_meta = {  compiler_type: "Neuron" };
  request_meta.xreport_options = {"multiple_docs": true, "page_numbers": false};
const processRecordsHandler = (urlFromEnv) => async (req, res) => {
  try {
    const { printIllustration, ...requestData } = req.body;
    requestData.url = urlFromEnv;

    if (!printIllustration) {
      return res.status(400).json({ error: "printIllustration parameter required" });
    }

    const { annuiyInputData, url } = requestData;
    if (!annuiyInputData || !url) {
      return res.status(400).json({ error: "Input data required" });
    }

    const apiResponse = await axios.post(
      url,
      { request_data: { inputs: annuiyInputData }, request_meta },
      { headers }
    );

    if (printIllustration === "no") {
      const responseOutput = apiResponse.data;
      if (!responseOutput.status || responseOutput.status !== "Success") {
        return res.status(400).json({ error: "Internal API returned no valid data" });
      }
      return res.json(responseOutput);

    } else if (printIllustration === "yes") {
      const responseObject = apiResponse.data?.response_data?.outputs;
      if (!responseObject) return res.status(400).json({ error: "responseObject required" });

      const getPageCount = (key) => {
        const page = key.replace('ILLUSTRATION_', 'Pages ');
        const pageInfo = responseObject.pagecounts?.find(p => p.Page === page);
        return pageInfo ? pageInfo.PageCount : 0;
      };

      const pdfData = Object.keys(responseObject)
        .filter(k => k.startsWith("ILLUSTRATION_"))
        .map(key => {
          const pageCount = getPageCount(key);
          if (pageCount > 0) {
            return {
              PDFUrl: responseObject[key].PDFUrl,
              PDFName: responseObject[key].PDFName,
              PageCount: pageCount,
            };
          }
          return null;
        })
        .filter(Boolean);

      if (!pdfData.length) return res.status(400).json({ error: "No PDFs to merge" });

      const pdfBytesArray = await Promise.all(
        pdfData.map(async ({ PDFUrl }) => {
          const response = await axios.get(PDFUrl, { responseType: "arraybuffer" });
          if (response.status !== 200) throw new Error(`Failed to fetch ${PDFUrl}`);
          return response.data;
        })
      );

      const pdfDocs = await Promise.all(pdfBytesArray.map(bytes => PDFDocument.load(bytes)));
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfData.length; i++) {
        const { PageCount } = pdfData[i];
        const pdfDoc = pdfDocs[i];
        const totalPages = pdfDoc.getPageCount();
        const pagesToCopy = Array.from({ length: Math.min(PageCount, totalPages) }, (_, i) => i);
        const pages = await mergedPdf.copyPages(pdfDoc, pagesToCopy);
        pages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const reportTitle = responseObject.reportTitle || "Illustration";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${reportTitle}_${timestamp}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${fileName}`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.send(Buffer.from(mergedPdfBytes));

    } else {
      return res.status(400).json({ error: "Invalid action. Use 'submit' or 'print'" });
    }
  } catch (error) {
    console.error('Process records failed:', error);
    res.status(500).json({ error: "Process failed", details: error.message });
  }
};

module.exports = { processRecordsHandler };
