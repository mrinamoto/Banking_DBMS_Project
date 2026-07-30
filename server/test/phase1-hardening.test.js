const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("fresh schema contains staff principal and loan catalogue constraints", () => {
  const schema = read("database/sql/01_create_tables.sql");
  assert.match(schema, /staff_code VARCHAR2\(20\).*uk_users_staff_code/s);
  assert.match(schema, /ck_user_principal CHECK/);
  assert.match(schema, /short_description VARCHAR2\(200\)/);
  assert.match(schema, /interest_method VARCHAR2\(20\)/);
  assert.match(read("database/sql/10_triggers.sql"), /trg_validate_user_staff_code/i);
});

test("banking package assigns initial reference before ledger insert", () => {
  const source = read("database/sql/11_packages.sql");
  const assignment = source.indexOf("v_initial_reference := reference('DEP');");
  const insert = source.indexOf("INSERT INTO transactions", assignment);
  assert.ok(assignment >= 0 && insert > assignment);
  assert.doesNotMatch(source, /reference\('DEP'\)\s*,/);
});

test("worksheets are synchronized and browser-safe", () => {
  for (const file of ["full_fresh_install.sql", "full_reset_and_install.sql", "full_upgrade.sql"]) {
    const worksheet = read(`database/worksheet/${file}`);
    assert.match(worksheet, /v_initial_reference := reference\('DEP'\);/);
    assert.doesNotMatch(worksheet, /^\s*(?:@|@@|CONNECT|EXIT|SPOOL|SET\s|PROMPT\s|WHENEVER\s)/mi);
  }
  assert.match(read("database/worksheet/verify_install.sql"), /USER_ERRORS/i);
});

test("database doctor is credential-safe", () => {
  const source = read("server/scripts/db-doctor.js");
  assert.doesNotMatch(source, /process\.env\.DB_PASSWORD\s*\)/);
  assert.match(source, /SELECT 1 AS connection_test FROM dual/);
  assert.match(source, /user_errors/i);
});
