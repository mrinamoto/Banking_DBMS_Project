const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("unified staff principal model is represented in source", () => {
  const schema = read("database/sql/01_create_tables.sql");
  assert.match(schema, /role IN \('ADMIN','MANAGER','EMPLOYEE'\) AND employee_id IS NOT NULL AND customer_id IS NULL AND staff_code IS NOT NULL/);
  assert.match(read("database/sql/10_triggers.sql"), /:NEW\.role IN \('ADMIN', 'MANAGER', 'EMPLOYEE'\)/);
  assert.match(read("database/migrations/006_unified_staff_principal_model.sql"), /Unified staff principal migration complete/);
});

test("viva source contains thirteen staff and twenty-five customers", () => {
  const sql = read("database/sql/12_viva_demo_data.sql");
  for (const id of ["A-ID-001", "A-ID-002", "A-ID-003", "A-ID-004", "M-ID-001", "E-ID-001", "E-ID-008"]) assert.match(sql, new RegExp(id));
  for (const name of ["Farhan Noor", "Meher Afroz", "Tanim Chowdhury", "Priya Saha", "Zayan Ahmed"]) assert.match(sql, new RegExp(name));
  assert.match(sql, /DEMO-NID-'\|\|LPAD\(i,4,'0'\)/);
  assert.doesNotMatch(sql, /password_hash|temporaryPassword|base-secret/i);
});

test("fresh reference data contains the complete educational deposit catalogue", () => {
  const sql = read("database/sql/03_insert_sample_data.sql") + read("database/sql/12_viva_demo_data.sql");
  for (const code of ["FD-SIMPLE", "FD-COMPOUND", "DPS-EDU", "STUDENT-SAVE", "SENIOR-SAVE", "FD-PREMIUM", "DPS-FLEX"]) {
    assert.match(sql, new RegExp(code));
  }
});

test("migration and drop source cover final objects", () => {
  const migration = read("database/migrations/006_unified_staff_principal_model.sql");
  const drop = read("database/sql/00_drop_objects.sql");
  assert.match(migration, /bank_profile/i);
  assert.match(migration, /A-ID-004/);
  assert.match(drop, /BANK_PROFILE/);
  assert.doesNotMatch(read("database/sql/12_viva_demo_data.sql"), /IF\s+NOT\s+EXISTS\s*\(/i);
});
