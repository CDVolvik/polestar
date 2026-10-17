---
section: contributors
---
- Simulator: `sim run/robust/compare/consensus --objective smooth` searches
  for smoother routes (fewer zone switches, returns into zones left earlier
  and returns to spots already worked; results in their own `-smooth` files)
  while reported times stay real; kills now count for every active quest on
  the same mob camp, the quest log holds 40 as in Forever's client across
  the whole route (a full log waits for a turn-in or gives up a quest 6+
  levels below the character), and results report zone changes, zone and
  spot returns, shared kills, the quest log peak and the quests accepted but
  never turned in.
