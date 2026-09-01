const transactionRoutes = require('./routes/transactionRoutes');
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/transactions', transactionRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "FinPilot API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});