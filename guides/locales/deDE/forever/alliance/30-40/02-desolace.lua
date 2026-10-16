-- German (deDE): the guide forever/alliance/30-40/02-desolace (forever/alliance/30-40/02-desolace.guide).
-- Written by `node tools/polestar.js i18n guides sync deDE`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in German (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Step 1: Menethil Harbor
	-- {zone:1455} Ironforge · {npc:1573} Gryth Thurden
	["From {zone:1455}'s {npc:1573}"] = "Von {npc:1573} in {zone:1455}",

	-- Step 2: Auberdine
	-- {area:442} Auberdine · {npc:3649} Thundris Windweaver
	["Take the boat to {area:442} from Menethil's docks. {npc:3649} stands in {area:442}, north of the flight master."] = "Nimm das Schiff von Menethils Anlegestelle nach {area:442}. {npc:3649} steht in {area:442}, nördlich des Flugmeisters.",
	-- {npc:3649} Thundris Windweaver · {item:279915} Nord'el
	["{npc:3649}: {item:279915}, from Sylessa in Menethil"] = "{npc:3649}: {item:279915}, von Sylessa in Menethil",

	-- Step 3: Heartswood
	-- {area:415} Astranaar · {quest:1738} Heartswood · {area:413} Maestra's Post · {quest:65602} What Is Love? · {item:190309} Wooden Figurine · {area:1276} The Talondeep Path
	["From {area:415} ride north-west into the hills: the {quest:1738} is a glowing tree north of the road to {area:413}. If you took {quest:65602}, the {item:190309} lies in a house among the trees north of {area:413} (26.6,22.0). Then back past {area:415} to the {area:1276}."] = "Reite von {area:415} nach Nordwesten in die Hügel: {quest:1738} ist ein leuchtender Baum nördlich der Straße nach {area:413}. Falls du {quest:65602} angenommen hast, liegt {item:190309} in einem Haus zwischen den Bäumen nördlich von {area:413} (26.6,22.0). Dann zurück an {area:415} vorbei zum {area:1276}.",
	-- {item:190309} Wooden Figurine · {area:413} Maestra's Post
	["{item:190309}, north of {area:413}"] = "{item:190309}, nördlich von {area:413}",

	-- Step 4: The Talondeep Path
	-- {area:415} Astranaar · {area:1276} The Talondeep Path
	["From {area:415} head south-west to the {area:1276}, a tunnel through the mountains into Stonetalon."] = "Reite von {area:415} nach Südwesten zum {area:1276}, einem Tunnel durch die Berge ins Steinkrallengebirge.",

	-- Step 5: Nijel's Point
	-- {area:460} Sun Rock Retreat · {area:465} The Charred Vale · {zone:1443} Desolace · {area:608} Nijel's Point
	["Follow the road west past {area:460} (Horde) and south-west through the {area:465} into {zone:1443}; {area:608} stands at the top of the pass."] = "Folge der Straße nach Westen an {area:460} (Horde) vorbei und nach Südwesten durch {area:465} nach {zone:1443}; {area:608} liegt oben am Pass.",

	-- Step 6: Sargeron
	-- {area:603} Sargeron · {area:608} Nijel's Point
	["The Hatefury satyrs hold the ruins of {area:603}, east of {area:608}."] = "Die Satyrn der Zornsäer halten die Ruinen von {area:603}, östlich von {area:608}.",

	-- Step 8: Malem chest
	["Malem chest"] = "Truhe der Malems",
	-- {area:608} Nijel's Point
	["The chest lies in the ruins south-west of {area:608}."] = "Die Truhe liegt in den Ruinen südwestlich von {area:608}.",

	-- Step 10: Azore Aldamort
	-- {area:599} Thunder Axe Fortress
	["Azore's tower stands on the hill west of {area:599}: take his quest first, the sceptre he wants is in the fortress."] = "Azores Turm steht auf dem Hügel westlich von {area:599}: Nimm zuerst seine Quest an, das Zepter, das er will, ist in der Festung.",

	-- Step 11: Dalinda Malem
	-- {spell:1294269} Burning Blade · {area:608} Nijel's Point
	["Dalinda hides inside the {spell:1294269}'s fortress south-west of {area:608}."] = "Dalinda versteckt sich in der Festung der {spell:1294269} südwestlich von {area:608}.",

	-- Step 12: Tyranis and the Seer
	["Tyranis and the Seer"] = "Tyranis und der Seher",
	-- {spell:1294269} Burning Blade · {npc:13019} Burning Blade Seer
	["Her brother Tyranis (36) walks the fortress with the {spell:1294269} cultists (30-33): pull him alone. The {npc:13019} keeps the sceptre in the fortress's main building."] = "Ihr Bruder Tyranis (36) läuft mit den Kultisten der {spell:1294269} (30-33) durch die Festung: Zieh ihn allein. {npc:13019} hat das Zepter im Hauptgebäude der Festung.",

	-- Step 13: Escort Dalinda
	["Escort Dalinda"] = "Dalinda eskortieren",
	-- {area:599} Thunder Axe Fortress
	["Out of {area:599}"] = "Raus aus {area:599}",
	-- {area:608} Nijel's Point
	["Lead Dalinda out of the fortress; she walks off once you are clear of it. Vahlarriel takes the turn-in at {area:608} at the end of the guide."] = "Führ Dalinda aus der Festung; sie geht ihrer Wege, sobald ihr draußen seid. Vahlarriel nimmt die Abgabe am Ende des Guides in {area:608} entgegen.",

	-- Step 15: Scorpashi venom
	["Scorpashi venom"] = "Skorpashigift",
	-- {area:2407} Kormek's Hut
	["The Scorpashi scorpids hunt the hills around {area:2407} on the road south."] = "Die Skorpashi-Skorpide jagen in den Hügeln um {area:2407} an der Straße nach Süden.",

	-- Step 16: Cork Gizelton
	-- {area:2407} Kormek's Hut
	["The Gizelton Caravan waits at {area:2407}."] = "Gizeltons Karawane wartet bei {area:2407}.",

	-- Step 17: Escort the caravan
	["Escort the caravan"] = "Die Karawane eskortieren",
	-- {area:609} Kolkar Village · {area:2617} Scrabblescrew's Camp
	["Walk with the caravan south past {area:609}; Kolkar ambushers jump it on the way. Stay close until it stops at {area:2617}. The ambushers are 34-35 and come in waves: skip it if you are below 33."] = "Geh mit der Karawane nach Süden an {area:609} vorbei; unterwegs überfallen sie Wegelagerer der Kolkar. Bleib dicht dran, bis sie bei {area:2617} anhält. Die Wegelagerer sind Stufe 34-35 und kommen in Wellen: Überspring sie, wenn du unter 33 bist.",

	-- Step 18: Smeed Scrabblescrew
	-- {area:609} Kolkar Village · {area:596} Kodo Graveyard
	["Smeed's camp is on the road south of {area:609}, by the {area:596}."] = "Smeeds Lager liegt an der Straße südlich von {area:609}, beim {area:596}.",

	-- Step 19: Kodo Graveyard
	-- {item:13892} Kodo Kombobulator · {npc:4700} Aged Kodo
	-- plural, as words: Aged Kodos = {npc:4700} Aged Kodo
	["Use Smeed's {item:13892} on an {npc:4700} and walk the tamed kodo back to his camp, five times; Aged Kodos also drop the hides."] = "Benutze Smeeds {item:13892} an einem {npc:4700} und führ den gezähmten Kodo zu seinem Lager zurück, fünfmal; Gealterte Kodos lassen auch die Bälge fallen.",

	-- Step 21: Kolkar Village
	-- {area:609} Kolkar Village · {npc:5752} Corporal Melkins
	["The Kolkar roam the plains around {area:609}; their ears are for {npc:5752}."] = "Die Kolkar streifen über die Ebenen um {area:609}; ihre Ohren sind für {npc:5752}.",
}
