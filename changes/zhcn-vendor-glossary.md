# zhCN: use the glossary's word for vendor in "best vendor value"

`i18n check` warned about the zhCN line for `best vendor value`: it read
`售价最高`, which holds none of the glossary's `vendor` matches (`商人`, `出售`,
`卖`). It now reads `商人收购价最高` — the glossary's word is there, and the line
still says what it means: the highest price a vendor pays for the item.

The remaining `i18n check` glossary warnings are left alone on purpose:

- The three on `Usage: /polestar near …` (zhCN and zhTW) sit on command
  arguments (`vendor`, `trainer`, `innkeeper`), which have to stay English or
  the command stops working.
- `Shade the area each group of mobs…` (zhCN): `每组` is right there — it is a
  group of mobs, not a party — so the glossary's `小队` would be wrong.
- `/way [zone] x y [title]…` (zhCN): `[zone]` is the syntax of the command, not
  a word to translate.
