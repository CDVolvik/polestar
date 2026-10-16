-- Chinese (simplified) (zhCN): the guide forever/collectibles/mounts/horde/black-war-mounts (forever/collectibles/mounts/horde/black-war-mounts.guide).
-- Written by `node tools/polestar.js i18n guides sync zhCN`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Chinese (simplified) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	["Black War Mounts"] = "黑色战斗坐骑",

	-- Step 1: PvP rank 11
	["PvP rank 11"] = "PvP 军衔11",
	-- {spell:1299382} Rank Points · {spell:436438} Lieutenant General
	["Forever's PvP ranks come from {spell:1299382} earned in battlegrounds and world PvP, with a weekly cap; {spell:436438} (rank 11) unlocks the Black War mounts. Polestar cannot read your rank, so this step waits for level 40 and the riding skill."] = "",

	-- Step 2: Raider Bork
	-- {npc:12796} Raider Bork · {area:2917} Hall of Legends · {zone:1454} Orgrimmar · {object:172958} Valley of Honor · {npc:12799} Sergeant Ba'sha
	["{npc:12796} sells the mounts in the {area:2917} in {zone:1454}'s {object:172958}, beside the other honor quartermasters such as {npc:12799}. The Forever client lists each at 100g; choose one."] = "{npc:12796}在{zone:1454}{object:172958}的{area:2917}出售坐骑，旁边是{npc:12799}等其他荣誉军需官。Forever 客户端中每个售价100金；选择一个。",
	["100g"] = "100金",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["Forever's PvP ranks come from Rank Points earned in battlegrounds and world PvP, with a weekly cap; Lieutenant General (rank 11) unlocks the Black War mounts. Polestar cannot read your rank, so this step waits for level 40 and the riding skill."] = "Forever 的 PvP 军衔来自在战场和野外 PvP 中获得的军衔点数，每周有上限；中将（军衔11）解锁黑色战斗坐骑。Polestar 无法读取你的军衔，因此此步骤等待40级和骑术技能。",
}
