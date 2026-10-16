-- Spanish (Spain) (esES): the guide forever/class/warlock/enchanted-gold-bloodrobe (forever/class/warlock/enchanted-gold-bloodrobe.guide).
-- Written by `node tools/polestar.js i18n guides sync esES`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Spanish (Spain) (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Guide
	-- {npc:6266} Menara Voidrender
	["A rare cloth robe for your 30s, which {npc:6266} makes from the parts you bring her."] = "Una toga de tela rara para la treintena, que {npc:6266} confecciona con las piezas que le lleves.",

	-- Step 1: In Search of Menara Voidrender (Stormwind City)
	-- {npc:461} Demisette Cloyce · {object:2164} The Slaughtered Lamb · {object:2101} Mage Quarter · {npc:6266} Menara Voidrender · {area:392} Ratchet
	["At 31 {npc:461} in the {object:2164}, in the {object:2101}, sends you to {npc:6266} in {area:392}."] = "A nivel 31, {npc:461}, en {object:2164} de {object:2101}, te envía con {npc:6266} en {area:392}.",

	-- Step 2: In Search of Menara Voidrender (Ironforge)
	-- {npc:5172} Briarthorn · {zone:1455} Ironforge · {npc:6266} Menara Voidrender · {area:392} Ratchet
	["At 31 {npc:5172} in {zone:1455} sends you to {npc:6266} in {area:392}."] = "A nivel 31, {npc:5172}, en {zone:1455}, te envía con {npc:6266} en {area:392}.",

	-- Step 3: In Search of Menara Voidrender (Orgrimmar)
	-- {npc:3326} Zevrost · {object:172960} Cleft of Shadow · {npc:6266} Menara Voidrender · {area:392} Ratchet
	["At 31 {npc:3326} in the {object:172960} sends you to {npc:6266} in {area:392}."] = "A nivel 31, {npc:3326}, en {object:172960}, te envía con {npc:6266} en {area:392}.",

	-- Step 4: In Search of Menara Voidrender (Undercity)
	-- {npc:4563} Kaal Soulreaper · {object:36082} Magic Quarter · {npc:6266} Menara Voidrender · {area:392} Ratchet · {zone:1420} Tirisfal Glades · {zone:1411} Durotar
	["At 31 {npc:4563} in the {object:36082} sends you to {npc:6266} in {area:392}. The zeppelin from {zone:1420} flies to {zone:1411}."] = "A nivel 31, {npc:4563}, en {object:36082}, te envía con {npc:6266} en {area:392}. El zepelín de {zone:1420} vuela a {zone:1411}.",

	-- Step 5: Menara Voidrender
	-- {npc:6266} Menara Voidrender · {area:392} Ratchet · {npc:6251} Strahad Farsan
	["{npc:6266} stands in the tower on the hill above {area:392}, beside {npc:6251}."] = "{npc:6266} está en la torre de la colina sobre {area:392}, junto a {npc:6251}.",

	-- Step 6: Robes of Arcana
	-- {item:5770} Robes of Arcana · {item:3577} Gold Bar · {item:2776} Gold Ore
	["Bring Menara a {item:5770}: tailors sew it from a pattern that drops; otherwise buy one at the Auction House. Her next errand needs a {item:3577}: smelted from {item:2776}, or from the Auction House."] = "Llévale a Menara una {item:5770}: los sastres la cosen con un patrón que se obtiene como botín; si no, cómprala en la casa de subastas. Su siguiente encargo requiere una {item:3577}: se funde a partir de {item:2776} o se compra en la casa de subastas.",

	-- Step 7: Xizk Goodstitch
	-- {npc:2670} Xizk Goodstitch · {area:35} Booty Bay · {item:3577} Gold Bar
	["{npc:2670} sells tailoring supplies in {area:35}. Bring him the {item:3577}."] = "{npc:2670} vende suministros de sastrería en {area:35}. Llévale la {item:3577}.",

	-- Step 8: Back to Menara
	["Back to Menara"] = "De vuelta con Menara",

	-- Step 9: Desolace demons
	-- {zone:1443} Desolace
	["{zone:1443} demons"] = "Demonios de {zone:1443}",
	-- {area:603} Sargeron · {zone:1443} Desolace · {area:602} Mannoroc Coven
	-- plural, as words: Lesser Infernals = {npc:4676} Lesser Infernal
	["The Hatefury satyrs of {area:603}, in north-eastern {zone:1443}, carry the blood; the Lesser Infernals of {area:602}, in the south, the stone."] = "Los sátiros Odio Feroz de {area:603}, en el noreste de {zone:1443}, llevan la sangre; los infernales inferiores de {area:602}, en el sur, la piedra.",
	["Vials of Hatefury Blood"] = "Viales de sangre de odio feroz",

	-- Step 10: Menara again
	["Menara again"] = "Otra vez con Menara",

	-- Step 11: Fine Gold Thread
	-- {npc:2670} Xizk Goodstitch · {area:35} Booty Bay
	["{npc:2670} in {area:35} has the thread for you."] = "{npc:2670}, en {area:35}, tiene el hilo para ti.",

	-- Step 12: Smoldering Coal
	-- {zone:1417} Arathi Highlands
	-- plural, as words: Burning Exiles = {npc:2760} Burning Exile
	["The Burning Exiles, fire elementals in western {zone:1417}, drop the coal."] = "Los exiliados ardientes, elementales de fuego del oeste de {zone:1417}, sueltan el carbón.",

	-- Step 13: The Completed Robe
	-- {item:6265} Soul Shard
	["Back to Menara with the thread, the coal and a {item:6265}. Wait while she completes the robe, then speak to her again."] = "Vuelve con Menara con el hilo, el carbón y un {item:6265}. Espera mientras termina la toga y luego vuelve a hablar con ella.",
	["Wait for the robe"] = "Espera la toga",
}
