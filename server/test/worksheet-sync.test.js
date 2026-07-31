const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { build } = require("../../scripts/build-worksheets");

test("browser worksheets match modular SQL sources", () => {
  for (const [relativePath, expected] of Object.entries(build())) {
    const actual = fs.readFileSync(path.join(__dirname, "..", "..", relativePath), "utf8");
    assert.equal(actual, expected, `${relativePath} is stale; run npm run db:build-worksheets`);
    assert.doesNotMatch(actual, /^\s*(?:@|@@|CONNECT|EXIT|SPOOL|SET\s|PROMPT\s|WHENEVER\s)/im);
  }
});
