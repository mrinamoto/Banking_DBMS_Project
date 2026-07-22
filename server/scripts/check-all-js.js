const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const ignored = new Set(["node_modules", "dist", "build", "coverage"]);

function findJavaScript(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignored.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findJavaScript(fullPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
  });
}

const files = findJavaScript(root);
let failures = 0;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failures += 1;
}

if (failures) {
  console.error(`${failures} JavaScript file(s) failed syntax validation.`);
  process.exitCode = 1;
} else {
  console.log(`Syntax validation passed for ${files.length} project JavaScript files.`);
}
