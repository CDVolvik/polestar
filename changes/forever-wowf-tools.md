---
section: contributors
---
- `install` now detects the `_forever_` stress-test client (flavor `wowf`) and
  installs into every detected Forever client automatically; use `--client
  <folder-or-flavor>` (e.g. `--client _forever_`, `--client wowf`,
  `--client beta`) to pick one. `dev` handles multiple clients the same way.
