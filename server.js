require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const connectDB = require("./config/db");
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'GeoMeter API is running successfully' });
});

app.use("/api", require("./routes/calculate"));
app.use("/api/zones", require("./routes/zones"));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
