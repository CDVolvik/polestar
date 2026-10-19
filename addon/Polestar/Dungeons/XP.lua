-- How far a dungeon's quests take this character: every page quest for them
-- still to do, turned in in level order, from the lowest level they open at
-- when the character is below it (Core/Levels.lua does the sums; kills are
-- not counted here). The dungeon page's level chip and its tooltip read it
-- (UI/Dungeons.lua, UI/LevelTip.lua).
--
--   Dungeons.QuestXP(key[, p]) -> summary | nil (unknown dungeon)
--     p and summary: Levels.Run's

local ADDON, ns = ...
local Dungeons = ns.Dungeons

local ipairs, min = ipairs, math.min

local SIDE = { Alliance = "A", Horde = "H" }

function Dungeons.QuestXP(key, p)
	if not Dungeons.Get(key) then return nil end
	local Levels, C = ns.Levels, ns.Compat
	p = p or Levels.Player()
	local quests, start = {}, nil
	for _, q in ipairs(Dungeons.Quests(key, SIDE[p.faction or ""])) do
		quests[#quests + 1] = { id = q.id, level = q.level, xp = q.rewards and q.rewards.xp, classes = q.classes }
		local open = not (C and C.IsQuestCompleted and C.IsQuestCompleted(q.id))
		if open and q.minLevel then start = start and min(start, q.minLevel) or q.minLevel end
	end
	return Levels.Run(quests, p, start)
end
