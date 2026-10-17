# Task 14 report: the walk starts on the surface the player stands on (#234)

## What was built

- **Router** (`addon/Polestar_Nav/Routing`):
  - `Path.SurfacesAt(map, x, y, out, decoded) -> n | nil`. It writes the walkable surfaces of the cell under (x, y) into the caller's `out`: the base surface first, then the floors, skipping value-0 floors. `out[i]` is the height. `out[-i]` holds the marks: `Path.SURFACE_WATER` (1) for water, plus `Path.SURFACE_INDOOR` (2) for class INDOOR or CITY, read from the class byte `% 8`, so a hub's city counts as indoor. It returns 0 outside the data or for a cell with no surface. It allocates nothing; entries past n are left as they were. With `decoded` true it never decodes and returns nil while the cluster is not decoded (used in combat).
  - `PathGrid.readGrid`: decodes a cluster the same way a search's endpoint does. It keeps at most two clusters of its own: decoding a third evicts the older one, unless a search used it since (its use stamp moved). It guards against `Reset`.
  - `Idle` keeps those two clusters. Without that, every search would end with a fresh 18–40 ms decode of the player's cluster within 0.25 s.
  - Documented in the API list and in the `connectPoint` comment.
- **Compat**: `Compat.IsIndoors() -> bool | nil` (Main's ruling). It returns nil without `IsIndoors`, on an error, or when the value is secret; the client's nil means outdoors. It is listed in the Compat section of `docs/ARCHITECTURE.md`.
- **Walk.lua** floor tracker (header "The player's floor", `docs/ARCHITECTURE.md` "The player's floor"):
  - `track` runs from `Walk.Aim` before its early returns, so it also runs for hand-made walks.
  - `ask()` starts from `playerZ` (the client's height), else from the tracked floor when it is fresh. A search that used the tracked height and finds nothing (or raises) is asked once more with neither height. A client height is never dropped.
  - `Walk.Measure` gives the player's place the same height.
- **Changelog**: `changes/walk-starts-on-your-floor.md` (players; thanks MrPersonage, #234).

## The tracker's rules as built

| Rule | Number | Why |
|---|---|---|
| Check rate | at most every `EVERY` = 0.25 s | per brief |
| Read only after moving | `MOVE` = 1 yd | standing still, a check only refreshes the time, so a still player's floor stays fresh |
| Seed (floor unknown) | the cell's surfaces span ≤ `ZTOL` = 10 → the lowest | the router stands on surfaces within 10 yd alike, so which one hardly matters; the lowest is the conservative choice against the #234 class (a surface above the player) |
| Seed by indoor state (Main's ruling) | `Compat.IsIndoors()` answers and the cell has both indoor and outdoor surfaces → the surfaces matching it, when they span ≤ 10 (the lowest) | otherwise unknown. Matching surfaces within ZTOL count as one, as in the plain seed; the Undercity's lower floor (-62) has -43/-41 floors near it. Only an unknown floor is seeded this way, never a followed one |
| Follow | the surface nearest the floor with z ≤ floor + `RISE` = 4 | a ramp or stairs at mount speed (about 3.5 yd a check) plus a jump. Any drop is allowed (a fall). If none qualifies, the floor is unknown |
| Reset | another continent; more than `JUMP` = 30 yd between checks; a ghost state change | per brief |
| Reset | on a taxi or a transport (`Transit.Riding`) | per brief |
| Reset | within `LIFT` = 8 yd of a lift (`Transit.LiftNear`) | added. A lift changes level without x/y movement, and Forever's z 0 means Transit never detects a lift ride. While held there, nothing is seeded |
| Reset | moving after more than `FRESH` = 2 s without a check | added. With no Aim calls (no target, arrived, an instance), a player could climb or drop out of sight, and following from a stale floor would mislead |
| Combat | only decoded clusters are read (`decoded` = true); not decoded → unknown | a decode is a frame hitch, not a table read |
| Use | client z, else the floor when known, checked ≤ 2 s ago, and read ≤ `NEAR` = 5 yd from the player | per brief |

`ZTOL` is mirrored in Walk.lua (10), with a comment that names PathGrid's.

## RED / GREEN

- **nav-spf**, six new `#234 floor` tests: with HEAD's Walk.lua all 6 fail, with the new one all 6 pass. The tests cover:
  - seeding, and staying on the ground under a rock top; an ambiguous first cell stays unknown;
  - at most one read per 0.25 s, and none while standing still;
  - climbing a ramp onto a bridge, falling off its side, and staying on the ground under it;
  - resets after a 30+ yd jump, another continent, or a stale floor;
  - the retry without the tracked height, with no third search;
  - the measure's player place carrying the floor;
  - the lift reset, then the indoor seed onto the city under outdoor ground, a followed floor kept at an outdoor doorway, unknown when `IsIndoors` is unread, and unknown with two indoor levels apart.
- **nav-router**, the `Path.SurfacesAt` test (synthetic 3-cluster map: heights, water and indoor and city marks, 0 off the data, decoded-only nil, reuse of `out`, two clusters kept, Idle keeping them):
  - RED with HEAD's Routing: `attempt to call field 'SurfacesAt' (a nil value)`.
  - GREEN with the new Routing.
- **compat**, the `IsIndoors` test: RED returned nil for outdoors; fixed so the client's nil means outdoors. GREEN.
- **nav-e2e**, three new tests: RED with HEAD's Walk.lua (all 3 fail: the walked-in search goes with `from.z` false), GREEN with the new one.
- **Whole files**, one at a time: nav-spf 68/68, nav-router 27/27, compat 16/16, syntax 3/3, wording 3/3, nav-journey 27/27, ui-journey 21/21, nav-maps 18/18, changelog 12/12, nav-pins 14/14, nav-route-lines 23/23, nav-handoff 22/22, lint 2/2, docs-cheatsheet 4/4, nav-transit 25/25 (after the fix below).
- **nav-e2e**, the whole file: 20/21 at first. The one failure was the existing Ratchet Z1 test, which asserted `from.z` undefined; the walking floor now reads the ground there (z 12, one surface). I updated it to assert "never 0: the ground's height (12 ± 3) or none", and its "no point east towards the harbour" check still holds. With that change the Ratchet test passes 1/1. I did not rerun the whole file afterwards.
- **nav-transit C5** ("UnitPosition is read in one place") failed on the word in the Walk.lua header comment. I reworded it ("Forever's client gives no player height"); 25/25.

## e2e result

#234: the real router and the shipped maps, Horde, level 3. The player stands at the Den's camp (-574.6, -4230.8), UnitPosition z 0, with Hana'zua as the target (z 50.3).

| Style | No walking history | Walked in from 42 yd out on the valley floor (z 38) |
|---|---|---|
| fastest | searched without a height, **248 yd over the rock top** (highest drawn point within 60 yd of the start: z 74); the same as today's bug | `from.z` 40, **322 yd round by the valley floor** (highest z 40) |
| balanced | without a height, 321 yd round (highest z 38) | `from.z` 40, 321 yd round (highest z 40) |

**Undercity** (Main's case), the sweep's `plundering-the-plunderers|17` start (1435.6, 72), real z -62.2, column -62/6/64. The player stands at the south lift (1544.2, 240.8) with `IsIndoors` true, so the floor is unknown (`from.z` false). They walk the router's own way to the start, about 445 yd. On the way the floor seeds from the indoor rule (in the probe, at 1496,94 on -60), then follows. From the start the walk to (-160.1, 774.2) is searched with `from.z` -62, and its first 60 yd stay at z -62 (3612 yd). A probe from all three lifts seeds 376–410 yd along and ends at -62.

## Per-update cost

- **A check** (every 0.25 s): a few comparisons, plus `Transit.LiftNear` (a loop over the lift services, no allocation), `Transit.Riding` (an early nil off a ride; one small table while a ride is announced), `Compat.IsOnTaxi` and `IsGhost`.
- **A read** (after moving 1 yd): when the cluster is decoded, `SurfacesAt` is table lookups. 100,000 warm reads take about 0.06 µs each in LuaJIT and 0.7 µs in Lua 5.1, with 0 KB allocated in Lua 5.1 (19 KB in LuaJIT, JIT noise). `IsIndoors` is called only when seeding an ambiguous cell.
- **Cluster decodes:** 0 per update, except when the player enters a cluster that is not decoded.
  - That costs 1 decode: about 18 ms (LuaJIT) or 39 ms (Lua 5.1) standalone, allocating 3.1–4.4 MB (the engine counts about 3.3 MB a cluster).
  - The reader keeps the two clusters it read last, through `Idle` too. So a player walking with no search running holds two clusters, and a search's `Idle` no longer forces a re-decode.
  - The Den probe (441 reads across 2 clusters) decoded 4 times with two slots, against 43 with one slot.
- **Memory:** the tracker's own state is one reused table (`surf`) plus scalars.

## Concerns

1. **Resting memory:** about 3–7 MB more at rest (two decoded clusters, which `Idle` used to drop). The alternative was a 20–40 ms hitch after every search.
2. **A decode is a frame hitch** (18–40 ms) whenever the player walks into a cluster that is not decoded. A loading screen usually hides it at login or after a teleport; while walking it happens about every 533 yd. In combat nothing is decoded: the floor becomes unknown instead.
3. **Lifts:** Forever's z 0 means no lift ride is detected, so the floor is reset within 8 yd of any lift. A player who stands near a lift without riding loses the floor too, and is reseeded as soon as the cell allows.
4. **Where the floor stays unknown, the search is today's:**
   - a player who arrives in the Undercity by hearth or login sees indoor surfaces at several heights almost everywhere (the probe map), so the floor stays unknown until they walk through a cell with one indoor group;
   - the Den's own start cell carries no indoor class (40/71/73, all outdoor), so the indoor rule does not help at the Den itself. The camp is open ground, so walking in seeds it.
5. **Added rules:** the stale-floor reset (moving after 2 s without a check) and the lift reset go beyond the brief's list. Both are conservative: they only fall back to today's search.
6. **Process:** some test-file edits were made with `sed` or node string replaces, not the edit tool; the results were checked by the test runs. Throwaway probes live in /tmp/t14 (outside the repo).

## Commits

- `Nav: the arrow's walk starts from the floor Walk follows under the player (Path.SurfacesAt; seeded where the cell is one surface or by Compat.IsIndoors, reset at lifts, rides, jumps), not a roof or rock top over them (#234)`

## Fix round 1 (T14Review: Needs fixes)

All edits in this round were made with the edit tool.

**Important 1: no synchronous decode.**
- `Path.SurfacesAt(map, x, y, out)` no longer decodes, and the `decoded` parameter is gone. On an undecoded cluster it returns nil and queues `Path.Prefetch(map, x, y)`.
- `Path.Prefetch` is a PathJobs job, one at a time: asking for the same cluster again returns that job; asking for another cancels it. Its coroutine runs PathGrid's `prefetch`, which calls `grid()`, so the decode slices under the job's deadline like a search's, and waits out combat like a search.
- `track` wraps the read in pcall:
  - nil (pending): it keeps `floorZ` and refreshes `fAt`/`fC`/`fGhost` but not `fX`/`fY`, so the 30 yd jump and the 5 yd near check still count from the last read point;
  - once the cluster is in, the follow rule resumes from the kept floor;
  - an error is unknown (Minor 4).
- Side effect: the very first search after arriving in a cluster nobody has decoded goes without a height, because the floor is not seeded until the decode lands, a few frames later. Later asks (strays, new goals) carry it. The Ratchet Z1 e2e test now sets a first target and waits 1 s before guiding.

**Important 2: at most the player's own cluster at rest.**
- The reader keeps one cluster: the one it read last, including one a search decoded.
- Moving to another cluster evicts the old one, unless a search has used it since; `Idle` drops it later in that case. This also settles Minor 3: with one slot there is no order to keep.
- `Idle` keeps the reader's cluster.
- `Path.ReleaseSurfaces()` drops it. Walk calls it from `Walk.Clear` and from `Walk:Refresh` when no `Walk.Aim` has run for more than `FRESH` (2 s).
- `Reset` clears the reader.
- **At rest, measured** (Lua 5.1 standalone, Kalimdor's maps only, the Den's camp):

  | State | Heap |
  |---|---|
  | maps loaded | 18.0 MB |
  | floor cluster held | 20.5 MB (+2.5 MB) |
  | after a search and `Idle` | 20.7 MB |
  | after `ReleaseSurfaces` | 18.3 MB |

  The engine's accounting averages 3.3 MB a cluster. So: one cluster while the arrow runs, none without a target or 2 s after its last update. ARCHITECTURE's Memory paragraph says so.

**Minors.**
1. ARCHITECTURE's drop sentence was reworded and rewrapped.
2. The retry no longer drops both heights together:
   - a tracked start that finds nothing (or raises) is retried flat, keeping `gz`;
   - a goal's height that finds nothing or ends off its floor is dropped for good (Z2), keeping the start as it was.
   This means at most three searches when both heights are present.
3. Covered by Important 2 (one slot).
4. `pcall` around `P.SurfacesAt`: an error is unknown.
5. The Ratchet Z1 test is pinned to |z - 12| <= 3 and passes.
6. The section comment now names "The player's floor". The header now describes the decode and release rules, and the retry rule.

**RED/GREEN.**
- nav-spf, 3 new tests (decode pending keeps and loses the floor, and an error is unknown; the retry splits start and goal; release on a cleared target and after 2 s without Aim): RED 3/3 with ad6e9fda's Walk.lua, GREEN.
- nav-router, the rewritten `SurfacesAt` test: RED with ad6e9fda's Routing (`attempt to call field 'Prefetch'`), GREEN. It shows:
  - the read decodes nothing and queues one job;
  - the job takes more than one frame at a 0 ms budget on a moving clock;
  - one cluster is kept, through `Idle`, until `ReleaseSurfaces`.

**Runs, one at a time:**
- nav-spf 71/71
- nav-router 27/27
- nav-journey 27/27
- nav-e2e, the whole file, 21/21; run after messaging T15Wharf, with its re-pack held until I said done.

**Commit:** see the reply. The ARCHITECTURE hunk at its "casc" section (around line 4563) is another session's and is not committed. Neither are the other sessions' files (pack.js, metrics.js, routes.json, nav-eval, navmesh-pack, a changes fragment).
