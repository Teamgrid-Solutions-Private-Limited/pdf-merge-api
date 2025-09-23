const axios = require("axios");
const { PDFDocument } = require("pdf-lib");

exports.processRecords = async (req, res) => {
  try {
    const { action, ...requestData } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action parameter required" });
    }

    if (action === 'submit') {
      // Step 1: Submit and get responseObject
      const { annuiyInputData, request_meta, url, headers } = requestData;

      if (!annuiyInputData || !request_meta || !url) {
        return res.status(400).json({ error: "Input data required" });
      }

      const apiResponse = await axios.post(
        url,
        { request_data: { inputs: annuiyInputData }, request_meta },
        { headers }
      );

      const responseOutput = apiResponse.data;

      if (
        !responseOutput.status ||
        responseOutput.status !== "Success" ||
        !responseOutput.response_data?.outputs?.Illustration?.length
      ) {
        return res
          .status(400)
          .json({ error: "Internal API returned no valid data" });
      }

      // ✅ Send JSON only
      res.json(responseOutput);

    } else if (action === 'print') {
      // Step 2: Merge PDFs (called only when user clicks "Print Records")
      const { responseObject } = requestData;

      if (!responseObject) {
        return res.status(400).json({ error: "responseObject required" });
      }

      // Helper function to get page count (moved from frontend)
      const getPageCount = (key) => {
        const page = key.replace('ILLUSTRATION_', 'Pages ');
        const pageInfo = responseObject.pagecounts?.find(p => p.Page === page);
        return pageInfo ? pageInfo.PageCount : 0;
      };

      // Extract PDF data exactly like frontend logic
      const pdfData = Object.keys(responseObject).map((key) => {
        if (key.startsWith('ILLUSTRATION_')) {
          const pageCount = getPageCount(key);
          if (pageCount > 0) {
            return {
              PDFUrl: responseObject[key].PDFUrl,
              PDFName: responseObject[key].PDFName,
              PageCount: pageCount,
            };
          }
        }
        return null;
      }).filter(item => item !== null);

      if (pdfData.length === 0) {
        return res.status(400).json({ error: "No PDFs to merge" });
      }

      // Fetch all PDF array buffers (like frontend fetch logic)
      const pdfBytesArray = await Promise.all(
        pdfData.map(async ({ PDFUrl }) => {
          const response = await axios.get(PDFUrl, { responseType: "arraybuffer" });
          if (response.status !== 200) {
            throw new Error(`Failed to fetch ${PDFUrl}`);
          }
          return response.data;
        })
      );

      // Load PDF documents
      const pdfDocs = await Promise.all(pdfBytesArray.map((bytes) => {
        return PDFDocument.load(bytes);
      }));

      // Create merged PDF exactly like frontend logic
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

      // Generate filename
      const reportTitle = responseObject.reportTitle || "Illustration";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${reportTitle}_${timestamp}.pdf`;

      // Set headers to open PDF in new tab
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${fileName}`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      
      // Send the PDF buffer
      res.send(Buffer.from(mergedPdfBytes));

      console.log("PDF successfully generated:", fileName);

    } else {
      return res.status(400).json({ error: "Invalid action. Use 'submit' or 'print'" });
    }

  } catch (error) {
    console.error('Process records failed:', error);
    res.status(500).json({ error: "Process failed", details: error.message });
  }
};