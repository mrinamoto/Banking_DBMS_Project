const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("viva data contains requested fictional identities without passwords", () => {
  const sql = read("database/sql/12_viva_demo_data.sql");
  for (const name of ["Nusrat Jahan", "Shamim Hasan", "Geko Topadar", "Alongir Tejo"]) assert.match(sql, new RegExp(name));
  assert.doesNotMatch(sql, /password_hash|temporaryPassword|base-secret/i);
  assert.match(sql, /pkg_banking_operations\.open_account/);
  assert.match(sql, /pkg_banking_operations\.transfer_funds/);
  assert.match(sql, /pkg_loan_operations\.apply_for_loan/);
});

test("runtime seed contains all named staff IDs and does not store passwords", () => {
  const source = read("server/scripts/seed-viva-users.js");
  for (const id of ["A-ID-001", "A-ID-002", "A-ID-003", "A-ID-004", "M-ID-001", "E-ID-001", "E-ID-008"]) assert.match(source, new RegExp(id));
  assert.doesNotMatch(source, /replace_with|password_hash\s*[:=]\s*['"]/i);
  assert.match(source, /must_change_password='Y'/);
});

test("notification and service-request API contracts are routed", () => {
  const app = read("server/app.js");
  assert.match(app, /notificationRoutes/);
  assert.match(app, /serviceRequestRoutes/);
  assert.match(read("server/routes/notificationRoutes.js"), /read-all/);
  assert.match(read("server/routes/serviceRequestRoutes.js"), /service-requests|assign/);
  assert.match(read("database/sql/01_create_tables.sql"), /CREATE TABLE notifications/);
  assert.match(read("database/sql/01_create_tables.sql"), /CREATE TABLE service_requests/);
});
