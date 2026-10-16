-- Portuguese (Brazil) (ptBR): the guide forever/class/warlock/shard-of-the-green-flame (forever/class/warlock/shard-of-the-green-flame.guide).
-- Written by `node tools/polestar.js i18n guides sync ptBR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Portuguese (Brazil) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	-- {npc:14470} Impsy · {zone:1448} Felwood
	["A rare off-hand for your 50s from Niby and {npc:14470} in {zone:1448}, the camp that also offers An Imp's Request."] = "Um item de mão secundária raro para os níveis 50, de Niby e {npc:14470} em {zone:1448}, o acampamento que também oferece Pedido de diabrete.",

	-- Step 1: Niby the Almighty
	-- {npc:14469} Niby the Almighty · {npc:14470} Impsy · {zone:1448} Felwood · {area:1763} Jaedenar
	["At 50 {npc:14469} and his imp {npc:14470} wait in central {zone:1448}, just east of {area:1763}."] = "No nível 50, {npc:14469} e seu diabrete {npc:14470} esperam no centro de {zone:1448}, logo a leste de {area:1763}.",

	-- Step 2: Jaedenar
	-- {area:1763} Jaedenar
	-- plural, as words: Jaedenar Legionnaires = {npc:9862} Jaedenar Legionnaire
	["The Jaedenar Legionnaires, a short way west of Niby, carry {area:1763}'s essence."] = "",

	-- Step 3: Azshara
	-- {zone:1447} Azshara
	["The Legashi satyrs of northern {zone:1447} carry {zone:1447}'s essence."] = "Os sátiros Legashi do norte de {zone:1447} carregam a essência de {zone:1447}.",

	-- Step 4: The Dark Portal
	-- {area:72} The Dark Portal · {zone:1419} Blasted Lands
	["The Felguard Sentries around the {area:72}, in southern {zone:1419}, carry its essence."] = "As Sentinelas Guarda Vil em volta de {area:72}, no sul de {zone:1419}, carregam a essência dele.",

	-- Step 6: Kroshius
	-- {npc:14467} Kroshius · {area:1766} Shatter Scar Vale · {item:18626} Fel Fire
	["{npc:14467}' remains lie in {area:1766}, north of Niby. Use the {item:18626} beside them and kill the infernal when he wakes. {npc:14467} is elite: grouping up is advised."] = "Os restos de {npc:14467} estão em {area:1766}, ao norte de Niby. Use o {item:18626} ao lado deles e mate o infernal quando ele despertar. {npc:14467} é Elite: recomenda-se formar um grupo.",
	-- {item:18626} Fel Fire · {object:179677} Kroshius' Remains
	["{item:18626}, at {object:179677}"] = "{item:18626}, em {object:179677}",

	-- Step 7: Back to Niby
	["Back to Niby"] = "De volta a Niby",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["The {area:1763} Legionnaires, a short way west of Niby, carry {area:1763}'s essence."] = "Os Legionários de {area:1763}, pouco a oeste de Niby, carregam a essência de {area:1763}.",
}
