# pkgvet

Vet an npm package *before* you `npm install` it. One command, one risk report. Install scripts, typosquatting, maintainer count, staleness, download volume, dependency sprawl, the lot.

## Why

Most supply-chain attacks don't break in. They get invited in, one `npm install` at a time. `npm audit` only speaks up *after* the package is already in your tree, which is backwards. pkgvet asks the question you should be asking first: should I trust this thing at all?

## Install

```bash
npm install -g @burrejak/pkgvet
```

From source (no dependencies, just node):

```bash
git clone https://github.com/burrejak22/pkgvet
cd pkgvet
```

## Use

```bash
pkgvet lodash                          # latest
pkgvet lodash@4.17.21                  # pinned version
pkgvet @babel/core                     # scoped
pkgvet some-package --json
```

### CI

```bash
pkgvet new-dependency --fail-on HIGH
```

Exit 1 when the band is the given level or worse (`LOW` < `MEDIUM` < `HIGH` < `CRITICAL`).

## Example output

```
evillodash@1.0.0  (12,403 downloads last month)
[HIGH] risk score: 75/100 ███████████████░░░░░

  ▸ +35  INSTALL_SCRIPTS
     runs postinstall on install. arbitrary code execution, the #1 supply-chain vector
  ▸ +30  TYPOSQUAT_RISK
     "evillodash" is 2 edits away from "lodash". classic typosquat shape, double-check you typed it right
  ▸ +10  SINGLE_MAINTAINER
     single maintainer. bus factor of one
```

## What gets checked

- **Install scripts**. `preinstall` / `install` / `postinstall` run arbitrary code the second you type `npm install`. Legit sometimes. Also the #1 malware vector.
- **Typosquatting**. Edit distance against the most-installed packages. `lodahs` is not `lodash`.
- **Maintainers**. Zero or one maintainer is a bus-factor and account-takeover risk.
- **Staleness**. Nothing published in years usually means abandoned code.
- **Deprecation**. The author themselves is telling you not to use it.
- **Downloads**. Obscure packages deserve extra scrutiny.
- **Dependency sprawl**. Every dep is someone else's code in your supply chain.
- **Missing repo / license**. Can't audit what you can't find.
- **Repo mismatch**. The linked repository doesn't reference the package name. Repackaged code signal.
- **License changes**. License changed between versions. Relicensing drama deserves a look.
- **Dist-tag confusion**. `latest` isn't the highest version.

## Scoring

Weights are opinionated triage heuristics, not a certification. Capped at 100.

| Band     | Score  | Meaning                            |
|----------|--------|------------------------------------|
| LOW      | 0 to 19   | install away                       |
| MEDIUM   | 20 to 44  | worth a look                       |
| HIGH     | 45 to 69  | needs justification                |
| CRITICAL | 70 to 100 | do not install until this is explained |

## Limitations

Metadata analysis only. It reads the registry, it doesn't execute the code. A clean score means "nothing in the metadata smells", not "safe to install blindly". Typosquat detection covers the most popular packages; obscure targets can slip through.

## Contributing

Issues and PRs welcome. Keep it dependency-free and keep it fast.
