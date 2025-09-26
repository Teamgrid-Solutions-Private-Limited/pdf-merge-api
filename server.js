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

const indexRoutes = require("./routes/index");
const pdfRoutes = require("./routes/pdfRoutes");
app.use("/", indexRoutes);
app.use("/v1", pdfRoutes);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
