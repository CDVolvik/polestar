-- Spanish (Spain) (esES): the guide forever/collectibles/mounts/horde/black-war-mounts (forever/collectibles/mounts/horde/black-war-mounts.guide).
-- Written by `node tools/polestar.js i18n guides sync esES`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Spanish (Spain) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	["Black War Mounts"] = "Monturas de guerra negras",

	-- Step 1: PvP rank 11
	["PvP rank 11"] = "Rango JcJ 11",
	-- {spell:1299382} Rank Points · {spell:436438} Lieutenant General
	["Forever's PvP ranks come from {spell:1299382} earned in battlegrounds and world PvP, with a weekly cap; {spell:436438} (rank 11) unlocks the Black War mounts. Polestar cannot read your rank, so this step waits for level 40 and the riding skill."] = "",

	-- Step 2: Raider Bork
	-- {npc:12796} Raider Bork · {area:2917} Hall of Legends · {zone:1454} Orgrimmar · {object:172958} Valley of Honor · {npc:12799} Sergeant Ba'sha
	["{npc:12796} sells the mounts in the {area:2917} in {zone:1454}'s {object:172958}, beside the other honor quartermasters such as {npc:12799}. The Forever client lists each at 100g; choose one."] = "{npc:12796} vende las monturas en el {area:2917}, en {object:172958} de {zone:1454}, junto a los demás intendentes de honor, como {npc:12799}. El cliente de Forever pone cada una a 100 o; elige una.",
	["100g"] = "100 o",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["Forever's PvP ranks come from Rank Points earned in battlegrounds and world PvP, with a weekly cap; Lieutenant General (rank 11) unlocks the Black War mounts. Polestar cannot read your rank, so this step waits for level 40 and the riding skill."] = "Los rangos JcJ de Forever salen de los puntos de rango ganados en campos de batalla y en JcJ en el mundo, con un límite semanal; teniente general (rango 11) desbloquea las monturas de guerra negras. Polestar no puede leer tu rango, así que este paso espera al nivel 40 y a la habilidad de equitación.",
}
