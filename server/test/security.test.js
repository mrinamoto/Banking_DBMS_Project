const test = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, verifyPassword } = require("../utils/passwords");
const { signToken, verifyToken } = require("../utils/tokens");
const { assertAccountAccess, assertBranchId, assertLoanAccess } = require("../utils/authorization");

test("scrypt hash verifies only the correct password", async () => {
  const hash = await hashPassword("classroom-password");
  assert.equal(await verifyPassword("classroom-password", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
  assert.equal(hash.includes("classroom-password"), false);
});

test("signed token detects tampering", () => {
  process.env.SESSION_SECRET = "test-only-secret-with-at-least-32-characters";
  const token = signToken({ id: 7, username: "tester", role: "ADMIN" });
  assert.equal(verifyToken(token).id, 7);
  assert.throws(() => verifyToken(`${token}x`), /Invalid session/);
});

test("manager and employee branch scope rejects another branch", () => {
  assert.throws(
    () => assertBranchId({ role: "MANAGER", branchId: 2 }, 3),
    (error) => error.status === 403
  );
  assert.doesNotThrow(() => assertBranchId({ role: "EMPLOYEE", branchId: 2 }, 2));
  assert.doesNotThrow(() => assertBranchId({ role: "ADMIN", branchId: null }, 3));
});

test("customer account ownership rejects another customer", async () => {
  const connection = { execute: async () => ({ rows: [{ ACCOUNT_ID: 4, CUSTOMER_ID: 9, BRANCH_ID: 2, ACCOUNT_NUMBER: "1004" }] }) };
  await assert.rejects(
    assertAccountAccess(connection, { role: "CUSTOMER", customerId: 8 }, "1004"),
    (error) => error.status === 403
  );
});

test("manager loan access rejects another branch", async () => {
  const connection = { execute: async () => ({ rows: [{ LOAN_ID: 3, CUSTOMER_ID: 8, BRANCH_ID: 5 }] }) };
  await assert.rejects(
    assertLoanAccess(connection, { role: "MANAGER", branchId: 2 }, 3),
    (error) => error.status === 403
  );
});
