-- French (frFR): the guide forever/class/rogue/blade-of-cunning-horde (forever/class/rogue/blade-of-cunning-horde.guide).
-- Written by `node tools/polestar.js i18n guides sync frFR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in French (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Guide
	-- {item:7298} Blade of Cunning
	["{item:7298} (Horde)"] = "{item:7298} (Horde)",
	["A dagger at 10 from your home town's rogue quests."] = "Une dague au niveau 10, grâce aux quêtes de voleur de votre ville natale.",

	-- Step 1: Therzok
	-- {npc:3170} Kaplak · {area:362} Razor Hill · {quest:1859} Therzok · {zone:1454} Orgrimmar
	["At 10 {npc:3170}, the rogue trainer in {area:362}, sends you to {quest:1859} in {zone:1454}."] = "Au niveau 10, {npc:3170}, le maître des voleurs de {area:362}, vous envoie voir {quest:1859} à {zone:1454}.",

	-- Step 2: The Shattered Hand
	-- {quest:1859} Therzok · {object:172960} Cleft of Shadow · {object:172982} Valley of Strength · {quest:1963} The Shattered Hand
	["{quest:1859} stands in the {object:172960}, the canyon under the {object:172982}. Trolls: take {quest:1963} from him at 10."] = "{quest:1859} se tient dans la {object:172960}, le canyon sous la {object:172982}. Trolls : prenez {quest:1963} auprès de lui au niveau 10.",

	-- Step 3: Tazan
	["Tazan"] = "Tazan",
	-- {zone:1413} The Barrens · {area:392} Ratchet
	["Tazan stands on the {zone:1413} coast south of {area:392}. Kill him for his satchel."] = "Tazan se tient sur la côte des {zone:1413} au sud de {area:392}. Tuez-le pour prendre sa sacoche.",
	-- {item:7209} Tazan's Satchel
	["{item:7209}: Tazan"] = "{item:7209} : Tazan",

	-- Step 4: Back to Therzok
	-- {npc:6446} Therzok
	["Back to {npc:6446}"] = "Retour auprès de {npc:6446}",

	-- Step 5: Tazan's Key
	-- {object:172982} Valley of Strength · {item:7208} Tazan's Key · {item:7209} Tazan's Satchel
	["Gamon drinks in the inn in the {object:172982}. Pick his pocket for {item:7208}, then open {item:7209}."] = "Gamon boit à l'auberge de la {object:172982}. Faites-lui les poches pour obtenir la {item:7208}, puis ouvrez la {item:7209}.",
	-- {item:7208} Tazan's Key
	["{item:7208}: Gamon"] = "{item:7208} : Gamon",
	-- {item:7209} Tazan's Satchel
	["{item:7209}, once you have the key"] = "{item:7209}, une fois la clé en main",
	-- {item:7295} Tazan's Logbook
	["{item:7295}, from the satchel"] = "{item:7295}, dans la sacoche",

	-- Step 6: Therzok's reward
	-- {npc:6446} Therzok
	["{npc:6446}'s reward"] = "Récompense de {npc:6446}",

	-- Step 7: Mennet Carkad
	-- {npc:2130} Marion Call · {area:2119} Gallows' End Tavern · {area:159} Brill · {quest:1885} Mennet Carkad · {zone:1458} Undercity
	["At 10 {npc:2130}, the rogue trainer in the {area:2119} in {area:159}, sends you to {quest:1885} in the {zone:1458}."] = "Au niveau 10, {npc:2130}, la maîtresse des voleurs de la {area:2119} à {area:159}, vous envoie voir {quest:1885} à {zone:1458}.",

	-- Step 8: The Rogues' Quarter
	-- {object:36073} Rogues' Quarter
	["The {object:36073}"] = "Le {object:36073}",
	-- {quest:1885} Mennet Carkad · {object:36073} Rogues' Quarter
	["{quest:1885} stands in the {object:36073}."] = "{quest:1885} se tient dans le {object:36073}.",

	-- Step 9: Astor Hadren
	-- {npc:6497} Astor Hadren · {area:228} The Sepulcher
	["{npc:6497} stands north-east of the {area:228}. Take his Letter of Introduction from him."] = "{npc:6497} se tient au nord-est du {area:228}. Prenez-lui sa lettre d'introduction.",

	-- Step 10: Back to Mennet Carkad
	-- {npc:6467} Mennet Carkad
	["Back to {npc:6467}"] = "Retour auprès de {npc:6467}",

	-- Step 11: Andron Gant
	-- {npc:6522} Andron Gant
	["{npc:6522}'s ledger sits on the bookshelf beside him."] = "Le registre de {npc:6522} se trouve sur l'étagère à côté de lui.",

	-- Step 12: Mennet and Varimathras
	-- {npc:2425} Varimathras
	["Mennet and {npc:2425}"] = "Mennet et {npc:2425}",
	-- {npc:2425} Varimathras · {object:36126} Royal Quarter
	["Mennet sends the ledger on to {npc:2425} in the Hall of the Dark Lady, the {object:36126}."] = "Mennet transmet le registre à {npc:2425}, dans la salle de la Dame noire, le {object:36126}.",
}
