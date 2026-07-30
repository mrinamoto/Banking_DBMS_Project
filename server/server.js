const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const createApp = require("./app");
const { initializePool, closePool } = require("./config/db");

async function startServer() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  await initializePool();
  const port = Number(process.env.PORT || 5000);
  const server = createApp().listen(port, () => console.log(`Banking API listening on port ${port}`));
  const shutdown = async () => server.close(async () => { await closePool(); process.exit(0); });
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exitCode = 1;
});
