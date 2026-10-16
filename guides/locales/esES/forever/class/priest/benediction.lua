-- Spanish (Spain) (esES): the guide forever/class/priest/benediction (forever/class/priest/benediction.guide).
-- Written by `node tools/polestar.js i18n guides sync esES`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Spanish (Spain) (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Guide
	-- {item:18608} Benediction
	["{item:18608} and Anathema"] = "",
	-- {item:18608} Benediction
	["Eris's splinter and the two Eyes make {item:18608}, the epic priest staff that turns into Anathema."] = "",

	-- Step 1: The Eye of Shadow
	-- {item:18646} The Eye of Divinity · {object:179703} Cache of the Firelord · {npc:12018} Majordomo Executus · {area:2717} Molten Core · {item:18665} The Eye of Shadow · {npc:12397} Lord Kazzak
	-- plural, as words: Doomguard Commanders = {npc:12396} Doomguard Commander
	["You need {item:18646} first: it comes from the {object:179703} after {npc:12018} in {area:2717}. {item:18665} drops from elite demons ({npc:12397}, a world boss, always; Doomguard Commanders and Manahounds rarely); it binds when equipped, so buying one works too."] = "",

	-- Step 2: Eris Havenfire
	-- {item:18646} The Eye of Divinity · {npc:14494} Eris Havenfire · {zone:1423} Eastern Plaguelands · {item:8956} Oil of Immolation
	-- plural, as words: Major Mana Potions = {item:13444} Major Mana Potion · Mana Potions = {item:3827} Mana Potion
	["Equip {item:18646} to see {npc:14494}, a ghost on the mountainside in the north-west of the {zone:1423}. Come with full mana, Major Mana Potions and {item:8956}: if you fail, the event takes about two hours to return."] = "",

	-- Step 3: The Balance of Light and Shadow
	["Save 50 peasants before 15 die. Kill the skeletons that attack them, cure their diseases (the purple ones first) and heal the wounded with Renew. Friends may buff you beforehand but must stay out of the fight, or a demon appears and kills everyone."] = "",

	-- Step 4: Benediction
	-- {item:18608} Benediction
	["With both Eyes in your bags: {item:18608}"] = "",
}
