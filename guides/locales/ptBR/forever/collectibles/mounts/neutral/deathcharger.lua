-- Portuguese (Brazil) (ptBR): the guide forever/collectibles/mounts/neutral/deathcharger (forever/collectibles/mounts/neutral/deathcharger.guide).
-- Written by `node tools/polestar.js i18n guides sync ptBR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Portuguese (Brazil) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	["Deathcharger"] = "Corcel da Morte",

	-- Step 1: Journeyman Riding
	-- {skill:762} Riding
	["Journeyman {skill:762}"] = "{skill:762} de Oficial",
	-- {item:13335} Deathcharger's Reins · {skill:762} Riding
	["{item:13335} needs level 60 and Journeyman {skill:762} to ride (Forever client). Train it at your race's riding trainer; see the Level 60 mount guides."] = "As {item:13335} exigem nível 60 e {skill:762} de Oficial para montar (cliente Forever). Treine com o instrutor de montaria da sua raça; veja os guias de montaria de nível 60.",

	-- Step 2: Stratholme: Baron Rivendare
	-- {area:2279} Stratholme · {object:175461} Service Entrance · {object:175440} Elders' Square · {zone:1423} Eastern Plaguelands · {npc:10440} Baron Rivendare
	["{area:2279} is a group of five, level 58-60. The {object:175461} at {object:175440}, in north-western {zone:1423}, leads to the undead side; {npc:10440} waits in the Slaughter House at its end. Our data gives the reins a 0.02% drop chance (pfQuest, Era): one in about five thousand kills. Nothing shows Forever changing it."] = "{area:2279} é para grupo de cinco, nível 58-60. A {object:175461} em {object:175440}, no noroeste das {zone:1423}, leva ao lado morto-vivo; {npc:10440} espera no Abatedouro, no fim dele. Nossos dados dão às rédeas 0,02% de chance de queda (pfQuest, Era): uma em cerca de cinco mil mortes. Nada indica que o Forever mudou isso.",
	-- {object:175461} Service Entrance
	["Stratholme {object:175461}"] = "Stratholme: {object:175461}",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["Stratholme Service Entrance"] = "Stratholme Service Entrance",
}
