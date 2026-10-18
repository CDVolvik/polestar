---
section: authors
---
- A step can depend on the character's state when the route reaches it: `when
  level<6`, `when onquest 788`, `when !has 159 x5`, `when zone "Durotar"` and
  more (GUIDE_FORMAT.md, "Conditions checked during play"). Once the route has
  passed the step the outcome stays. A pack using `when` is written in pack
  format 4, which needs Polestar 0.3.0.
