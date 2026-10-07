const { fetchDoc, fetchDownloads } = require("./npm");
const checks = require("./checks");

async function analyze(name, wantedVersion) {
  const doc = await fetchDoc(name);
  const { version, meta } = checks.pickVersion(doc, wantedVersion);
  const downloads = await fetchDownloads(name);

  const findings = [
    ...checks.checkInstallScripts(meta),
    ...checks.checkTyposquat(name),
    ...checks.checkDeprecated(meta),
    ...checks.checkMaintainers(doc),
    ...checks.checkFreshness(doc, version),
    ...checks.checkDownloads(downloads),
    ...checks.checkDeps(meta),
    ...checks.checkRepoLicense(meta),
  ];
  findings.sort((a, b) => b.score - a.score);
  const score = Math.min(100, findings.reduce((s, f) => s + f.score, 0));

  return {
    name,
    version,
    downloads,
    score,
    band: checks.bandFor(score),
    findings,
  };
}

module.exports = { analyze };
