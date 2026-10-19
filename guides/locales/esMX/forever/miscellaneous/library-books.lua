-- Spanish (Latin America) (esMX): the guide forever/miscellaneous/library-books (forever/miscellaneous/library-books.guide).
-- Written by `node tools/polestar.js i18n guides sync esMX`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Spanish (Latin America) (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- A token marked "no name in this language" would show in English: write that name in Spanish (Latin America) words instead.
-- The comments are rewritten by sync.
return {
	-- Guide
	-- plural, as words: Library Books = {object:386691} Library Book
	["Library Books"] = "",
	-- {quest:78150} Friend of the Library
	["Lost books and scrolls all over the world: each pays experience at the library, and enough of them earn a {quest:78150} reward."] = "",

	-- Step 1: Elwynn Forest
	-- {area:91} Tower of Azora · {area:87} Goldshire
	["Halfway up the {area:91}, east of {area:87}. Nothing hostile inside."] = "",

	-- Step 2: Westfall
	-- {area:20} Moonbrook · {area:108} Sentinel Hill
	["Two books: one in a house at {area:20}, one at {area:108} (Alliance only)."] = "",
	["Rumi of Gnomeregan"] = "",

	-- Step 3: Duskwood
	-- {area:2098} Dawning Wood Catacombs · {zone:1431} Duskwood
	["The spellbook lies in the {area:2098}, the crypt in north-western {zone:1431}. Undead fill it; a corpse run works if you are low."] = "",

	-- Step 4: Stranglethorn Vale
	-- {area:310} Crystalvein Mine
	["On a bench beside the {area:310} entrance, in the middle of the zone."] = "",

	-- Step 5: Swamp of Sorrows
	-- {area:1477} Temple of Atal'Hakkar
	["On the top walkway of the {area:1477}, outside the dungeon."] = "",

	-- Step 7: Blackrock Mountain
	-- {area:254} Blackrock Mountain · {npc:8888} Franclorn Forgewright · {npc:14387} Lothos Riftwaker
	["Inside {area:254}, not in a dungeon: the book lies on the altar in {npc:8888}'s tomb, near {npc:14387}. The waypoint marks the mountain."] = "",

	-- Step 8: Searing Gorge
	["On a table inside a tent near the middle of the zone."] = "",

	-- Step 9: Badlands
	["Inside a crypt near the middle of the zone, reached from the path to its south."] = "",

	-- Step 10: Loch Modan
	-- {area:144} Thelsamar · {area:108} Sentinel Hill
	["Scrolls in the Mo'grosh ogre cave in the north-east. The ogres in the cave are level 18-19 elites: grouping up is advised. (Rumi of Gnomeregan also lies in {area:144}, if you missed it at {area:108}.)"] = "",

	-- Step 13: Arathi Highlands
	["Beside a tent entrance in the troll village in south-eastern Arathi."] = "",

	-- Step 17: Tirisfal Glades
	-- {area:159} Brill
	["On a shelf in {area:159}'s apothecary."] = "",

	-- Step 18: Darkshore
	-- {area:443} Ruins of Mathystra · {zone:1439} Darkshore
	["Down the stairs at the {area:443} in northern {zone:1439}."] = "",

	-- Step 19: Azshara
	-- {area:1236} Haldarr Encampment · {zone:1447} Azshara
	["On a crate in the {area:1236}, in the far west of {zone:1447}."] = "",

	-- Step 20: Orgrimmar
	-- {object:172961} Valley of Spirits
	["The Mural of Ta'zo is the stone tablet leaning against the wall in the {object:172961}, on the way to the mage trainers. Use it to take the book."] = "",

	-- Step 21: The Barrens
	-- {area:718} Wailing Caverns · {area:382} Sludge Fen · {area:392} Ratchet
	["Three books: scrolls outside the {area:718} entrance, the manual in the control room at the top of the oil rig at the {area:382}, and the Goblin Tome beside Gazlowe in {area:392}."] = "",

	-- Step 22: Stonetalon Mountains
	-- {area:2537} Grimtotem Post
	["On a barrel in a tent at {area:2537}, in the far south-east of the zone."] = "",

	-- Step 24: Thousand Needles
	-- {area:2097} Darkcloud Pinnacle
	["Inside a hut on the {area:2097} mesa."] = "",

	-- Step 25: Dustwallow Marsh
	["On the ground at the eastern side of the murloc camp in north-eastern Dustwallow."] = "",

	-- Step 26: Tanaris
	["On a bookshelf in the middle building of the pirate camp on the eastern coast."] = "",

	-- Step 27: Garion Wendell
	-- {npc:211033} Garion Wendell · {object:2101} Mage Quarter
	["{npc:211033} keeps the library in the {object:2101}. He offers each book's quest while the book is in your bags: take it and hand it in, one at a time, so your quest log stays free. Skip the books you did not find."] = "",

	-- Step 28: Owen Thadd
	-- {npc:211022} Owen Thadd · {object:36082} Magic Quarter
	["{npc:211022} keeps the library in the {object:36082}. He offers each book's quest while the book is in your bags: take it and hand it in, one at a time, so your quest log stays free. Skip the books you did not find."] = "",

	-- Step 29: Friend of the Library
	-- {quest:78150} Friend of the Library
	["Once enough books are in, the librarian offers {quest:78150}. Take it when it appears."] = "",

	-- Step 30: Greater Friend of the Library
	-- {npc:211033} Garion Wendell · {quest:79536} Greater Friend of the Library
	["From level 20, with more books handed in, {npc:211033} offers {quest:79536}."] = "",

	-- Step 31: The second Greater Friend of the Library
	-- {quest:82208} Greater Friend of the Library
	["The second {quest:82208}"] = "",
	-- {npc:211033} Garion Wendell · {quest:82208} Greater Friend of the Library
	["From level 30, with more books still, {npc:211033} offers the second {quest:82208}."] = "",
}
