-- German (deDE): the guide forever/reputation/ironforge (forever/reputation/ironforge.guide).
-- Written by `node tools/polestar.js i18n guides sync deDE`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in German (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Guide
	-- {faction:47} Ironforge
	["{faction:47} Reputation"] = "",

	-- Step 1: Mistina Steelshield: A Donation of Wool
	-- {npc:14723} Mistina Steelshield · {faction:47} Ironforge · {item:14047} Runecloth · {quest:7806} Additional Runecloth
	["{npc:14723} takes cloth for {faction:47} in {faction:47}. The first donations of Wool, Silk, Mageweave and {item:14047} (60 cloth each) are done once and give the most reputation per cloth; after them, {quest:7806} repeats until Exalted. Exalted with another race's city lets you buy that race's mounts. Forever's Legacy Diplomat perk increases reputation gains."] = "",

	-- Step 2: Wool Cloth
	-- plural, as words: Riverpaw Bandits = {npc:452} Riverpaw Bandit
	["Riverpaw Bandits and Taskmasters (level 16-18) drop it here. The Auction House works too."] = "",

	-- Step 4: Silk Cloth
	["Syndicate Mercenaries at Stromgarde (level 31-32) drop it here. The Auction House works too."] = "",

	-- Step 6: Mageweave Cloth
	["Dunemaul ogres (level 45-48) drop it here. The Auction House works too."] = "",

	-- Step 8: Runecloth
	-- {object:92525} Argent Dawn
	-- plural, as words: Dark Adepts = {npc:8546} Dark Adept
	["Dark Adepts and Shadowmages (level 58-60) drop it here; every Scourge kill here also counts toward the {object:92525} (see that guide). The Auction House works too."] = "",

	-- Step 9: Mistina Steelshield: Runecloth delivered
	-- {npc:14723} Mistina Steelshield · {item:14047} Runecloth
	["{npc:14723}: {item:14047} delivered"] = "",

	-- Step 10: Additional Runecloth to Honored
	-- {quest:7806} Additional Runecloth
	["{quest:7806} to Honored"] = "",
	-- {quest:7806} Additional Runecloth · {item:14047} Runecloth · {zone:1423} Eastern Plaguelands
	-- plural, as words: Dark Adepts = {npc:8546} Dark Adept
	["{quest:7806} takes 20 {item:14047} per turn-in and repeats as often as you like. Bring {item:14047} in multiples of 20 and hand them all in at once, one turn-in after another. {item:14047}: Dark Adepts and Shadowmages (level 58-60) in {zone:1423}, or the Auction House."] = "",

	-- Step 11: Additional Runecloth to Revered
	-- {quest:7806} Additional Runecloth
	["{quest:7806} to Revered"] = "",
	-- {quest:7806} Additional Runecloth · {item:14047} Runecloth · {zone:1423} Eastern Plaguelands
	-- plural, as words: Dark Adepts = {npc:8546} Dark Adept
	["Keep handing in {quest:7806}, 20 {item:14047} at a time. {item:14047}: Dark Adepts and Shadowmages (level 58-60) in {zone:1423}, or the Auction House."] = "",

	-- Step 12: Additional Runecloth to Exalted
	-- {quest:7806} Additional Runecloth
	["{quest:7806} to Exalted"] = "",
	-- {quest:7806} Additional Runecloth · {faction:47} Ironforge · {item:14047} Runecloth · {zone:1423} Eastern Plaguelands
	-- plural, as words: Dark Adepts = {npc:8546} Dark Adept
	["Keep handing in {quest:7806} until {faction:47} is Exalted. {item:14047}: Dark Adepts and Shadowmages (level 58-60) in {zone:1423}, or the Auction House."] = "",
}
