const express = require("express");
const cors = require("cors");
const database = require("./config/database");
const routes = require("./router/routes");
const bodyparser = require("body-parser");
const path = require("path");
require("dotenv").config();
const port = process.env.PORT || 3000;

const app = express();

// Configuración de CORS
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware: POST, PUT, PATCH
app.use(bodyparser.json());
app.use('/api/v1', routes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  database();
});
