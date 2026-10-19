---
section: authors
---
- A guide can hand over depending on the character: `next <id> when
  <predicate>` offers that guide only while the predicate (any of a step's
  `when` predicates) holds when the guide ends, and `next` lines now add up.
  An option whose condition fails is left out of "Choose your path", the guide
  menu's "Next" line and `/polestar path`; with one option left Polestar goes
  on to it without asking, with none the guide ends there. A pack using it is
  written in pack format 4 (GUIDE_FORMAT.md, "Conditional hand-offs") (thanks
  petllama, #455; after #44).
