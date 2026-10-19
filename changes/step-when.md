---
section: authors
---
- A step can depend on the character's state when the route reaches it: `when
  level<6`, `when onquest 788`, `when !has 159 x5`, `when zone "Durotar"` and
  more (GUIDE_FORMAT.md, "Conditions checked during play"). Once the route has
  passed the step the outcome stays; a step passed because its condition
  failed counts as skipped, so the player can unskip it. A `when onquest`
  step can hand in a quest picked up elsewhere. A pack using `when` is written
  in pack format 4, which needs Polestar 0.2.6 (thanks jfuglas, #376; the
  login and hand-in guards after petllama's #47).
