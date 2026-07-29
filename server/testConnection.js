require("dotenv").config();

const { getConnection } = require("./config/db");

async function testConnection() {
  let connection;

  try {
    connection = await getConnection();

    console.log("Database connection succeeded.");

    const result = await connection.execute(
      "SELECT COUNT(*) AS branch_count FROM branches"
    );

    console.log(`Branches visible: ${result.rows[0].BRANCH_COUNT}`);

  } catch (err) {

    console.error(`Connection failed: ${err.message}`);

  } finally {

    if (connection) {
      await connection.close();
    }

    process.exitCode = connection ? 0 : 1;
  }
}

testConnection();
