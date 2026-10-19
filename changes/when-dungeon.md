---
section: authors
---
- A step can be for characters who run a dungeon: `when dungeon "Ragefire
  Chasm"` applies only when the player turned that dungeon on in Options
  (Discovery, Dungeons), and `when !dungeon "Ragefire Chasm"` is the route for
  everyone else. Write the dungeon as the game names it; the compiler finds
  the instance in the client's tables and warns about a name that is no
  dungeon. A pack that uses it is written in pack format 5 (Polestar 0.3.0).
