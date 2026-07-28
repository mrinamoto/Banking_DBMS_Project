require("dotenv").config();

console.log(process.env.DB_USER);
console.log(process.env.DB_CONNECT_STRING);

const { getConnection } = require("./config/db");

async function testConnection() {
  let connection;

  try {
    connection = await getConnection();

    console.log("✅ Database Connected Successfully!");

    const result = await connection.execute(
      `SELECT * FROM branches`
    );

    console.log(result.rows);

  } catch (err) {

    console.error("❌ Connection Error:");
    console.error(err);

  } finally {

    if (connection) {
      await connection.close();
    }

    process.exit(0);
  }
}

testConnection();