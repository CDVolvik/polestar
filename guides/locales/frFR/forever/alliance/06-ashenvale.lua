-- French (frFR): the guide forever/alliance/06-ashenvale (forever/alliance/06-ashenvale.guide).
-- Written by `node tools/polestar.js i18n guides sync frFR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in French (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Step 1: Aquatic Form
	-- {area:17203} Stormwind Harbor · {area:442} Auberdine · {item:15885} Pendant of the Sea Lion · {zone:1450} Moonglade · {npc:11802} Dendrite Starblaze · {area:2361} Nighthaven · {area:702} Rut'theran Village
	["Take the boat from {area:17203} to {area:442}. Join the two half pendants into the {item:15885} and cast Teleport: {zone:1450}: {npc:11802} is in {area:2361}. Then fly to {area:702} (by way of {area:442})."] = "",
	-- {item:15885} Pendant of the Sea Lion
	["{item:15885}: join the two halves"] = "",

	-- Step 2: Mathrengyl Bearwalker
	-- {area:1658} Cenarion Enclave · {area:442} Auberdine
	["Take the portal up to the {area:1658}, then fly back to {area:442}."] = "",

	-- Step 3: Elune's Grace
	-- {area:17203} Stormwind Harbor · {area:442} Auberdine · {area:702} Rut'theran Village · {npc:11401} Priestess Alathea
	["Take the boat from {area:17203} to {area:442} and fly to {area:702}; {npc:11401} is in the Temple of the Moon. Then fly back to {area:442}."] = "",

	-- Step 4: Boat to Auberdine
	-- {area:17203} Stormwind Harbor · {area:442} Auberdine · {npc:3649} Thundris Windweaver · {zone:1439} Darkshore
	["From {area:17203} take the boat to {area:442}; {npc:3649} stands at the north end of the village. Then ride south along the road through {zone:1439}."] = "",
	-- {npc:3649} Thundris Windweaver
	["{npc:3649}: Alexston's reply"] = "",

	-- Step 5: Kerlonian Evershade
	-- {area:448} Grove of the Ancients · {zone:1439} Darkshore · {item:13536} Horn of Awakening · {zone:1440} Ashenvale · {npc:11219} Liladris Moonriver · {area:413} Maestra's Post
	["Kerlonian sleeps at the {area:448} in southern {zone:1439}. Use the {item:13536} to wake him and lead him south along the road into {zone:1440} to {npc:11219} at {area:413}; blow the horn again whenever he falls asleep."] = "",
	-- {area:413} Maestra's Post · {zone:1440} Ashenvale
	["Escort Kerlonian to {area:413} in {zone:1440}."] = "",

	-- Step 7: Bathran's Haunt
	-- {area:413} Maestra's Post · {area:411} Bathran's Haunt · {item:5366} Glowing Soul Gem
	["North of {area:413}, plant bundles lie around the ruins of {area:411}. Dark Strand cultists hold the ruins just south of them: any of them can drop the {item:5366}."] = "",
	-- {quest:1010} Bathran's Hair
	["{quest:1010}, from the plant bundles"] = "",

	-- Step 9: Astranaar
	-- {area:415} Astranaar
	["Follow the road south-east to {area:415}, on the island in the lake."] = "",
	-- {npc:3691} Raene Wolfrunner
	["{npc:3691}, in the inn"] = "",

	-- Step 10: Teronis' Corpse
	-- {area:441} Lake Falathim · {item:5463} Glowing Gem
	["Ride west to the shore of {area:441}. Teronis lies among the Saltspittle murlocs; any murloc can drop the {item:5463}."] = "",

	-- Step 11: The Shrine of Aessina
	-- {npc:3585} Therysil · {area:416} The Shrine of Aessina
	["South of the murlocs, {npc:3585} waits at the {area:416}."] = "",

	-- Step 12: Ilkrud Magthrull
	-- {area:412} The Ruins of Ordil'Aran
	["Ilkrud and his voidwalkers hold the {area:412} south of the shrine. Pull his guards first."] = "",

	-- Step 13: The Zoram Strand
	-- {area:414} The Zoram Strand · {npc:3846} Talen
	["Follow the coast north to the {area:414}. {npc:3846} camps on the beach; Wrathtail nagas fill the shore."] = "",
	-- {item:5424} Ancient Statuette
	["{item:5424}, in the ruins on the shore"] = "",

	-- Step 15: Ruuzel
	-- {quest:1009} Ruuzel · {area:414} The Zoram Strand
	["{quest:1009} walks the northern tip of the {area:414} with Wrathtail guards."] = "",

	-- Step 19: Dal Bloodclaw
	-- {npc:3987} Dal Bloodclaw · {area:415} Astranaar
	["{npc:3987} (25) leads the Thistlefur gnolls at the camp north of {area:415}. Clear his guards first, one at a time."] = "",

	-- Step 20: Elune's Tear
	-- {area:415} Astranaar
	["The tears glow on the small isle east of {area:415}."] = "",

	-- Step 22: Shael'dryn
	-- {area:419} The Howling Vale · {npc:3916} Shael'dryn
	["Follow the road east to the {area:419}; {npc:3916} stands by the moonwell."] = "",

	-- Step 23: The Foulweald
	["The Foulweald"] = "",
	-- {area:415} Astranaar · {area:364} The Den
	["The Foulweald furbolgs live in the woods south of the road, south-east of {area:415}. {area:364} Watcher and the Ursas guard the den."] = "",

	-- Step 24: Mystral Lake
	-- {npc:3885} Sentinel Velene Starstrike · {area:420} Silverwind Refuge · {area:421} Mystral Lake · {npc:210995} Alonso
	-- plural, as words: Befouled Water Elementals = {npc:3917} Befouled Water Elemental · Water Elementals = {npc:510} Water Elemental
	["{npc:3885} stands at the {area:420} on the east shore of {area:421}; {npc:210995} camps on its west shore. Befouled Water Elementals wade in the lake between them."] = "",
	-- {quest:1016} Elemental Bracers · {item:5456} Divining Scroll
	-- plural, as words: Intact Elemental Bracers = {item:12220} Intact Elemental Bracer
	["Kill the elementals for 5 Intact {quest:1016}, then use the {item:5456}"] = "",

	-- Step 25: The Ruins of Stardust
	-- {area:421} Mystral Lake
	["West of {area:421}, the stardust bushes grow among the ruins."] = "",

	-- Step 27: Windshear Crag
	-- {area:421} Mystral Lake · {area:1276} The Talondeep Path · {area:461} Windshear Crag · {area:1076} Webwinder Path
	["Ride south past {area:421} into the {area:1276} tunnel; it comes out in Stonetalon's {area:461}. Kaela and Gaxim camp on the {area:1076} south-west of the crag."] = "",
	-- {npc:4201} Ziz Fizziks
	["{npc:4201}, in the hut north of them"] = "",

	-- Step 28: Venture Co. loggers
	["Venture Co. loggers"] = "",
	-- {area:461} Windshear Crag
	["The Venture Co. clear the forest of {area:461}. Loggers and Deforesters work all over it; the Operators run the shredders and one carries the blueprints."] = "",

	-- Step 29: Piznik
	-- {npc:4276} Piznik · {area:2160} Windshear Mine
	["{npc:4276} mines in the {area:2160} at the east end of the crag. Talk to him and fend off the Venture Co. raiders while he mines."] = "",

	-- Step 31: To Menethil Harbor
	-- {area:150} Menethil Harbor
	["To {area:150}"] = "",
	-- {area:1276} The Talondeep Path
	["Hearthstone on cooldown? Ride back north through the {area:1276}."] = "",
	-- {object:176364} Boat to Menethil
	["{object:176364} Harbor"] = "",

	-- Step 32: Menethil Harbor
	-- {npc:1242} Karl Boran
	["{npc:1242}, on the pier north of the inn"] = "",
	-- {npc:1239} First Mate Fitzsimmons
	["{npc:1239}, in the inn"] = "",
	-- {npc:2086} Valstag Ironjaw
	["{npc:2086}, by the keep"] = "",
	-- {npc:2097} Harlo Barnaby
	["{npc:2097}, by the north gate"] = "",
	-- {npc:2094} James Halloran
	["{npc:2094}, by the north gate"] = "",
	-- {npc:2096} Tarrel Rockweaver
	["{npc:2096}, by the north gate"] = "",

	-- Step 33: Spoils of War
	["Timber and iron piles lie around the keep and along the harbor's walls."] = "",

	-- Step 35: Bluegill Marsh
	-- plural, as words: Bluegill Murlocs = {npc:1024} Bluegill Murloc
	["Follow the coast north out of Menethil. Bluegill Murlocs fill the marsh; Gobbler walks with a pack in the middle of it."] = "",

	-- Step 37: The Bluegill hovels
	["The Bluegill hovels"] = "",
	-- {object:261} Damaged Crate · {object:142151} Sealed Barrel · {object:259} Half-buried Barrel
	["Three containers in the murloc hovels, south to north: the {object:261}, then the {object:142151}, then the {object:259} at the north end."] = "",

	-- Step 38: Karl Boran
	-- {npc:1242} Karl Boran · {npc:2104} Captain Stoutfist
	["{npc:1242}: for {npc:2104} in the keep"] = "",

	-- Step 39: Captain Stoutfist
	-- {npc:2104} Captain Stoutfist · {area:2103} Menethil Keep · {npc:1242} Karl Boran
	["{npc:2104} stands in {area:2103}, a short walk from {npc:1242}."] = "",
	-- {object:2117} Stormwind Keep
	["For Bolvar Fordragon in {object:2117}: keep it"] = "",

	-- Step 40: Young crocolisks
	["Young crocolisks"] = "",
	-- {zone:1437} Wetlands
	-- plural, as words: Young Wetlands Crocolisks = {npc:1417} Young Wetlands Crocolisk
	["Follow the road east. Young {zone:1437} Crocolisks lurk in the pools north of the excavation site."] = "",

	-- Step 41: Whelgar's Excavation Site
	["The excavation site sits on the hill south of the road."] = "",

	-- Step 42: The raptor hills
	["The raptor hills"] = "",
	-- plural, as words: Mottled Raptors = {npc:1020} Mottled Raptor
	["Mottled Raptors and Screechers roam the hills west of the excavation site."] = "",

	-- Step 44: Raptor valley
	["Raptor valley"] = "",
	["The bigger raptors hunt in the valley just west of the dig."] = "",

	-- Step 46: Thelgen Rock
	-- {area:1021} Thelgen Rock
	-- plural, as words: Cave Stalkers = {npc:4040} Cave Stalker · Leech Stalkers = {npc:1111} Leech Stalker
	["Cave Stalkers and Leech Stalkers fill {area:1021}, the cave south-east of the excavation site."] = "",

	-- Step 47: Black Oozes
	-- plural, as words: Black Oozes = {npc:1032} Black Ooze
	["Black Oozes"] = "",
	-- {area:1025} The Green Belt · {npc:2111} Sida
	-- plural, as words: Black Oozes = {npc:1032} Black Ooze
	["Black Oozes creep through the marsh north of the {area:1025} road, west of Einar's camp. Any ooze may hold {npc:2111}'s bag."] = "",

	-- Step 48: The Green Belt
	-- {npc:2093} Einar Stonegrip · {npc:1244} Rethiel the Greenwarden
	["{npc:2093} camps by the road; {npc:1244} stands farther east, by the river."] = "",

	-- Step 49: The Mosshide gnolls
	["The Mosshide gnolls"] = "",
	-- {area:1025} The Green Belt
	-- plural, as words: Mosshide Gnolls = {npc:1007} Mosshide Gnoll
	["Mosshide Gnolls and Mongrels hold the hills south-east of the {area:1025}."] = "",

	-- Step 51: Crude Flint
	-- plural, as words: Mosshide Fenrunners = {npc:1010} Mosshide Fenrunner
	["Mosshide Fenrunners and Mistweavers roam the riverbanks just west and south of Rethiel; almost every one drops flint."] = "",

	-- Step 53: Fen Creepers
	-- plural, as words: Fen Creepers = {npc:1040} Fen Creeper
	["Fen Creepers"] = "",
	-- {area:1025} The Green Belt
	-- plural, as words: Fen Creepers = {npc:1040} Fen Creeper
	["Fen Creepers hide in the marsh pools north-west of the {area:1025}."] = "",

	-- Step 54: Dun Modr
	-- {area:205} Dun Modr · {area:881} Thandol Span · {npc:1071} Longbraid the Grim
	["Follow the road north to {area:205}, at the foot of the {area:881}. {npc:1071} stands in the dwarves' camp."] = "",

	-- Step 56: Dragonmaw camp
	["Dragonmaw camp"] = "",
	-- {area:1025} The Green Belt · {npc:2092} Pilot Longbeard · {zone:1426} Dun Morogh
	["The Dragonmaw camp lies south of the road, just west of the {area:1025}: Raiders, Swamprunners and Bonewarders. {npc:2092}'s quest in {zone:1426} needs level 28."] = "",
	-- {zone:1437} Wetlands
	-- plural, as words: Dragonmaw Raiders = {npc:1034} Dragonmaw Raider
	["grind on Dragonmaw Raiders and Swamprunners at the Dragonmaw camp, {zone:1437}"] = "",

	-- Step 57: Hearth to Menethil
	["Hearth to Menethil"] = "",
	["For the giant crocolisks of the north coast, on your next visit"] = "",

	-- Step 58: Ironforge
	-- {zone:1437} Wetlands · {area:836} Dun Algaz · {zone:1432} Loch Modan · {zone:1426} Dun Morogh · {area:1537} Ironforge
	["Ride east along the {zone:1437} road, south through {area:836} into {zone:1432} and west through the tunnel into {zone:1426} to {area:1537}."] = "",
	-- {npc:1573} Gryth Thurden · {object:32372} The Great Forge
	["{npc:1573}, in the {object:32372}"] = "",
	-- {item:5352} Book: The Powers Below · {zone:1439} Darkshore · {npc:2786} Gerrig Bonegrip · {object:32383} The Forlorn Cavern
	["Only with {item:5352} from {zone:1439}: {npc:2786}, the {object:32383}"] = "",

	-- Step 59: Ironforge priests
	-- {zone:1455} Ironforge
	["{zone:1455} priests"] = "",
	-- {npc:11406} High Priest Rohan · {npc:258785} High Priestess Mims · {object:32386} Hall of Mysteries · {object:32362} The Mystic Ward
	["{npc:11406} and {npc:258785} are in the {object:32386}, in the {object:32362}."] = "",

	-- Step 60: Cathedral of Light
	["Cathedral of Light"] = "",
	-- {area:2257} Deeprun Tram · {object:171524} Tinker Town · {zone:1453} Stormwind City · {object:28027} Dwarven District · {object:2098} Cathedral Square
	["Take the {area:2257} from {object:171524} to {zone:1453}'s {object:28027}, then walk to the {object:2098}."] = "",
	-- {npc:4982} Thomas
	["{npc:4982}, in the Cathedral of Light"] = "",
	-- {npc:1444} Brother Kristoff · {object:2098} Cathedral Square
	["{npc:1444}, in the {object:2098}"] = "",

	-- Step 61: Stormwind Keep
	-- {npc:1440} Milton Sheaf
	["{npc:1440}, in the Royal Library"] = "",
	-- {quest:337} An Old History Book · {zone:1431} Duskwood
	["Only if you looted {quest:337} in {zone:1431}"] = "",

	-- Step 62: Lord Grayson Shadowbreaker
	-- {npc:928} Lord Grayson Shadowbreaker
	["Back to the Cathedral of Light: {npc:928} stands inside."] = "",
	-- {npc:2228} Lieutenant Farren Orinelle · {area:271} Southshore
	["For {npc:2228} in {area:271}: keep it"] = "",

	-- Step 63: Mage Quarter
	-- {object:2164} The Slaughtered Lamb · {object:2101} Mage Quarter
	["{object:2164} is in the {object:2101}."] = "",

	-- Step 64: Jorgen and Elling Trias
	-- {npc:4959} Jorgen · {npc:482} Elling Trias
	["{npc:4959} and {npc:482}"] = "",
	-- {npc:482} Elling Trias · {object:2096} Trade District
	["{npc:482}, the cheese shop in the {object:2096}"] = "",

	-- Step 65: Trade District
	-- {area:42} Darkshire
	["Next: fly to {area:42}."] = "",
}
