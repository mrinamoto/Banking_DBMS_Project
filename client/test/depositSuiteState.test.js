import test from "node:test";
import assert from "node:assert/strict";
import { finishSection, hasActiveSchemes, shouldShowInitialLoader } from "../src/pages/depositSuiteState.js";

test("a failed quote section preserves successful schemes", () => {
  const schemes = [{ schemeId: 1, status: "ACTIVE" }];
  const quoteState = finishSection({ data: [], loading: true, error: "" }, { error: "Quotes unavailable" });
  assert.deepEqual(schemes, [{ schemeId: 1, status: "ACTIVE" }]);
  assert.equal(quoteState.error, "Quotes unavailable");
  assert.deepEqual(quoteState.data, []);
});

test("typing after a load error cannot request the initial loader", () => {
  assert.equal(shouldShowInitialLoader(false), false);
});

test("no active scheme is an empty state", () => {
  assert.equal(hasActiveSchemes([{ schemeId: 1, status: "INACTIVE" }]), false);
  assert.equal(hasActiveSchemes([{ schemeId: 1, status: "ACTIVE" }]), true);
});

test("retry replaces a section error with fresh data", () => {
  const state = finishSection({ data: [], loading: true, error: "Quotes unavailable" }, { data: [{ CERTIFICATE_ID: 7 }] });
  assert.equal(state.error, "");
  assert.deepEqual(state.data, [{ CERTIFICATE_ID: 7 }]);
});
