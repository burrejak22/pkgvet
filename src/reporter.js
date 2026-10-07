// pretty output. colors are manual ansi, no dep needed for that.

const COLORS = { CRITICAL: "\x1b[31m", HIGH: "\x1b[33m", MEDIUM: "\x1b[93m", LOW: "\x1b[32m" };
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function bar(score) {
  const filled = Math.round(score / 5); // 20 blocks total
  return "█".repeat(filled) + "░".repeat(20 - filled);
}

function printReport(r, { json = false } = {}) {
  if (json) {
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  const color = COLORS[r.band] || "";
  const dl = r.downloads === null || r.downloads === undefined
    ? "download stats unavailable"
    : `${r.downloads.toLocaleString()} downloads last month`;
  console.log(`\n${BOLD}${r.name}@${r.version}${RESET}  (${dl})`);
  console.log(`${color}${BOLD}[${r.band}]${RESET} risk score: ${BOLD}${r.score}/100${RESET} ${color}${bar(r.score)}${RESET}\n`);

  if (!r.findings.length) {
    console.log("clean — nothing flagged. either it's solid or we're not looking hard enough.\n");
    return;
  }
  for (const f of r.findings) {
    console.log(`  ${color}▸${RESET} ${BOLD}+${f.score}${RESET}  ${f.code}`);
    console.log(`     ${f.detail}`);
  }
  console.log("");
}

module.exports = { printReport };
