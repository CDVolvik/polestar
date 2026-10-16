-- Korean (koKR): the guide forever/class/priest/benediction (forever/class/priest/benediction.guide).
-- Written by `node tools/polestar.js i18n guides sync koKR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Korean (the English is listed above the line). The comments are rewritten by sync.
return {
	-- Guide
	-- {item:18608} Benediction
	["{item:18608} and Anathema"] = "{item:18608} 및 저주의 지팡이",
	-- {item:18608} Benediction
	["Eris's splinter and the two Eyes make {item:18608}, the epic priest staff that turns into Anathema."] = "에리스의 조각과 두 개의 눈으로 {item:18608}을(를) 만듭니다. 저주의 지팡이로 변하는 사제 영웅 지팡이입니다.",

	-- Step 1: The Eye of Shadow
	-- {item:18646} The Eye of Divinity · {object:179703} Cache of the Firelord · {npc:12018} Majordomo Executus · {area:2717} Molten Core · {item:18665} The Eye of Shadow · {npc:12397} Lord Kazzak
	-- plural, as words: Doomguard Commanders = {npc:12396} Doomguard Commander
	["You need {item:18646} first: it comes from the {object:179703} after {npc:12018} in {area:2717}. {item:18665} drops from elite demons ({npc:12397}, a world boss, always; Doomguard Commanders and Manahounds rarely); it binds when equipped, so buying one works too."] = "먼저 {item:18646}이(가) 필요합니다. {area:2717}에서 {npc:12018} 처치 후 나오는 {object:179703}에서 얻습니다. {item:18665}은(는) 정예 악마에게서 떨어집니다(필드 우두머리 {npc:12397}은(는) 항상, 파멸의수호대 사령관과 마나사냥개는 드물게). 착용 시 귀속이므로 구매해도 됩니다.",

	-- Step 2: Eris Havenfire
	-- {item:18646} The Eye of Divinity · {npc:14494} Eris Havenfire · {zone:1423} Eastern Plaguelands · {item:8956} Oil of Immolation
	-- plural, as words: Major Mana Potions = {item:13444} Major Mana Potion · Mana Potions = {item:3827} Mana Potion
	["Equip {item:18646} to see {npc:14494}, a ghost on the mountainside in the north-west of the {zone:1423}. Come with full mana, Major Mana Potions and {item:8956}: if you fail, the event takes about two hours to return."] = "{item:18646}을(를) 착용하면 {zone:1423} 북서쪽 산비탈의 유령 {npc:14494}이(가) 보입니다. 마나를 가득 채우고 일급 마나 물약과 {item:8956}을(를) 챙겨 오십시오. 실패하면 이벤트가 다시 열리기까지 약 두 시간이 걸립니다.",

	-- Step 3: The Balance of Light and Shadow
	["Save 50 peasants before 15 die. Kill the skeletons that attack them, cure their diseases (the purple ones first) and heal the wounded with Renew. Friends may buff you beforehand but must stay out of the fight, or a demon appears and kills everyone."] = "농부 15명이 죽기 전에 50명을 구하십시오. 그들을 공격하는 해골을 처치하고, 질병을 치료하고(보라색부터), 부상자는 소생으로 치유하십시오. 친구들은 미리 강화 효과를 걸어 줄 수 있지만 전투에는 끼어들면 안 됩니다. 그러면 악마가 나타나 모두를 죽입니다.",

	-- Step 4: Benediction
	-- {item:18608} Benediction
	["With both Eyes in your bags: {item:18608}"] = "두 눈을 가방에 넣고: {item:18608}",
}
