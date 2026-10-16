-- Russian (ruRU): the guide forever/alliance/30-40/02-desolace (forever/alliance/30-40/02-desolace.guide).
-- Written by `node tools/polestar.js i18n guides sync ruRU`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Russian (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Step 1: Menethil Harbor
	-- {zone:1455} Ironforge · {npc:1573} Gryth Thurden
	["From {zone:1455}'s {npc:1573}"] = "У NPC {npc:1573} ({zone:1455})",

	-- Step 2: Auberdine
	-- {area:442} Auberdine · {npc:3649} Thundris Windweaver
	["Take the boat to {area:442} from Menethil's docks. {npc:3649} stands in {area:442}, north of the flight master."] = "Сядьте на корабль в порту (Гавань Менетилов). Цель: {area:442}. {npc:3649} стоит там ({area:442}) к северу от распорядителя полетов.",
	-- {npc:3649} Thundris Windweaver · {item:279915} Nord'el
	["{npc:3649}: {item:279915}, from Sylessa in Menethil"] = "{npc:3649}: {item:279915} от Силессы (Гавань Менетилов)",

	-- Step 3: Heartswood
	-- {area:415} Astranaar · {quest:1738} Heartswood · {area:413} Maestra's Post · {quest:65602} What Is Love? · {item:190309} Wooden Figurine · {area:1276} The Talondeep Path
	["From {area:415} ride north-west into the hills: the {quest:1738} is a glowing tree north of the road to {area:413}. If you took {quest:65602}, the {item:190309} lies in a house among the trees north of {area:413} (26.6,22.0). Then back past {area:415} to the {area:1276}."] = "От места {area:415} езжайте на северо-запад в холмы: {quest:1738} – это светящееся дерево к северу от дороги к месту {area:413}. Если вы взяли задание {quest:65602}, {item:190309} лежит в доме среди деревьев к северу (ориентир: {area:413}) (26.6,22.0). Затем назад мимо места {area:415}. Цель: {area:1276}.",
	-- {item:190309} Wooden Figurine · {area:413} Maestra's Post
	["{item:190309}, north of {area:413}"] = "{item:190309}, к северу (ориентир: {area:413})",

	-- Step 4: The Talondeep Path
	-- {area:415} Astranaar · {area:1276} The Talondeep Path
	["From {area:415} head south-west to the {area:1276}, a tunnel through the mountains into Stonetalon."] = "От места {area:415} идите на юго-запад. Цель: {area:1276} – туннель сквозь горы в Когтистые горы.",

	-- Step 5: Nijel's Point
	-- {area:460} Sun Rock Retreat · {area:465} The Charred Vale · {zone:1443} Desolace · {area:608} Nijel's Point
	["Follow the road west past {area:460} (Horde) and south-west through the {area:465} into {zone:1443}; {area:608} stands at the top of the pass."] = "Идите по дороге на запад мимо места {area:460} (Орда) и на юго-запад через {area:465} в зону {zone:1443}; {area:608} – на вершине перевала.",

	-- Step 6: Sargeron
	-- {area:603} Sargeron · {area:608} Nijel's Point
	["The Hatefury satyrs hold the ruins of {area:603}, east of {area:608}."] = "Сатиры из племени Ярой Ненависти занимают руины ({area:603}) к востоку (ориентир: {area:608}).",

	-- Step 8: Malem chest
	["Malem chest"] = "Сундук Малема",
	-- {area:608} Nijel's Point
	["The chest lies in the ruins south-west of {area:608}."] = "Сундук лежит в руинах к юго-западу (ориентир: {area:608}).",

	-- Step 10: Azore Aldamort
	-- {area:599} Thunder Axe Fortress
	["Azore's tower stands on the hill west of {area:599}: take his quest first, the sceptre he wants is in the fortress."] = "Башня Азора стоит на холме к западу (ориентир: {area:599}): сначала возьмите его задание – нужный ему скипетр находится в крепости.",

	-- Step 11: Dalinda Malem
	-- {spell:1294269} Burning Blade · {area:608} Nijel's Point
	["Dalinda hides inside the {spell:1294269}'s fortress south-west of {area:608}."] = "",

	-- Step 12: Tyranis and the Seer
	["Tyranis and the Seer"] = "Тиранис и Провидец",
	-- {spell:1294269} Burning Blade · {npc:13019} Burning Blade Seer
	["Her brother Tyranis (36) walks the fortress with the {spell:1294269} cultists (30-33): pull him alone. The {npc:13019} keeps the sceptre in the fortress's main building."] = "",

	-- Step 13: Escort Dalinda
	["Escort Dalinda"] = "Сопроводите Далинду",
	-- {area:599} Thunder Axe Fortress
	["Out of {area:599}"] = "Выход наружу: {area:599}",
	-- {area:608} Nijel's Point
	["Lead Dalinda out of the fortress; she walks off once you are clear of it. Vahlarriel takes the turn-in at {area:608} at the end of the guide."] = "Выведите Далинду из крепости; когда вы выберетесь, она уйдет сама. Задание принимает Валлариель ({area:608}) в конце гайда.",

	-- Step 15: Scorpashi venom
	["Scorpashi venom"] = "Яд скорпаши",
	-- {area:2407} Kormek's Hut
	["The Scorpashi scorpids hunt the hills around {area:2407} on the road south."] = "Скорпиды скорпаши охотятся на холмах вокруг места {area:2407} на дороге к югу.",

	-- Step 16: Cork Gizelton
	-- {area:2407} Kormek's Hut
	["The Gizelton Caravan waits at {area:2407}."] = "Караван Гизлтона ждет здесь: {area:2407}.",

	-- Step 17: Escort the caravan
	["Escort the caravan"] = "Сопроводите караван",
	-- {area:609} Kolkar Village · {area:2617} Scrabblescrew's Camp
	["Walk with the caravan south past {area:609}; Kolkar ambushers jump it on the way. Stay close until it stops at {area:2617}. The ambushers are 34-35 and come in waves: skip it if you are below 33."] = "Идите с караваном на юг мимо места {area:609}; по пути на него нападают душители из племени Колкар. Держитесь рядом, пока он не остановится ({area:2617}). Душители 34-35-го уровня нападают волнами: если ваш уровень ниже 33, пропустите это задание.",

	-- Step 18: Smeed Scrabblescrew
	-- {area:609} Kolkar Village · {area:596} Kodo Graveyard
	["Smeed's camp is on the road south of {area:609}, by the {area:596}."] = "Лагерь Смида – на дороге к югу (ориентир: {area:609}), у места {area:596}.",

	-- Step 19: Kodo Graveyard
	-- {item:13892} Kodo Kombobulator · {npc:4700} Aged Kodo
	-- plural, as words: Aged Kodos = {npc:4700} Aged Kodo
	["Use Smeed's {item:13892} on an {npc:4700} and walk the tamed kodo back to his camp, five times; Aged Kodos also drop the hides."] = "Используйте {item:13892} Смида на цели {npc:4700} и приведите прирученного кодо к его лагерю – пять раз; шкуры падают и со старых кодо.",

	-- Step 21: Kolkar Village
	-- {area:609} Kolkar Village · {npc:5752} Corporal Melkins
	["The Kolkar roam the plains around {area:609}; their ears are for {npc:5752}."] = "Кентавры из племени Колкар бродят по равнинам вокруг места {area:609}; их уши – для NPC {npc:5752}.",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["Dalinda hides inside the Burning Blade's fortress south-west of {area:608}."] = "Далинда прячется в крепости клана Пылающего Клинка к юго-западу (ориентир: {area:608}).",
	-- ["Her brother Tyranis (36) walks the fortress with the Burning Blade cultists (30-33): pull him alone. The {npc:13019} keeps the sceptre in the fortress's main building."] = "Ее брат Тиранис (36) ходит по крепости с культистами клана Пылающего Клинка (30-33): выманите его одного. {npc:13019} хранит скипетр в главном здании крепости.",
}
