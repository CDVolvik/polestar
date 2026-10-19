---
section: authors
---
- A step can be for characters who run a dungeon: `when dungeon "Ragefire
  Chasm"` applies only when the player turned that dungeon on in Options
  (Discovery, Dungeons), and `when !dungeon "Ragefire Chasm"` is the route for
  everyone else. Write the dungeon as the game names it; the compiler finds
  the instance in the client's tables and warns about a name that is no
  dungeon. Polestar 0.2.6 refuses a guide that uses it.
