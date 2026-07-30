const oracledb = require("oracledb");

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

let pool;

function requiredDatabaseConfig() {
  const names = ["DB_USER", "DB_PASSWORD", "DB_CONNECT_STRING"];
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
  };
  if (process.env.DB_WALLET_DIR) config.walletLocation = process.env.DB_WALLET_DIR;
  if (process.env.DB_WALLET_PASSWORD) config.walletPassword = process.env.DB_WALLET_PASSWORD;
  return config;
}

async function initializePool() {
  if (!pool) {
    pool = await oracledb.createPool({
      ...requiredDatabaseConfig(),
      poolMin: Number(process.env.DB_POOL_MIN || 1),
      poolMax: Number(process.env.DB_POOL_MAX || 5),
      poolIncrement: 1,
    });
  }
  return pool;
}

async function getConnection() {
  if (!pool) await initializePool();
  return pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(10);
    pool = undefined;
  }
}

module.exports = { getConnection, initializePool, closePool, requiredDatabaseConfig };
