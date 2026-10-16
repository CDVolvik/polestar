-- Korean (koKR): the guide forever/collectibles/pets/jeremiah-payson (forever/collectibles/pets/jeremiah-payson.guide).
-- Written by `node tools/polestar.js i18n guides sync koKR`, which keeps every translation (docs/TRANSLATING.md, "Guide texts").
-- Translate the right-hand sides; "" shows the English. Keep each {kind:id} as it is: the game shows its
-- name there in Korean (the English is listed above the line). A name the English has in the plural, as words,
-- may be written with the singular's token from its "plural, as words" line: "Bandidos ({npc:251918})", "{npc:251918} ×8".
-- The comments are rewritten by sync.
return {
	-- Guide
	-- {npc:8403} Jeremiah Payson
	["{npc:8403}'s Cockroaches"] = "{npc:8403}의 바퀴벌레",

	-- Step 1: Jeremiah Payson
	-- {npc:8403} Jeremiah Payson · {zone:1458} Undercity
	["{npc:8403} sells three cockroaches in the {zone:1458} (50s each); the Plagued and Undercity Cockroaches are new in Forever. Each pet item teaches its companion when you use it; the goals stay ticked afterwards."] = "",
	-- {item:10393} Cockroach
	["{item:10393}, 50s"] = "{item:10393}, 50실버",
	["50s"] = "50실버",

	-- No longer in the guide (its English changed or it went away): reuse or delete.
	-- ["{npc:8403} sells three cockroaches in the {zone:1458} (50s each); the Plagued and {zone:1458} Cockroaches are new in Forever. Each pet item teaches its companion when you use it; the goals stay ticked afterwards."] = "{npc:8403}이(가) {zone:1458}에서 바퀴벌레 세 종류를 판매합니다(각 50실버). 역병 걸린 바퀴벌레와 {zone:1458} 바퀴벌레는 Forever에 새로 추가되었습니다. 애완동물 아이템을 사용하면 해당 동물을 배우며, 목표는 그 후에도 체크된 상태로 남습니다.",
}
