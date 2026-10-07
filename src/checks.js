// what makes a package sketchy, and how much we care

function pickVersion(doc, wanted) {
  const versions = Object.keys(doc.versions || {});
  if (!versions.length) throw new Error("no versions published — empty package?");
  if (wanted) {
    if (!doc.versions[wanted]) throw new Error(`version ${wanted} doesn't exist`);
    return { version: wanted, meta: doc.versions[wanted] };
  }
  const latest = doc["dist-tags"] && doc["dist-tags"].latest;
  const v = latest && doc.versions[latest] ? latest : versions[versions.length - 1];
  return { version: v, meta: doc.versions[v] };
}

function checkInstallScripts(meta) {
  const scripts = meta.scripts || {};
  const hits = ["preinstall", "install", "postinstall"].filter((s) => scripts[s]);
  if (hits.length) {
    return [{
      code: "INSTALL_SCRIPTS",
      score: 35,
      detail: `runs ${hits.join(", ")} on install — arbitrary code execution, the #1 supply-chain vector`,
    }];
  }
  return [];
}

function checkMaintainers(doc) {
  const n = (doc.maintainers || []).length;
  if (n === 0) {
    return [{ code: "NO_MAINTAINERS", score: 15, detail: "no maintainers listed — who's steering this thing?" }];
  }
  if (n === 1) {
    return [{ code: "SINGLE_MAINTAINER", score: 10, detail: "single maintainer — bus factor of one" }];
  }
  return [];
}

function checkFreshness(doc, version) {
  const t = doc.time && (doc.time[version] || doc.time.modified);
  if (!t) return [];
  const days = (Date.now() - new Date(t).getTime()) / 86400000;
  if (days > 730) {
    const years = Math.round((days / 365) * 10) / 10;
    return [{ code: "STALE", score: 15, detail: `last published ${years} years ago — unmaintained code rots` }];
  }
  if (days > 365) {
    return [{ code: "AGING", score: 8, detail: "no release in over a year" }];
  }
  return [];
}

function checkDeprecated(meta) {
  if (meta.deprecated) {
    return [{ code: "DEPRECATED", score: 20, detail: `deprecated: ${String(meta.deprecated).slice(0, 120)}` }];
  }
  return [];
}

function checkDownloads(count) {
  if (count === null || count === undefined) return [];
  if (count < 1000) {
    return [{
      code: "LOW_DOWNLOADS",
      score: 15,
      detail: `only ${count.toLocaleString()} downloads last month — obscure packages deserve extra scrutiny`,
    }];
  }
  return [];
}

// the greatest hits — if you're one typo away from one of these, that's a smell
const POPULAR = [
  "react", "react-dom", "lodash", "express", "axios", "chalk", "commander",
  "debug", "fs-extra", "moment", "uuid", "semver", "glob", "minimist",
  "typescript", "webpack", "eslint", "prettier", "jest", "dotenv", "cors",
  "body-parser", "mongoose", "redis", "jsonwebtoken", "bcrypt", "nodemailer",
  "vue", "next", "nuxt", "svelte", "jquery", "d3", "three", "commander",
];

function levenshtein(a, b) {
  // standard dynamic programming, nothing fancy
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

function checkTyposquat(name) {
  const base = name.startsWith("@") ? name.split("/")[1] : name;
  let best = null, bestDist = 3;
  for (const p of POPULAR) {
    if (p === base) return []; // it IS the popular one, obviously fine
    const d = levenshtein(base, p);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  if (best) {
    return [{
      code: "TYPOSQUAT_RISK",
      score: 30,
      detail: `"${name}" is ${bestDist} edit(s) away from "${best}" — classic typosquat shape, double-check you typed it right`,
    }];
  }
  return [];
}

function checkDeps(meta) {
  const n = Object.keys(meta.dependencies || {}).length;
  if (n > 30) {
    return [{
      code: "MANY_DEPS",
      score: 8,
      detail: `${n} runtime dependencies — every one is someone else's code in your supply chain`,
    }];
  }
  return [];
}

function checkRepoLicense(meta) {
  const out = [];
  if (!meta.repository) {
    out.push({ code: "NO_REPO", score: 5, detail: "no repository link — can't easily audit the source" });
  }
  if (!meta.license) {
    out.push({ code: "NO_LICENSE", score: 5, detail: "no license declared" });
  }
  return out;
}

function bandFor(score) {
  if (score >= 70) return "CRITICAL";
  if (score >= 45) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

module.exports = {
  pickVersion,
  checkInstallScripts,
  checkMaintainers,
  checkFreshness,
  checkDeprecated,
  checkDownloads,
  checkTyposquat,
  checkDeps,
  checkRepoLicense,
  levenshtein,
  bandFor,
};
