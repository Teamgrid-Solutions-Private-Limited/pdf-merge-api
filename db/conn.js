const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Create the database connection
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(uri, options);
    console.log(
      `MongoDB connected successfully: ${connection.connection.host}`
    );
    return connection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Connect to the database
const DB = connectDB();

module.exports = DB;
