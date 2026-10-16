-- German (deDE): the guide forever/class/warlock/shard-of-the-green-flame (forever/class/warlock/shard-of-the-green-flame.guide).
-- Written by `node tools/polestar.js i18n guides sync deDE`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in German (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	-- {npc:14470} Impsy · {zone:1448} Felwood
	["A rare off-hand for your 50s from Niby and {npc:14470} in {zone:1448}, the camp that also offers An Imp's Request."] = "Eine seltene Schildhand für Stufe 50+ von Niby und {npc:14470} in {zone:1448}, dem Lager, das auch Die Bitte eines Wichtels anbietet.",

	-- Step 1: Niby the Almighty
	-- {npc:14469} Niby the Almighty · {npc:14470} Impsy · {zone:1448} Felwood · {area:1763} Jaedenar
	["At 50 {npc:14469} and his imp {npc:14470} wait in central {zone:1448}, just east of {area:1763}."] = "Mit Stufe 50 warten {npc:14469} und sein Wichtel {npc:14470} in der Mitte von {zone:1448}, direkt östlich von {area:1763}.",

	-- Step 2: Jaedenar
	-- {area:1763} Jaedenar
	-- plural, as words: Jaedenar Legionnaires = {npc:9862} Jaedenar Legionnaire
	["The Jaedenar Legionnaires, a short way west of Niby, carry {area:1763}'s essence."] = "Die Legionäre von Jaedenar, ein kurzes Stück westlich von Niby, tragen die Essenz von {area:1763}.",

	-- Step 3: Azshara
	-- {zone:1447} Azshara
	["The Legashi satyrs of northern {zone:1447} carry {zone:1447}'s essence."] = "Die Satyrn der Legashi im Norden von {zone:1447} tragen die Essenz von {zone:1447}.",

	-- Step 4: The Dark Portal
	-- {zone:1419} Blasted Lands
	["The Felguard Sentries around the Dark Portal, in southern {zone:1419}, carry its essence."] = "Die Wachposten der Teufelswache rund um das Dunkle Portal, im Süden von {zone:1419}, tragen dessen Essenz.",

	-- Step 6: Kroshius
	-- {npc:14467} Kroshius · {area:1766} Shatter Scar Vale · {item:18626} Fel Fire
	["{npc:14467}' remains lie in {area:1766}, north of Niby. Use the {item:18626} beside them and kill the infernal when he wakes. {npc:14467} is elite: grouping up is advised."] = "Die Überreste von {npc:14467} liegen im {area:1766}, nördlich von Niby. Benutze das {item:18626} daneben und töte die Höllenbestie, wenn sie erwacht. {npc:14467} ist Elite: Eine Gruppe wird empfohlen.",
	-- {item:18626} Fel Fire · {object:179677} Kroshius' Remains
	["{item:18626}, at {object:179677}"] = "{item:18626}, bei {object:179677}",

	-- Step 7: Back to Niby
	["Back to Niby"] = "Zurück zu Niby",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["The Felguard Sentries around the {area:72}, in southern {zone:1419}, carry its essence."] = "Die Wachposten der Teufelswache rund um das Gebiet {area:72}, im Süden von {zone:1419}, tragen dessen Essenz.",
}
