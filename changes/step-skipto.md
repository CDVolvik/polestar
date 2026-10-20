---
section: authors
---
- A step can skip ahead: `skipto <label> when <predicate>` skips that step and
  the ones up to the labelled step when the predicate holds as the route
  reaches it, kept for the character so the jump doesn't undo itself (the
  player can unskip them). `when done <label>` makes a step depend on another
  step being completed, not skipped or jumped over. A pack using either is
  written in pack format 5, which needs Polestar 0.3.0 (GUIDE_FORMAT.md,
  "Jumps"; thanks petllama, #455, after #43).
