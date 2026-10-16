---
section: contributors
---
- Polestar's tools no longer fetch from Wowhead, whose terms don't allow
  automated requests: `codex wowhead` is gone, and `data build` no longer
  downloads Wowhead's zone quest lists. Builds still read what an earlier
  version cached under `data/sources/wowhead/`, and work without it.
