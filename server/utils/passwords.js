const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 10) {
    throw new Error("Password must contain at least 10 characters.");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [algorithm, salt, expectedHex] = String(stored || "").split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
