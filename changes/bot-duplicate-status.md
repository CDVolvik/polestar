---
section: contributors
---
- Closing a Discord report as a duplicate now tells the reporter where the
  earlier issue stands (fixed, released, not planned, or still open, with any
  fix in progress) and quotes the maintainer's explanation, also when it was
  closed as not planned with a "Duplicate of #M" comment. When a release ships
  the earlier issue's fix, the duplicate's thread hears it too, once. The
  triage skill closes duplicates with gh issue close --duplicate-of and labels
  not-planned closes with their resolution.
