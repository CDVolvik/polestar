-- Russian (ruRU): the guide forever/class/priest/benediction (forever/class/priest/benediction.guide).
-- Written by `node tools/polestar.js i18n guides sync ruRU`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Russian (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	-- {item:18608} Benediction
	["{item:18608} and Anathema"] = "{item:18608} и Анафема",
	-- {item:18608} Benediction
	["Eris's splinter and the two Eyes make {item:18608}, the epic priest staff that turns into Anathema."] = "Осколок Эрис и два Ока дают {item:18608}, эпический посох жреца, который превращается в Анафему.",

	-- Step 1: The Eye of Shadow
	-- {item:18646} The Eye of Divinity · {object:179703} Cache of the Firelord · {npc:12018} Majordomo Executus · {area:2717} Molten Core · {item:18665} The Eye of Shadow · {npc:12397} Lord Kazzak
	-- plural, as words: Doomguard Commanders = {npc:12396} Doomguard Commander
	["You need {item:18646} first: it comes from the {object:179703} after {npc:12018} in {area:2717}. {item:18665} drops from elite demons ({npc:12397}, a world boss, always; Doomguard Commanders and Manahounds rarely); it binds when equipped, so buying one works too."] = "Сначала нужен предмет {item:18646}: он лежит в объекте {object:179703} после победы над NPC {npc:12018} ({area:2717}). {item:18665} падает с элитных демонов ({npc:12397}, мировой босс — всегда; стражники ужаса-командиры и гончие маны — редко); он становится персональным при надевании, так что его можно и купить.",

	-- Step 2: Eris Havenfire
	-- {item:18646} The Eye of Divinity · {npc:14494} Eris Havenfire · {zone:1423} Eastern Plaguelands · {item:8956} Oil of Immolation
	-- plural, as words: Major Mana Potions = {item:13444} Major Mana Potion
	["Equip {item:18646} to see {npc:14494}, a ghost on the mountainside in the north-west of the {zone:1423}. Come with full mana, Major Mana Potions and {item:8956}: if you fail, the event takes about two hours to return."] = "Наденьте {item:18646}, чтобы увидеть NPC {npc:14494} — призрака на склоне горы на северо-западе зоны {zone:1423}. Приходите с полной маной, запасом хороших зелий маны и предметом {item:8956}: при провале событие возвращается примерно через два часа.",

	-- Step 3: The Balance of Light and Shadow
	-- {spell:139} Renew
	["Save 50 peasants before 15 die. Kill the skeletons that attack them, cure their diseases (the purple ones first) and heal the wounded with {spell:139}. Friends may buff you beforehand but must stay out of the fight, or a demon appears and kills everyone."] = "",

	-- Step 4: Benediction
	-- {item:18608} Benediction
	["With both Eyes in your bags: {item:18608}"] = "С обоими Оками в сумках: {item:18608}",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["Save 50 peasants before 15 die. Kill the skeletons that attack them, cure their diseases (the purple ones first) and heal the wounded with Renew. Friends may buff you beforehand but must stay out of the fight, or a demon appears and kills everyone."] = "Спасите 50 крестьян, пока не погибли 15. Убивайте нападающих на них скелетов, лечите их болезни (сначала фиолетовые) и исцеляйте раненых Обновлением. Друзья могут наложить на вас бафы заранее, но должны держаться вне боя, иначе появится демон и убьет всех.",
}
