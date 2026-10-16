-- Portuguese (Brazil) (ptBR): the guide forever/class/priest/benediction (forever/class/priest/benediction.guide).
-- Written by `node tools/polestar.js i18n guides sync ptBR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Portuguese (Brazil) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	-- {item:18608} Benediction
	["{item:18608} and Anathema"] = "{item:18608} e Anátema",
	-- {item:18608} Benediction
	["Eris's splinter and the two Eyes make {item:18608}, the epic priest staff that turns into Anathema."] = "A lasca de Eris e os dois Olhos formam {item:18608}, o cajado épico de sacerdote que se transforma em Anátema.",

	-- Step 1: The Eye of Shadow
	-- {item:18646} The Eye of Divinity · {object:179703} Cache of the Firelord · {npc:12018} Majordomo Executus · {area:2717} Molten Core · {item:18665} The Eye of Shadow · {npc:12397} Lord Kazzak
	-- plural, as words: Doomguard Commanders = {npc:12396} Doomguard Commander
	["You need {item:18646} first: it comes from the {object:179703} after {npc:12018} in {area:2717}. {item:18665} drops from elite demons ({npc:12397}, a world boss, always; Doomguard Commanders and Manahounds rarely); it binds when equipped, so buying one works too."] = "Primeiro você precisa de {item:18646}: vem do {object:179703} depois de {npc:12018} em {area:2717}. {item:18665} cai de demônios de elite ({npc:12397}, chefe mundial, sempre; Comandantes Demonarcas e Cães de Mana, raramente); vincula ao equipar, então comprar um também serve.",

	-- Step 2: Eris Havenfire
	-- {item:18646} The Eye of Divinity · {npc:14494} Eris Havenfire · {zone:1423} Eastern Plaguelands · {item:8956} Oil of Immolation
	-- plural, as words: Major Mana Potions = {item:13444} Major Mana Potion
	["Equip {item:18646} to see {npc:14494}, a ghost on the mountainside in the north-west of the {zone:1423}. Come with full mana, Major Mana Potions and {item:8956}: if you fail, the event takes about two hours to return."] = "Equipe {item:18646} para ver {npc:14494}, um fantasma na encosta no noroeste de {zone:1423}. Venha com mana cheia, Poções Elevadas de Mana e {item:8956}: se falhar, o evento leva umas duas horas para voltar.",

	-- Step 3: The Balance of Light and Shadow
	-- {spell:139} Renew
	["Save 50 peasants before 15 die. Kill the skeletons that attack them, cure their diseases (the purple ones first) and heal the wounded with {spell:139}. Friends may buff you beforehand but must stay out of the fight, or a demon appears and kills everyone."] = "",

	-- Step 4: Benediction
	-- {item:18608} Benediction
	["With both Eyes in your bags: {item:18608}"] = "Com os dois Olhos nas bolsas: {item:18608}",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["Save 50 peasants before 15 die. Kill the skeletons that attack them, cure their diseases (the purple ones first) and heal the wounded with Renew. Friends may buff you beforehand but must stay out of the fight, or a demon appears and kills everyone."] = "Salve 50 camponeses antes que 15 morram. Mate os esqueletos que os atacam, cure as doenças deles (os roxos primeiro) e cure os feridos com Renovar. Amigos podem dar bônus antes, mas devem ficar fora da luta, ou um demônio aparece e mata todos.",
}
