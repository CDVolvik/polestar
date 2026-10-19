---
section: contributors
---
- Performance checks account for the Lua clock's measured resolution, capped at one millisecond, and use a longer calibration sample so whole-millisecond Windows clocks do not falsely reject sub-millisecond frames.
