const test = require("node:test");
const assert = require("node:assert/strict");
const { assertStaffRole } = require("../controllers/staffController");
const { getResource, buildQuery, resources } = require("../controllers/explorerController");
const { allowRoles } = require("../middleware/auth");

test("public registration cannot select a staff role", () => {
  assert.throws(() => assertStaffRole({ role: "ADMIN" }, "CUSTOMER"), (error) => error.status === 400);
});

test("manager staff role rules allow employee only", () => {
  assert.doesNotThrow(() => assertStaffRole({ role: "MANAGER" }, "EMPLOYEE"));
  assert.throws(() => assertStaffRole({ role: "MANAGER" }, "MANAGER"), (error) => error.status === 403);
  assert.throws(() => assertStaffRole({ role: "MANAGER" }, "ADMIN"), (error) => error.status === 400 || error.status === 403);
});

test("explorer rejects unknown resources and invalid sorts", () => {
  assert.throws(() => getResource("arbitrary-sql", "ADMIN"), (error) => error.status === 400);
  assert.throws(() => buildQuery(resources.accounts, { user: { role: "ADMIN" }, query: { sort: "PASSWORD_HASH" } }), (error) => error.status === 400);
  assert.throws(() => buildQuery(resources.accounts, { user: { role: "ADMIN" }, query: { direction: "SIDEWAYS" } }), (error) => error.status === 400);
});

test("manager explorer SQL includes a server-side branch predicate", () => {
  const query = buildQuery(resources.accounts, { user: { role: "MANAGER", branchId: 7 }, query: {} });
  assert.match(query.sql, /a\.branch_id=:branchId/);
  assert.doesNotMatch(query.sql, /password_hash/i);
});

test("explorer user columns never expose password hashes", () => {
  assert.equal(resources.users.columns.some((column) => /password/i.test(column)), false);
});

test("employee and customer roles receive 403 for staff middleware", () => {
  for (const role of ["EMPLOYEE", "CUSTOMER"]) {
    let status;
    allowRoles("ADMIN", "MANAGER")({ user: { role } }, { status: (value) => { status = value; return { json: () => {} }; } }, () => {});
    assert.equal(status, 403);
  }
});
