-- Chinese (traditional) (zhTW): the guide forever/alliance/02-westfall (forever/alliance/02-westfall.guide).
-- Written by `node tools/polestar.js i18n guides sync zhTW`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Chinese (traditional) (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Step 1: Sentinel Hill
	-- {npc:234} Gryan Stoutmantle · {npc:821} Captain Danuvin · {npc:491} Quartermaster Lewis · {npc:878} Scout Galiaan · {npc:253092} Alba Fairmoon · {npc:523} Thor
	["{npc:234} and {npc:821} stand at the top of the stone tower. {npc:491} is in the tower, {npc:878} and {npc:253092} on the south side of the hill, next to the inn and {npc:523} the gryphon master."] = "",
	-- {npc:523} Thor
	["{npc:523}; skip the free flight it offers"] = "",

	-- Step 2: Saldean's Farm
	-- {npc:233} Farmer Saldean · {npc:253395} Ozwin Ironsprocket
	["Follow the road north. {npc:233} stands outside, Salma in the house, {npc:253395} in the barn to the west."] = "",

	-- Step 3: The Jansen Stead
	["Further north along the road. The Furlbrows sit by their burned farm. Collect the oats from the Sacks of Oats in the fields as you go and fill the vial at the stead's well."] = "",
	-- {item:1972} Westfall Deed
	["Only if you looted a {item:1972} in Elwynn: right-click it"] = "",
	["Fill the vial at the well"] = "",
	["Sacks of Oats"] = "",

	-- Step 4: Saldean's Farm
	-- plural, as words: Young Goretusks = {npc:454} Young Goretusk
	["Young Goretusks and Fleshrippers roam the fields around the farm: start on livers and the stew's meat on the way back."] = "",

	-- Step 5: The Molsen Farm
	-- {item:732} Okra · {item:255155} Precessive Autocognition Assembly · {npc:573} Foe Reaper 4000
	-- plural, as words: Harvest Watchers = {npc:114} Harvest Watcher
	["West of Saldean's. Harvest Watchers and Golems work the fields; they drop the isosprings, gyrostabilizers, {item:732} and sometimes a {item:255155}. {npc:573}, a level 20 rare, walks here: leave it alone. Keep killing Goretusks and Fleshrippers on every leg of this loop."] = "",
	["Fill the vial at the farm's well"] = "",
	-- plural, as words: Harvest Watchers = {npc:114} Harvest Watcher
	["Harvest Watchers"] = "",
	-- {item:729} Stringy Vulture Meat
	["{item:729}: Fleshrippers"] = "",

	-- Step 6: The Gold Coast Quarry
	-- {area:113} Gold Coast Quarry
	["The {area:113}"] = "",
	-- {area:918} The Molsen Farm
	-- plural, as words: Riverpaw Miners = {npc:1426} Riverpaw Miner
	["West of {area:918}, toward the coast. Riverpaw Miners work the quarry."] = "",
	-- plural, as words: Riverpaw Miners = {npc:1426} Riverpaw Miner
	["Riverpaw Miners"] = "",

	-- Step 7: Jangolode Mine
	-- {area:918} The Molsen Farm · {object:290} Furlbrow's Wardrobe
	-- plural, as words: Defias Trappers = {npc:504} Defias Trapper · Kobold Diggers = {npc:1236} Kobold Digger
	["North of {area:918}. Defias Trappers and Smugglers camp outside the mine, Kobold Diggers work inside. {object:290} stands by the ruined house east of the mine."] = "",
	-- plural, as words: Kobold Diggers = {npc:1236} Kobold Digger
	["Kobold Diggers"] = "",
	-- {quest:153} Red Leather Bandanas
	["{quest:153}: every Defias drops them"] = "",

	-- Step 8: The north coast
	["The north coast"] = "",
	-- plural, as words: Murloc Coastrunners = {npc:126} Murloc Coastrunner
	["Murloc Coastrunners and Raiders line the beach north of the mine. They flee at low health: pull one at a time."] = "",
	["Longshore Murloc Gills"] = "",

	-- Step 9: The gnoll hills
	["The gnoll hills"] = "",
	-- {area:916} The Jansen Stead
	-- plural, as words: Riverpaw Gnolls = {npc:117} Riverpaw Gnoll
	["Riverpaw Gnolls and Scouts roam the hills between the coast and the {area:916}."] = "",
	-- plural, as words: Gnoll Paws = {item:725} Gnoll Paw
	["Gnoll Paws"] = "",

	-- Step 11: Saldean's Farm
	["Only if he takes the isosprings alone"] = "",

	-- Step 13: The western farms
	["The western farms"] = "",
	-- {area:108} Sentinel Hill · {area:20} Moonbrook
	-- plural, as words: Defias Pillagers = {npc:589} Defias Pillager
	["Defias Pillagers and Looters hold the farms west of {area:108}, between the coast road and {area:20}."] = "",

	-- Step 15: Moonbrook and the Defias hills
	-- {area:20} Moonbrook
	["{area:20} and the Defias hills"] = "",
	-- {area:20} Moonbrook · {area:1581} The Deadmines
	-- plural, as words: Defias Pathstalkers = {npc:121} Defias Pathstalker
	["Defias Pathstalkers and Knuckledusters walk {area:20}; Highwaymen (level 17) patrol the hills south and east of it in pairs: pull them apart. {area:1581} entrance in the smithy is a group dungeon."] = "",
	-- {item:254676} Suspicious Industrial Supplies · {area:20} Moonbrook
	["{item:254676}, from the crates around {area:20}"] = "",

	-- Step 16: Back to Sentinel Hill
	-- {area:108} Sentinel Hill
	["Back to {area:108}"] = "",
	["Hearthstone on cooldown? Follow the road north-east."] = "",
	-- {npc:266} Wiley the Black · {area:69} Lakeshire
	["For {npc:266} in {area:69}, Redridge"] = "",
	-- {npc:11026} Sprite Jumpsprocket · {zone:1453} Stormwind City · {object:28027} Dwarven District
	["For {npc:11026} in {zone:1453}'s {object:28027}"] = "",

	-- Step 17: Defensive Stance
	["Defensive Stance"] = "",
	-- {zone:1453} Stormwind City · {npc:5480} Ilsa Corbin · {object:2100} Old Town · {npc:6089} Harry Burlguard · {npc:6090} Bartleby · {object:2152} Pig and Whistle Tavern
	["Fly or ride to {zone:1453}. {npc:5480} trains warriors in {object:2100}; {npc:6089} and {npc:6090} stand together by the {object:2152} there. {npc:6090} fights you for his mug."] = "",
	-- {npc:6089} Harry Burlguard
	["{npc:6089}: Defensive Stance"] = "",

	-- Step 18: High Priestess Laurena
	-- {zone:1453} Stormwind City · {npc:376} High Priestess Laurena
	["Fly or ride to {zone:1453}. {npc:376} is in the Cathedral of Light."] = "",

	-- Step 19: Shaman training
	["Shaman training"] = "",
	-- {zone:1453} Stormwind City · {area:2257} Deeprun Tram · {object:28027} Dwarven District · {zone:1455} Ironforge · {npc:258098} Eldrun Stormbreaker
	["Ride to {zone:1453}. It has no shaman trainer: take the {area:2257} from the {object:28027} to {zone:1455}, train with {npc:258098}, then ride the tram back for the boat."] = "",

	-- Step 20: Stormwind City
	-- {zone:1453} Stormwind City · {object:2100} Old Town · {object:2101} Mage Quarter · {object:23299} The Park · {npc:11026} Sprite Jumpsprocket · {object:28027} Dwarven District · {npc:279} Morgan Pestle · {object:2096} Trade District
	["Fly or ride to {zone:1453}. Trainers: {object:2100} (Warriors, Rogues), the Cathedral (Paladins, Priests), the {object:2101} (Mages, Warlocks), the {object:23299} (Druids). {npc:11026} works in the {object:28027}, {npc:279} in the {object:2096}."] = "",
	["Level 12, 14 and 16 spells"] = "",
	-- {item:2449} Earthroot · {zone:1439} Darkshore · {npc:1313} Maria Lumere · {skill:171} Alchemy
	["{item:2449} for Gathering the Cure (6123) in {zone:1439}: {npc:1313}, {skill:171} Supplies; herbalists pick it there instead"] = "",
	-- {npc:5497} Jennea Cannon · {quest:1861} Mirror Lake
	["{npc:5497}, Wizard's Sanctum: {quest:1861}"] = "",

	-- Step 21: Fishin' Time
	-- {npc:5494} Catherine Leland · {object:2096} Trade District · {npc:267118} Gilbert Gray
	["{npc:5494} sells fishing supplies along the canal just west of the {object:2096}; {npc:267118} fishes at the harbor, on the way to the boat."] = "",
	-- {item:6529} Shiny Bauble · {npc:5494} Catherine Leland
	["{item:6529}, from {npc:5494}"] = "",
}
