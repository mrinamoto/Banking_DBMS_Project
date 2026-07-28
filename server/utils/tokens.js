const crypto = require("node:crypto");

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function signToken(payload) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  const body = encode(JSON.stringify({ ...payload, exp: Date.now() + 8 * 60 * 60 * 1000 }));
  const signature = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) throw new Error("Invalid session");
  const expected = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  const supplied = Buffer.from(signature);
  const valid = supplied.length === expected.length && crypto.timingSafeEqual(supplied, Buffer.from(expected));
  if (!valid) throw new Error("Invalid session");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp < Date.now()) throw new Error("Session expired");
  return payload;
}

module.exports = { signToken, verifyToken };
