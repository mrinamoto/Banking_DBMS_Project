const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const bankingRoutes = require("./routes/bankingRoutes");
const staffRoutes = require("./routes/staffRoutes");
const explorerRoutes = require("./routes/explorerRoutes");
const customerToolsRoutes = require("./routes/customerToolsRoutes");
const depositRoutes = require("./routes/depositRoutes");
const { notFound, errorHandler } = require("./middleware/errors");
const { getConnection } = require("./config/db");

function createApp() {
  const app = express();
  const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  app.disable("x-powered-by");
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      await connection.execute("SELECT 1 AS ok FROM dual");
      res.json({ status: "ok", database: "connected" });
    } catch (error) {
      console.error(`Database health check failed: ${error.message}`);
      res.status(503).json({ status: "unavailable", database: "disconnected" });
    } finally {
      if (connection) await connection.close();
    }
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/explorer", explorerRoutes);
  app.use("/api", customerToolsRoutes);
  app.use("/api", depositRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api", bankingRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
