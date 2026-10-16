-- Portuguese (Brazil) (ptBR): the guide forever/collectibles/mounts/horde/black-war-mounts (forever/collectibles/mounts/horde/black-war-mounts.guide).
-- Written by `node tools/polestar.js i18n guides sync ptBR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Portuguese (Brazil) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	["Black War Mounts"] = "Montarias de Guerra Negras",

	-- Step 1: PvP rank 11
	["PvP rank 11"] = "Patente JxJ 11",
	-- {spell:1299382} Rank Points · {spell:436438} Lieutenant General
	["Forever's PvP ranks come from {spell:1299382} earned in battlegrounds and world PvP, with a weekly cap; {spell:436438} (rank 11) unlocks the Black War mounts. Polestar cannot read your rank, so this step waits for level 40 and the riding skill."] = "",

	-- Step 2: Raider Bork
	-- {npc:12796} Raider Bork · {area:2917} Hall of Legends · {zone:1454} Orgrimmar · {object:172958} Valley of Honor · {npc:12799} Sergeant Ba'sha
	["{npc:12796} sells the mounts in the {area:2917} in {zone:1454}'s {object:172958}, beside the other honor quartermasters such as {npc:12799}. The Forever client lists each at 100g; choose one."] = "{npc:12796} vende as montarias no {area:2917}, no {object:172958} de {zone:1454}, ao lado dos outros intendentes de honra como {npc:12799}. O cliente do Forever lista cada uma a 100g; escolha uma.",
	["100g"] = "100g",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["Forever's PvP ranks come from Rank Points earned in battlegrounds and world PvP, with a weekly cap; Lieutenant General (rank 11) unlocks the Black War mounts. Polestar cannot read your rank, so this step waits for level 40 and the riding skill."] = "As patentes JxJ do Forever vêm de Pontos de Ranque ganhos em campos de batalha e no JxJ mundial, com limite semanal; Tenente-general (patente 11) libera as montarias de Guerra Negras. O Polestar não consegue ler sua patente, então esta etapa espera o nível 40 e a perícia de montaria.",
}
