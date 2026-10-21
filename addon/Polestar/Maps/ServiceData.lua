-- Town services from Polestar's bundled, load-on-demand Codex.
local ADDON, ns = ...
local Maps = ns.Maps
local ROLES = { "vendor", "repair", "innkeeper", "banker", "auctioneer", "flightmaster",
	"battlemaster", "spirithealer", "stablemaster", "trainer", "weapon" }

function Maps.ServiceSource()
	local X = ns.Codex
	if not (X and X.IsLoaded and X.WithRole and X.Npc) then return nil, "missing" end
	if not X.IsLoaded() then
		if InCombatLockdown and InCombatLockdown() then return nil, "combat" end
		if not X.Load then return nil, "missing" end
		local ok, why = X.Load()
		if not ok then return nil, why end
	end
	local ids, seen = {}, {}
	for _, role in ipairs(ROLES) do
		for _, id in ipairs(X.WithRole(role)) do
			if not seen[id] then ids[#ids + 1], seen[id] = id, true end
		end
	end
	table.sort(ids)
	return { ids = ids, read = function(id)
		local npc = X.Npc(id)
		if not npc or not npc.faction or (npc.instance and npc.instance ~= "") then return nil end
		return npc
	end }
end

function Maps.ServiceMailboxSource()
	local X = ns.Codex
	if not (X and X.Each and X.Object) then return nil end
	local ids = {}
	X.Each("object", function(id) ids[#ids + 1] = id end)
	table.sort(ids)
	return { ids = ids, read = function(id)
		local object = X.Object(id)
		if not object or not object.mailbox or not object.faction then return nil end
		return { id = id, kind = "object", name = object.name, faction = object.faction,
			spawns = object.spawns, roles = { "mailbox" } }
	end }
end
