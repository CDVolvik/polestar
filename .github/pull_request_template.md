<!-- Base branch: a guide fix for the latest release goes to hotfix/<next patch>; everything else goes to next. Never main. See CONTRIBUTING.md, "Branches". -->

## Issues

<!-- One line per issue this fixes: "closes #N" into next, "fixes #N" into a hotfix branch. That lists this pull request on the issue. "See #N" is only a link. -->

- [ ] I checked for open pull requests on the same issue (`gh pr list --state open --search "<N>"`, the issue's `has-pr` label) and found none, or say here how this one differs:

## What and why

<!-- What changes for the player or author, and why. -->

## The report, checked

<!-- For a bug fix: the verdict (confirmed / partly right) and the evidence: guide file and step, quest id, data, Wowhead Forever, a recording. A report is a lead, not a verdict. -->

## Checks

- [ ] `npm test`
- [ ] `node tools/polestar.js lint` and `playtest --filter <guide>` (guide changes)
- [ ] Not run, and why:
- [ ] A changelog fragment in `changes/` (`node tools/polestar.js changelog add`), crediting the reporter
- [ ] An AI agent wrote or helped with this
