-- French (frFR): the guide forever/collectibles/mounts/neutral/galestrider (forever/collectibles/mounts/neutral/galestrider.guide).
-- Written by `node tools/polestar.js i18n guides sync frFR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in French (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Guide
	["Galestrider"] = "Trotteur des trombes",

	-- Step 1: Learn to ride
	["Learn to ride"] = "Apprendre à monter",
	-- {skill:762} Riding
	["Galestriders need level 40 and {skill:762} (Galestrider {skill:762} comes with it in the Forever client). Any riding trainer of your faction teaches it; see the Level 40 mount guides for where."] = "Les Trotteurs des trombes demandent le niveau 40 et {skill:762} ({skill:762} de Trotteur des trombes est inclus dans le client Forever). Tout maître de monte de votre faction l'enseigne ; voir les guides des montures de niveau 40 pour savoir où.",

	-- Step 2: Skyboat from Dalaran
	-- {area:279} Dalaran
	["Skyboat from {area:279}"] = "Bateau volant depuis {area:279}",
	-- {zone:2521} Zephras Isle · {area:279} Dalaran · {zone:1456} Thunder Bluff
	["{zone:2521} is the Skyborne starting island; anyone may visit. A skyboat leaves the north side of {area:279} about every five minutes (another flies from north of {zone:1456}; either faction may take either). Skip this if you are already on the island."] = "{zone:2521} est l'île de départ des Skyborne ; tout le monde peut s'y rendre. Un bateau volant part du côté nord de {area:279} environ toutes les cinq minutes (un autre part du nord des {zone:1456} ; chaque faction peut prendre l'un ou l'autre). Passez cette étape si vous êtes déjà sur l'île.",
	-- {zone:2521} Zephras Isle
	["Skyboat to {zone:2521}"] = "Bateau volant vers {zone:2521}",

	-- Step 3: Skyboat from Thunder Bluff
	-- {zone:1456} Thunder Bluff
	["Skyboat from {zone:1456}"] = "Bateau volant depuis les {zone:1456}",
	-- {zone:2521} Zephras Isle · {area:17045} Skywatcher Plateau · {zone:1456} Thunder Bluff · {area:279} Dalaran
	["{zone:2521} is the Skyborne starting island; anyone may visit. A skyboat leaves the cliffs south of {area:17045}, north of {zone:1456}, about every five minutes (another flies from {area:279}; either faction may take either). Skip this if you are already on the island."] = "{zone:2521} est l'île de départ des Skyborne ; tout le monde peut s'y rendre. Un bateau volant part des falaises au sud du {area:17045}, au nord des {zone:1456}, environ toutes les cinq minutes (un autre part de {area:279} ; chaque faction peut prendre l'un ou l'autre). Passez cette étape si vous êtes déjà sur l'île.",

	-- Step 4: Genn Fairweather
	-- {npc:265756} Genn Fairweather · {area:16638} Valanaar
	["{npc:265756} is in {area:16638}, the island's harbour town, near the skyboat docks. The Forever client lists each Galestrider at 20g; choose one."] = "{npc:265756} se trouve à {area:16638}, le port de l'île, près des quais des bateaux volants. Le client Forever indique chaque Trotteur des trombes à 20 po ; choisissez-en un.",
	["20g"] = "20 po",
}
