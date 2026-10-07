#!/usr/bin/env node
// pkgvet — look before you npm install.

const fs = require("fs");
const { analyze } = require("./analyzer");
const { printReport } = require("./reporter");

const BANDS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function usage() {
  console.log(`
pkgvet <package>[@version] [options]

  package           npm package name, scoped names work too

options:
  --json               machine-readable output
  --fail-on <band>     exit 1 if risk is band or worse (for CI)
  --out <file>         write the report (json) to a file
  -h, --help           this
`.trim());
}

function parseTarget(t) {
  // lodash@4.17.21 vs @scope/name@1.2.3 vs lodash — last @ wins, unless it's position 0
  const at = t.lastIndexOf("@");
  if (at > 0) return { name: t.slice(0, at), version: t.slice(at + 1) || null };
  return { name: t, version: null };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("-h") || args.includes("--help")) {
    usage();
    process.exit(args.length ? 0 : 1);
  }

  let target = null, json = false, failOn = null, out = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json") json = true;
    else if (a === "--fail-on") failOn = (args[++i] || "").toUpperCase();
    else if (a === "--out") out = args[++i];
    else if (!target) target = a;
    else { console.error(`unexpected arg: ${a}`); process.exit(1); }
  }
  if (failOn && !BANDS.includes(failOn)) {
    console.error(`--fail-on must be one of ${BANDS.join("|")}`);
    process.exit(1);
  }

  const { name, version } = parseTarget(target);

  let result;
  try {
    result = await analyze(name, version);
  } catch (e) {
    console.error(`analysis failed: ${e.message}`);
    process.exit(1);
  }

  if (out) {
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.error(`wrote ${out}`);
  }
  printReport(result, { json });

  if (failOn && BANDS.indexOf(result.band) >= BANDS.indexOf(failOn)) process.exit(1);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
