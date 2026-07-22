function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === "");
  if (missing.length) {
    const error = new Error(`Required fields: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

function pageOptions(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize, 10) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

async function withConnection(getConnection, work) {
  let connection;
  try {
    connection = await getConnection();
    return await work(connection);
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { requireFields, pageOptions, withConnection };
