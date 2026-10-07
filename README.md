# pkgvet

Vet an npm package *before* you `npm install` it. One command, one risk
report: install scripts, typosquatting, maintainer count, staleness,
download volume, and dependency sprawl.

## Why

Most supply-chain attacks don't break in — they're invited in, one `npm
install` at a time. `npm audit` only helps *after* the package is already in
your tree. pkgvet answers the question you should be asking first: "should I
trust this package at all?" Companies use it in CI to gate new dependencies
and in PR reviews to sanity-check what's being added.

## Install

```bash
npm install -g pkgvet
```

Or run from source (no dependencies, just node):

```bash
git clone https://github.com/burrejak22/pkgvet
cd pkgvet
```

## Usage

```bash
# vet the latest version
pkgvet lodash

# vet a specific version
pkgvet lodash@4.17.21

# scoped packages work too
pkgvet @babel/core

# machine-readable output
pkgvet some-package --json
```

### CI usage

Block risky dependencies in CI:

```bash
pkgvet new-dependency --fail-on HIGH
```

Exit code is 1 when the band is the given level or worse
(`LOW` < `MEDIUM` < `HIGH` < `CRITICAL`).

## Example output

```
evillodash@1.0.0  (12,403 downloads last month)
[HIGH] risk score: 75/100 ███████████████░░░░░

  ▸ +35  INSTALL_SCRIPTS
     runs postinstall on install — arbitrary code execution, the #1 supply-chain vector
  ▸ +30  TYPOSQUAT_RISK
     "evillodash" is 2 edit(s) away from "lodash" — classic typosquat shape, double-check you typed it right
  ▸ +10  SINGLE_MAINTAINER
     single maintainer — bus factor of one
```

## What gets checked

- **Install scripts** — `preinstall` / `install` / `postinstall` run arbitrary
  code on install. Legit sometimes, but it's the #1 malware vector.
- **Typosquatting** — edit distance against the most-installed packages.
  `lodahs` is not `lodash`.
- **Maintainers** — zero or one maintainer is a bus-factor and
  account-takeover risk.
- **Staleness** — nothing published in years means unmaintained code.
- **Deprecation** — the author themselves says don't use it.
- **Downloads** — obscure packages deserve extra scrutiny.
- **Dependency sprawl** — every dependency is someone else's code in your
  supply chain.
- **Missing repo / license** — can't audit what you can't find.
- **Repo mismatch** — the linked repository doesn't reference the package
  name (repackaged code signal).
- **License changes** — the license changed between versions (relicensing
  drama deserves a look).
- **Dist-tag confusion** — the `latest` tag isn't the highest version.

## Scoring

Weights are opinionated triage heuristics, not a certification. Capped at 100.

| Band     | Score  | Meaning                            |
|----------|--------|------------------------------------|
| LOW      | 0–19   | install away                       |
| MEDIUM   | 20–44  | worth a look                       |
| HIGH     | 45–69  | needs justification                |
| CRITICAL | 70–100 | do not install until this is explained |

## Limitations

- Metadata analysis only. It reads the registry, it doesn't audit the code.
  A clean score is not a clean bill of health — it just means nothing in the
  metadata smells.
- Typosquat detection covers the most popular packages; obscure targets can
  slip through.

## Contributing

Issues and PRs welcome. Keep it dependency-free and keep it fast.
