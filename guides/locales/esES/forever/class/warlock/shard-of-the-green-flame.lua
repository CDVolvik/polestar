-- Spanish (Spain) (esES): the guide forever/class/warlock/shard-of-the-green-flame (forever/class/warlock/shard-of-the-green-flame.guide).
-- Written by `node tools/polestar.js i18n guides sync esES`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Spanish (Spain) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	-- {npc:14470} Impsy · {zone:1448} Felwood
	["A rare off-hand for your 50s from Niby and {npc:14470} in {zone:1448}, the camp that also offers An Imp's Request."] = "Un objeto raro de mano izquierda para tus niveles 50, de Niby y {npc:14470} en {zone:1448}, el campamento que también ofrece Pedido de un diablillo.",

	-- Step 1: Niby the Almighty
	-- {npc:14469} Niby the Almighty · {npc:14470} Impsy · {zone:1448} Felwood · {area:1763} Jaedenar
	["At 50 {npc:14469} and his imp {npc:14470} wait in central {zone:1448}, just east of {area:1763}."] = "A nivel 50, {npc:14469} y su diablillo {npc:14470} esperan en el centro de {zone:1448}, justo al este de {area:1763}.",

	-- Step 2: Jaedenar
	-- {area:1763} Jaedenar
	-- plural, as words: Jaedenar Legionnaires = {npc:9862} Jaedenar Legionnaire
	["The Jaedenar Legionnaires, a short way west of Niby, carry {area:1763}'s essence."] = "Los legionarios Jaedenar, un poco al oeste de Niby, llevan la esencia de {area:1763}.",

	-- Step 3: Azshara
	-- {zone:1447} Azshara
	["The Legashi satyrs of northern {zone:1447} carry {zone:1447}'s essence."] = "Los sátiros Legashi del norte de {zone:1447} llevan la esencia de {zone:1447}.",

	-- Step 4: The Dark Portal
	-- {zone:1419} Blasted Lands
	["The Felguard Sentries around the Dark Portal, in southern {zone:1419}, carry its essence."] = "Los centinelas guardia vil que rodean El Portal Oscuro, en el sur de {zone:1419}, llevan su esencia.",

	-- Step 6: Kroshius
	-- {npc:14467} Kroshius · {area:1766} Shatter Scar Vale · {item:18626} Fel Fire
	["{npc:14467}' remains lie in {area:1766}, north of Niby. Use the {item:18626} beside them and kill the infernal when he wakes. {npc:14467} is elite: grouping up is advised."] = "Los restos de {npc:14467} están en {area:1766}, al norte de Niby. Usa {item:18626} junto a ellos y mata al infernal cuando despierte. {npc:14467} es élite: se recomienda ir en grupo.",
	-- {item:18626} Fel Fire · {object:179677} Kroshius' Remains
	["{item:18626}, at {object:179677}"] = "{item:18626}, en {object:179677}",

	-- Step 7: Back to Niby
	["Back to Niby"] = "Vuelve con Niby",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["The Felguard Sentries around the {area:72}, in southern {zone:1419}, carry its essence."] = "Los argos guardia maldito que rodean {area:72}, en el sur de {zone:1419}, llevan su esencia.",
	-- ["The {area:1763} Legionnaires, a short way west of Niby, carry {area:1763}'s essence."] = "Los legionarios {area:1763}, un poco al oeste de Niby, llevan la esencia de {area:1763}.",
}
