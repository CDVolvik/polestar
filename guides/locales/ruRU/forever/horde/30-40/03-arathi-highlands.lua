-- Russian (ruRU): the guide forever/horde/30-40/03-arathi-highlands (forever/horde/30-40/03-arathi-highlands.guide).
-- Written by `node tools/polestar.js i18n guides sync ruRU`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Russian (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Step 1: Fly to Grom'gol
	-- {object:3202} Grom'gol
	["Fly to {object:3202}"] = "",
	-- {area:35} Booty Bay · {object:3202} Grom'gol · {object:1661} The Undercity
	["From {area:35}, fly to {object:3202}. {object:1661} zeppelin leaves from the tower on the west side of the camp."] = "",
	-- {zone:1458} Undercity
	["Zeppelin to the {zone:1458}"] = "",

	-- Step 2: Orgrimmar
	-- {object:1661} The Undercity · {zone:1454} Orgrimmar · {zone:1458} Undercity
	["{object:1661} has no Hunter or Shaman trainer: take the {zone:1454} zeppelin from the same tower instead and train in the city, then take the {zone:1458} zeppelin from the tower outside {zone:1454}'s main gate."] = "",

	-- Step 3: Thunder Bluff
	-- {zone:1450} Moonglade · {npc:11798} Bunthen Plainswind · {area:1638} Thunder Bluff · {npc:3033} Turak Runetotem · {area:1639} Elder Rise · {zone:1454} Orgrimmar · {zone:1458} Undercity
	["Cast Teleport: {zone:1450} and take {npc:11798}'s flight to {area:1638}; {npc:3033} trains you on {area:1639}. Then fly to {zone:1454} and take the {zone:1458} zeppelin from the tower outside the main gate."] = "",

	-- Step 4: Undercity trainers
	-- {zone:1458} Undercity
	["{zone:1458} trainers"] = "",
	-- {zone:1458} Undercity · {object:36070} War Quarter · {object:36073} Rogues' Quarter · {object:36082} Magic Quarter · {npc:260093} Garen Largo
	["Train while you are in the {zone:1458}: the trainers stand in the {object:36070}, the {object:36073} and the {object:36082} (Paladins: {npc:260093})."] = "",

	-- Step 5: Fly to Tarren Mill
	-- {area:272} Tarren Mill
	["Fly to {area:272}"] = "",
	-- {zone:1458} Undercity · {area:272} Tarren Mill
	["The zeppelin lands at the towers outside the {zone:1458}: ride down into the city and fly to {area:272}."] = "",

	-- Step 6: Boulderfist camp
	["Boulderfist camp"] = "",
	-- {area:272} Tarren Mill · {area:1857} Thoradin's Wall · {area:313} Northfold Manor
	-- plural, as words: Boulderfist Ogres = {npc:2562} Boulderfist Ogre
	["Ride east out of {area:272} through {area:1857} and follow the road east. The Boulderfist Ogres and Enforcers (32-34) camp south of the road, south-east of {area:313}."] = "",

	-- Step 7: The Shards of Myzrael
	-- {object:138492} Shards of Myzrael
	["The {object:138492}"] = "",
	-- {area:321} Hammerfall
	["The violet shards glow just off the road a short way west of {area:321}."] = "",

	-- Step 8: Hammerfall
	["The orc stronghold at the eastern end of the road. Urda, the wind rider master, stands by the gate."] = "",

	-- Step 9: Highland raptors
	["Highland raptors"] = "",
	-- {area:321} Hammerfall
	-- plural, as words: Highland Striders = {npc:2559} Highland Strider
	["Highland Striders roam the hills all around {area:321}; both they and the Thrashers further west drop the eyes."] = "",

	-- Step 11: Drywhisker Gorge
	-- {area:321} Hammerfall
	["North-east of {area:321} the Drywhisker kobolds mine the gorge; the Kobolds at the mouth and the Diggers and Surveyors deeper in all drop the Motes of Myzrael."] = "",

	-- Step 12: Iridescent Shards
	-- {object:2701} Iridescent Shards
	["The {object:2701} lie at the far end of the gorge."] = "",

	-- Step 13: The Stone of East Binding
	-- {object:2691} Stone of East Binding
	["The {object:2691}"] = "",
	-- {object:180105} Circle of Binding · {area:321} Hammerfall
	["Each {object:180105} is a ring of standing stones; the key sits on the stone at its heart. The eastern circle is on the hills north-west of {area:321}."] = "",

	-- Step 14: Witherbark Village
	["The Witherbark trolls hold the village in the south-eastern hills. Axe Throwers guard the outer huts; the Witch Doctors and Headhunters hold the heart of the village."] = "",

	-- Step 15: Fleshstalker raptors
	["Fleshstalker raptors"] = "",
	-- {area:316} Boulderfist Hall
	-- plural, as words: Highland Fleshstalkers = {npc:2561} Highland Fleshstalker
	["Highland Fleshstalkers (36-37) hunt the southern highlands, a pack north of {area:316} and another on the plain to its west. Pull them one at a time."] = "",

	-- Step 16: Faldir's Cove
	-- {npc:2766} Lolo the Lookout
	["Ride south-west to the goblins' cove on the southern coast. {npc:2766} keeps watch on the cliff above it."] = "",

	-- Step 17: Professor Phizzlethorpe
	["Escort the professor down to the shore. Two Daggerspine naga ambush him on the way: stay close."] = "",

	-- Step 19: Daggerspine shore
	["Daggerspine shore"] = "",
	-- plural, as words: Daggerspine Raiders = {npc:2595} Daggerspine Raider
	["West of the cove the Daggerspine Raiders and Sorceresses (38-40) hold the shore: pull them one at a time. The two wrecks lie in the shallows off it, the charts and logs inside them; the gems lie on the sea floor around the wrecks."] = "",

	-- Step 20: Faldir's Cove
	-- {npc:2487} Fleet Master Seahorn · {area:35} Booty Bay
	["for {npc:2487} in {area:35}, around level 44"] = "",

	-- Step 21: The Stone of Outer Binding
	-- {object:2690} Stone of Outer Binding
	["The {object:2690}"] = "",
	["Ride north; the outer circle stands in the middle of the highlands."] = "",

	-- Step 22: Northfold Manor
	-- plural, as words: Bloodstone Amulets = {item:4495} Bloodstone Amulet
	["The Syndicate hold the walled manor and its farm in the north-west; their Highwaymen, Mercenaries and Pathstalkers carry the Bloodstone Amulets."] = "",

	-- Step 23: The Stone of West Binding
	-- {object:2689} Stone of West Binding
	["The {object:2689}"] = "",
	-- {area:1857} Thoradin's Wall
	["The western circle is near {area:1857}, where you rode in."] = "",

	-- Step 24: The Stone of Inner Binding
	-- {object:2702} Stone of Inner Binding
	["The {object:2702}"] = "",
	["The inner circle lies south of the western circle, east of Stromgarde."] = "",
	["The stone's next task needs Fozruk, a level 42 elite: leave it."] = "",

	-- Step 25: Back to Hammerfall
	-- {area:321} Hammerfall
	["Back to {area:321}"] = "",

	-- Step 26: Boulderfist Hall
	-- {area:321} Hammerfall
	-- plural, as words: Boulderfist Brutes = {npc:2566} Boulderfist Brute
	["The Boulderfist Brutes camp outside the ogres' hall south of {area:321}; the Magus stand among them. Pull them one at a time."] = "",

	-- Step 27: Drum Fel
	-- {npc:2771} Drum Fel · {quest:678} Call to Arms
	["{npc:2771}'s next {quest:678} is against Boulderfist elites: leave it."] = "",

	-- Step 28: Into the Badlands
	-- {zone:1418} Badlands
	["Into the {zone:1418}"] = "",
	-- {area:880} Thandol Span · {zone:1437} Wetlands · {area:150} Menethil Harbor · {zone:1432} Loch Modan · {zone:1418} Badlands · {area:1877} Valley of Fangs
	["Ride south-west out of Arathi over {area:880}, south through the {zone:1437} (keep clear of {area:150}) and east into {zone:1432}; the road leaves {zone:1432} to the south into the {zone:1418}. Follow it south to the goblin camp in the {area:1877}."] = "",

	-- Step 29: Valley of Fangs
	-- {quest:1106} Martek the Exiled · {area:439} The Shimmering Flats
	["{quest:1106}: Fizzle's letter from the {area:439}"] = "",

	-- Step 30: The Dustbowl
	-- {area:1878} The Dustbowl · {area:340} Kargath
	["Ride west along the road; Lotwil's camp sits in the {area:1878} halfway to {area:340}."] = "",

	-- Step 31: Kargath
	-- {area:340} Kargath
	["{area:340} is the Horde fortress built into the cliffs at the zone's western edge."] = "",
	-- {area:75} Stonard
	["for Helgrum in {area:75}, around level 42"] = "",

	-- Step 32: Lesser Rock Elementals
	-- plural, as words: Lesser Rock Elementals = {npc:2735} Lesser Rock Elemental · Rock Elementals = {npc:92} Rock Elemental
	["Lesser Rock Elementals"] = "",
	-- {npc:92} Rock Elemental
	["The small elementals drift across the flats just west of Lotwil's camp. Every rock elemental in the zone can drop Jarkal's {npc:92} Shards: keep them."] = "",

	-- Step 34: Rock Elementals
	-- plural, as words: Rock Elementals = {npc:92} Rock Elemental
	["Rock Elementals"] = "",
	-- {area:1878} The Dustbowl
	-- plural, as words: Rock Elementals = {npc:92} Rock Elemental
	["The bigger Rock Elementals stand on the slopes north-west of the {area:1878}; each one drops a slab."] = "",

	-- Step 36: Coyotes and buzzards
	["Coyotes and buzzards"] = "",
	-- {area:1878} The Dustbowl
	-- plural, as words: Elder Crag Coyotes = {npc:2729} Elder Crag Coyote · Crag Coyotes = {npc:2727} Crag Coyote · Giant Buzzards = {npc:2831} Giant Buzzard
	["The Elder Crag Coyotes and Giant Buzzards roam the basin south of the {area:1878}. Coyotes drop both the jawbones and the fangs; only the buzzards drop wings and gizzards."] = "",

	-- Step 37: Greater Rock Elementals
	-- plural, as words: Greater Rock Elementals = {npc:2736} Greater Rock Elemental · Rock Elementals = {npc:92} Rock Elemental
	["Greater Rock Elementals"] = "",
	-- plural, as words: Greater Rock Elementals = {npc:2736} Greater Rock Elemental · Rock Elementals = {npc:92} Rock Elemental
	["The Greater Rock Elementals (42-44, well above you) wander the gulches in the south-west; the bracers drop about one kill in five. Pull one at a time and rest between fights, or leave them. Keep killing coyotes and buzzards you still need on the way."] = "",

	-- Step 38: Kargath
	-- {area:340} Kargath
	["Ride north back to {area:340}."] = "",

	-- Step 39: The Dustbowl
	-- {npc:2920} Lucien Tosselwrench · {item:2868} Patterned Bronze Bracers · {skill:164} Blacksmithing
	["{npc:2920}: only if you carry {item:2868} ({skill:164} or the Auction House)"] = "",

	-- Step 41: Stonevault troggs
	["Stonevault troggs"] = "",
	-- {area:1877} Valley of Fangs · {area:345} Agmond's End
	["The Stonevault troggs dig around the cave mouths south of the {area:1877}, on the way to {area:345}; the Bonesnappers and Shamans drop the flakes."] = "",

	-- Step 42: Agmond's End
	-- {area:345} Agmond's End · {area:1877} Valley of Fangs
	["Theldurin sits among the dwarven ruins at {area:345}, south of the {area:1877}."] = "",

	-- Step 43: Valley of Fangs
	["Follow the road north; Martek's camp is on the way."] = "",

	-- Step 44: Ancient Chest
	-- {area:1517} Uldaman
	["Keep north on the road; the chest lies in the {area:1517} dig site, at the foot of the ruins north-west of the road."] = "",

	-- Step 45: Agmond's End
	-- {area:1877} Valley of Fangs
	["Ride back south down the road, past the {area:1877}."] = "",

	-- Step 46: Hearth to Kargath
	-- {area:340} Kargath
	["Hearth to {area:340}"] = "",

	-- Step 47: Zeppelin to Orgrimmar
	-- {zone:1454} Orgrimmar
	["Zeppelin to {zone:1454}"] = "",
	-- {zone:1454} Orgrimmar · {object:3202} Grom'gol
	["Take the {zone:1454} zeppelin from the tower on the west side of {object:3202}."] = "",
	["Zeppelin tower"] = "",

	-- Step 49: Thunder Bluff
	-- {area:1638} Thunder Bluff · {zone:1454} Orgrimmar · {npc:3033} Turak Runetotem · {area:1639} Elder Rise · {npc:246344} Alodan the Hopeful · {area:380} The Crossroads
	["Your trainer is in {area:1638}, one flight from {zone:1454}: {npc:3033} (Druids) on {area:1639}, {npc:246344} (Paladins). Fly on to the {area:380} from there."] = "",

	-- Step 51: Regthar Deathgate
	-- {area:380} The Crossroads · {area:386} The Forgotten Pools
	["Ride north up the road from the {area:380} to the {area:386}; Regthar keeps watch on the rise above the water."] = "",
	-- {npc:5395} Felgur Twocuts · {zone:1443} Desolace
	["for {npc:5395} in {zone:1443}, in the next guide"] = "",

	-- Step 52: Ratchet
	-- {area:380} The Crossroads · {area:392} Ratchet
	["Ride back south to the {area:380} and fly to {area:392}."] = "",
	-- {item:3713} Soothing Spices · {zone:1445} Dustwallow Marsh
	["{item:3713}, for \"Swamp Eye\" Jarl in {zone:1445}"] = "",
	-- {zone:1445} Dustwallow Marsh
	["The next guide heads into {zone:1445}."] = "",

	-- Step 53: The Affray
	-- {area:392} Ratchet · {area:720} Fray Island · {npc:6236} Klannoc Macleod · {npc:6238} Big Will
	["Ride south along the coast from {area:392} to {area:720}. {npc:6236} stands by the arena: step on the grate to start the fight; the challengers come one at a time, then {npc:6238} (33)."] = "",
	-- {npc:6236} Klannoc Macleod
	["{npc:6236}: Berserker Stance"] = "",
}
