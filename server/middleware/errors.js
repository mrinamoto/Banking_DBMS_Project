function notFound(req, res) {
  res.status(404).json({ message: "API endpoint not found." });
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[${new Date().toISOString()}]`, error.message);
  const businessError = Number(error.errorNum) >= 20000 && Number(error.errorNum) <= 20999;
  const validationError = error.status === 400;
  res.status(businessError || validationError ? 400 : error.status || 500).json({
    message: businessError ? String(error.message).replace(/^ORA-\d+:\s*/, "").split("\n")[0] : validationError ? error.message : "The request could not be completed.",
  });
}

module.exports = { notFound, errorHandler };
