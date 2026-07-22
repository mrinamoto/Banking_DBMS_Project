const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const bankingRoutes = require("./routes/bankingRoutes");
const { notFound, errorHandler } = require("./middleware/errors");

function createApp() {
  const app = express();
  const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  app.disable("x-powered-by");
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api", bankingRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
