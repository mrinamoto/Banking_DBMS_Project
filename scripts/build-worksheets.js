const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const worksheetDir = path.join(root, "database", "worksheet");

function readSource(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "");
  return source
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:SET\s+SERVEROUTPUT\s+ON|@@?|CONNECT\b|EXIT\b|SPOOL\b|PROMPT\b|WHENEVER\b)/i.test(line))
    .join("\n")
    .replace(/\n+$/, "");
}

function part(relativePath) {
  return [`-- ===== ${relativePath} =====`, readSource(relativePath), ""].join("\n");
}

function bundle(header, files) {
  return `${header}\n\n${files.map(part).join("\n")}`.replace(/\n+$/, "\n");
}

function build() {
  const freshFiles = [
    "database/sql/01_create_tables.sql",
    "database/sql/02_constraints.sql",
    "database/sql/05_indexes.sql",
    "database/sql/03_insert_sample_data.sql",
    "database/sql/04_views.sql",
    "database/sql/07_functions.sql",
    "database/sql/11_packages.sql",
    "database/sql/08_procedures.sql",
    "database/sql/10_triggers.sql",
    "database/sql/12_viva_demo_data.sql",
  ];
  const fresh = bundle(
    "-- Browser FreeSQL worksheet for a complete empty-schema installation.\n-- Review before running; this script does not drop objects.",
    freshFiles,
  );
  const drop = readSource("database/sql/00_drop_objects.sql");
  const reset = `-- WARNING: DESTRUCTIVE DEVELOPMENT-ONLY WORKSHEET.\n-- This drops project objects and data. Never run against a valuable schema.\n\n${drop}\n\n${fresh}`;
  const upgradeFiles = [
    "database/migrations/001_staff_users_explorer_dashboard.sql",
    "database/migrations/002_reversal_statement_customer_tools.sql",
    "database/migrations/003_deposit_profit_suite.sql",
    "database/migrations/004_final_viva_hardening.sql",
    "database/migrations/005_viva_demo_data_and_services.sql",
    "database/migrations/006_unified_staff_principal_model.sql",
    "database/sql/03_insert_sample_data.sql",
    "database/sql/04_views.sql",
    "database/sql/07_functions.sql",
    "database/sql/11_packages.sql",
    "database/sql/08_procedures.sql",
    "database/sql/10_triggers.sql",
    "database/sql/12_viva_demo_data.sql",
  ];
  const upgrade = bundle(
    "-- Browser FreeSQL worksheet for a non-destructive final upgrade.\n-- It preserves customers, accounts, transactions, balances, and passwords.",
    upgradeFiles,
  );
  const verify = readSource("database/tests/verify_install.sql") + "\n";
  return {
    "database/worksheet/full_fresh_install.sql": fresh,
    "database/worksheet/full_reset_and_install.sql": reset,
    "database/worksheet/full_upgrade.sql": upgrade,
    "database/worksheet/verify_install.sql": verify,
  };
}

function writeBundles(bundles) {
  for (const [relativePath, contents] of Object.entries(bundles)) {
    fs.writeFileSync(path.join(root, relativePath), contents, "utf8");
  }
}

if (require.main === module) {
  const bundles = build();
  if (process.argv.includes("--check")) {
    const mismatches = Object.entries(bundles).filter(([relativePath, contents]) => fs.readFileSync(path.join(root, relativePath), "utf8") !== contents);
    if (mismatches.length) {
      console.error(`Worksheet mismatch: ${mismatches.map(([relativePath]) => relativePath).join(", ")}`);
      process.exitCode = 1;
    } else {
      console.log("Generated worksheets are synchronized with modular SQL sources.");
    }
  } else {
    writeBundles(bundles);
    console.log(`Generated ${Object.keys(bundles).length} browser-safe worksheet files.`);
  }
}

module.exports = { build, writeBundles };
