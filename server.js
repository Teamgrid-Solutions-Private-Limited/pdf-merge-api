require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet()); 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); 


const DB = require("./db/conn");

const indexRoutes = require("./routes/index");
app.use("/api", indexRoutes);
app.use("/api/pdf", require("./controllers/pdfController"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
