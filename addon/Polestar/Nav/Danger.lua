-- Zone danger: how much dearer a walk through a zone far above the character
-- is (#195). A zone is dangerous for a character of level L when its lowest
-- level (Maps.GetZoneLevels, Maps/ZoneLevels.lua) is at least L + 4, and far
-- above when it is more than L + 10 (the Engine's rule for candidates). A
-- step into a dangerous zone costs 3 times, into a far-above one 10 times; a
-- zone without a level range (a city, an unknown one) never counts, nor do the
-- zones the walk starts and ends in (a quest inside Moonglade at level 15 is
-- still walked to). The router (Polestar_Nav's Routing/Path.lua) takes the
-- table as opts.danger; no zone is ever closed.
-- The zone danger idea and its 4-level threshold come from Ding! by Yendi
-- (ding-travel 2bccf01, its dangerAbove).
--
--   Nav.danger.Mult(level, uiMapID) -> 1 | 3 | 10
--   Nav.danger.Table(level, startZone, goalZone) -> { [uiMapID] = 3 | 10 } | nil, signature
--     every zone with levels whose multiplier is above 1 except startZone and
--     goalZone (nil when none); signature "uiMap=mult,..." by uiMapID ("" for
--     none). Built once per level and zone pair: the router keys its caches
--     by the table's entries, so the same pair always gets the same table.

local ADDON, ns = ...
local Nav = ns.Nav

local type, ipairs, sort, concat = type, ipairs, table.sort, table.concat

local DANGEROUS = 4   -- a zone's lowest level at least this far above: x3
local FAR_ABOVE = 10  -- more than this far above: x10

local Danger = {}
Nav.danger = Danger

function Danger.Mult(level, uiMapID)
	local M = ns.Maps
	if type(level) ~= "number" or not uiMapID or not (M and M.GetZoneLevels) then return 1 end
	local lo = M.GetZoneLevels(uiMapID)
	if type(lo) ~= "number" then return 1 end
	if lo > level + FAR_ABOVE then return 10 end
	if lo >= level + DANGEROUS then return 3 end
	return 1
end

local cache, cacheLevel = {}, nil -- [startZone:goalZone] = { table | false, signature } at cacheLevel

function Danger.Table(level, startZone, goalZone)
	local M = ns.Maps
	if type(level) ~= "number" or not (M and M.EachZoneLevels) then return nil, "" end
	if cacheLevel ~= level then cache, cacheLevel = {}, level end
	local key = (startZone or 0) .. ":" .. (goalZone or 0)
	local e = cache[key]
	if not e then
		local t, ids = {}, {}
		for id in M.EachZoneLevels() do
			if id ~= startZone and id ~= goalZone then
				local m = Danger.Mult(level, id)
				if m > 1 then t[id], ids[#ids + 1] = m, id end
			end
		end
		sort(ids)
		for i, id in ipairs(ids) do ids[i] = id .. "=" .. t[id] end
		e = { #ids > 0 and t or false, concat(ids, ",") }
		cache[key] = e
	end
	return e[1] or nil, e[2]
end
