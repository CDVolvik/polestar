-- Russian (ruRU): the guide forever/class/warrior/brutal-armor (forever/class/warrior/brutal-armor.guide).
-- Written by `node tools/polestar.js i18n guides sync ruRU`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Russian (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Guide
	["Four armor pieces at 30 (hauberk, helm, gauntlets, legguards) and a shield on the way."] = "Четыре части доспехов на 30-м уровне (хауберк, шлем, рукавицы, поножи), а по пути еще и щит.",

	-- Step 1: Speak with Ruga (Orgrimmar)
	-- {npc:3354} Sorek · {object:172958} Valley of Honor · {npc:6394} Ruga Ragetotem · {area:378} Camp Taurajo
	["At 20, {npc:3354} in the {object:172958} sends you to {npc:6394} in {area:378}."] = "На 20-м уровне {npc:3354} ({object:172958}) отправляет вас к NPC {npc:6394} ({area:378}).",

	-- Step 2: Speak with Ruga (Thunder Bluff)
	-- {npc:3041} Torm Ragetotem · {zone:1456} Thunder Bluff · {npc:6394} Ruga Ragetotem · {area:378} Camp Taurajo
	["At 20, {npc:3041}, the warrior trainer of {zone:1456}, sends you to {npc:6394} in {area:378}."] = "На 20-м уровне {npc:3041}, учитель воинов ({zone:1456}), отправляет вас к NPC {npc:6394} ({area:378}).",

	-- Step 3: Speak with Ruga (Undercity)
	-- {npc:4595} Baltus Fowler · {zone:1458} Undercity · {npc:6394} Ruga Ragetotem · {area:378} Camp Taurajo
	["At 20, {npc:4595}, a warrior trainer of the {zone:1458}, sends you to {npc:6394} in {area:378}."] = "На 20-м уровне {npc:4595}, учитель воинов ({zone:1458}), отправляет вас к NPC {npc:6394} ({area:378}).",

	-- Step 4: Trial at the Field of Giants
	-- {area:378} Camp Taurajo · {area:390} Field of Giants
	-- plural, as words: Silithid Mounds = {object:3685} Silithid Mound
	["Fly to {area:378}. South of the camp the Silithid Mounds dot the {area:390}: the silithid there carry the Twitching Antennae."] = "Летите сюда: {area:378}. К югу от лагеря по местности {area:390} разбросаны холмы силитидов: силитиды там носят дергающиеся усики.",
	["Twitching Antennae from the silithid"] = "Дергающиеся усики с силитидов",

	-- Step 5: Thun'grim Firegaze
	-- {area:380} The Crossroads · {quest:1838} Brutal Armor
	["Thun'grim camps beside the road east of the {area:380}. {quest:1838} is a level 30 quest; you can take it now and gather for it on the way."] = "Тун'грим разбил лагерь у дороги к востоку от места {area:380}. {quest:1838} — задание 30-го уровня; можно взять его сейчас и собирать нужное по пути.",

	-- Step 6: Roogug in Razorfen Kraul
	-- {area:1717} Razorfen Kraul
	["Roogug in {area:1717}"] = "Ругуг. Локация: {area:1717}",
	-- {area:1717} Razorfen Kraul · {zone:1413} The Barrens · {item:6841} Vial of Phlogiston
	["Roogug is an elite quilboar inside {area:1717}, the dungeon at the south end of the {zone:1413}; he drops the {item:6841}. {area:1717} is a dungeon: grouping up is advised."] = "Ругуг — элитный свинобраз в подземелье {area:1717} на южной окраине зоны {zone:1413}; он оставляет {item:6841}. {area:1717} — подземелье: лучше собрать группу.",
	-- {item:6841} Vial of Phlogiston
	["{item:6841}, from Roogug"] = "{item:6841} с Ругуга",

	-- Step 7: Windshear Mine
	-- {area:2160} Windshear Mine · {area:461} Windshear Crag
	-- plural, as words: Smoky Iron Ingots = {item:7126} Smoky Iron Ingot
	["The {area:2160} lies at the east end of {area:461} in Stonetalon. Its kobolds drop the Smoky Iron Ingots."] = "{area:2160} находится в восточной части места {area:461} в Когтистых горах. Кобольды там оставляют закопченые железные слитки.",
	-- plural, as words: Smoky Iron Ingots = {item:7126} Smoky Iron Ingot
	["Smoky Iron Ingots from the Windshear kobolds"] = "Закопченые железные слитки с кобольдов из племени Ветрорезов",

	-- Step 8: Hillsbrad Miners
	-- {area:287} Hillsbrad
	["{area:287} Miners"] = "Хилсбрадские шахтеры ({area:287})",
	-- {area:287} Hillsbrad · {zone:1424} Hillsbrad Foothills · {item:7127} Powdered Azurite · {zone:1454} Orgrimmar · {zone:1420} Tirisfal Glades · {zone:1421} Silverpine Forest
	["The {area:287} Miners work the mine in the west of {zone:1424}; they drop the {item:7127}. Take the zeppelin from {zone:1454} to {zone:1420} and ride south through {zone:1421}."] = "Хилсбрадские шахтеры ({area:287}) работают в шахте на западе зоны {zone:1424}; они оставляют {item:7127}. Сядьте на дирижабль из города {zone:1454} до зоны {zone:1420} и скачите на юг через зону {zone:1421}.",
	-- {item:7127} Powdered Azurite · {area:287} Hillsbrad
	["{item:7127} from the {area:287} Miners"] = "{item:7127} с хилсбрадских шахтеров ({area:287})",

	-- Step 9: Iron Bars
	-- plural, as words: Iron Bars = {item:3575} Iron Bar
	["Iron Bars"] = "Железные слитки",
	-- {item:2772} Iron Ore · {skill:186} Mining · {zone:1454} Orgrimmar
	-- plural, as words: Iron Bars = {item:3575} Iron Bar
	["Miners smelt Iron Bars from {item:2772} ({skill:186} 125); everyone else buys them at the auction house in {zone:1454}."] = "Шахтеры выплавляют железные слитки из руды ({item:2772}, {skill:186} 125); остальные покупают их на аукционе ({zone:1454}).",
	-- {npc:8673} Auctioneer Thathung
	-- plural, as words: Iron Bars = {item:3575} Iron Bar
	["Iron Bars: {npc:8673}"] = "Железные слитки: {npc:8673}",

	-- Step 10: Brutal Hauberk
	-- {area:380} The Crossroads · {quest:1848} Brutal Hauberk
	["Back to Thun'grim beside the road east of the {area:380}. {quest:1848} is the first piece; he then sends you to three crafters for the rest."] = "Вернитесь к Тун'гриму у дороги к востоку от места {area:380}. {quest:1848} — первая часть; затем он отправляет вас к трем мастерам за остальным.",

	-- Step 11: Ula'elek
	-- {npc:6408} Ula'elek · {area:367} Sen'jin Village · {zone:1411} Durotar
	["{npc:6408} is in {area:367} on the {zone:1411} coast."] = "{npc:6408} находится здесь: {area:367}, на побережье зоны {zone:1411}.",

	-- Step 12: Satyr Hooves
	-- {area:429} Xavian · {zone:1440} Ashenvale · {quest:1842} Satyr Hooves
	["The {area:429} satyrs camp in eastern {zone:1440}, with the Felmusk satyrs further west; both drop Uncloven {quest:1842}."] = "Сатиры из племени Ксавиан ({area:429}) живут на востоке зоны {zone:1440}, а сатиры из племени Мускуса Скверны — западнее; и те и другие оставляют нераздвоенные копыта сатиров ({quest:1842}).",
	-- {quest:1842} Satyr Hooves
	["Uncloven {quest:1842}"] = "Нераздвоенные копыта ({quest:1842})",

	-- Step 15: Chimaeric Horn
	-- {npc:6167} Chimaera Matriarch · {item:6840} Galvanized Horn
	-- plural, as words: Young Chimaeras = {npc:4032} Young Chimaera
	["The {npc:6167} roams the south-west of Stonetalon near the Fledgling and Young Chimaeras; she drops the {item:6840}."] = "{npc:6167} бродит на юго-западе Когтистых гор рядом с химерами-слетками и молодыми химерами; она оставляет {item:6840}.",
	-- {item:6840} Galvanized Horn · {npc:6167} Chimaera Matriarch
	["{item:6840} from the {npc:6167}"] = "{item:6840}: {npc:6167}",

	-- Step 17: Velora Nitely
	-- {zone:1454} Orgrimmar · {zone:1420} Tirisfal Glades · {zone:1458} Undercity · {area:153} Ruins of Lordaeron
	["Take the zeppelin from {zone:1454} to {zone:1420}; the {zone:1458} lies below the {area:153}."] = "Сядьте на дирижабль из города {zone:1454} до зоны {zone:1420}; город {zone:1458} находится под местом {area:153}.",

	-- Step 18: Dragonmaw Shinbones
	-- {zone:1437} Wetlands · {quest:1846} Dragonmaw Shinbones
	-- plural, as words: Sturdy Dragonmaw Shinbones = {item:7134} Sturdy Dragonmaw Shinbone
	["The Dragonmaw orcs camp in the middle of the {zone:1437}, south of the road; Raiders, Swamprunners, Centurions, Shadowwarders and Bonewarders all drop the Sturdy {quest:1846}."] = "Орки клана Драконьей Пасти стоят лагерем в центре зоны {zone:1437}, к югу от дороги; налетчики, болотные бегуны, центурионы, хранители теней и костостражи — все оставляют прочные берцовые кости ({quest:1846}).",
	-- {quest:1846} Dragonmaw Shinbones
	-- plural, as words: Sturdy Dragonmaw Shinbones = {item:7134} Sturdy Dragonmaw Shinbone
	["Sturdy {quest:1846}"] = "Прочные берцовые кости ({quest:1846})",
}
