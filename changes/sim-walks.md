---
section: contributors
---
- `sim walks` routes the simulator's walks with the walking router the arrow
  uses, into `data/sim/walks-<faction>.json` (about 10 minutes per faction),
  and `sim run`, `robust`, `compare`, `bench` and `consensus` then walk round
  cliffs, mountains and water instead of the straight line × detour, which
  priced Silithus to Feralas at 1,785 yd for a 13,807 yd walk. Guides score
  0.4-1.0 h slower to 60, and the search finds routes 0.9-2.8 h faster on
  real walking (Orc, Human; give it `--paths 3000000`). Without the file, or
  with `--no-walks`, nothing changes.
