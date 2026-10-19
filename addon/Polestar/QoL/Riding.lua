-- Riding reminder: at levels 40 and 60, if the character has not yet learned
-- riding (or the higher tier at 60), prints one note in chat per tier with
-- the cost, the Honored discount and the current balance, then offers the
-- arrow to the race's riding trainer.  When the player cannot afford it yet
-- the module watches PLAYER_MONEY and offers the arrow the first time they
-- can, once per tier (its own per-character flag).
--
-- Class routes (tier 1 / level 40 only):
--   WARLOCK: Strahad Farsan, Ratchet (Summon Felsteed chain 3631/4489 or
--     4487/4488 → 4490).  Skip once quest 4490 is done.
--   PALADIN + Alliance: Lord Grayson Shadowbreaker, Stormwind (Tome of
--     Nobility chain 1661/4485/4486).  Skip once quest 4486 is done.
--   PALADIN + Horde/Undead: no chain data; falls back to the riding trainer.
--   Class routes are tier 1 only.  At tier 2 every character goes to the
--   riding trainer.
--
-- Quest 4490 (Warlock chain) and 4486 (Paladin chain) both show "skill: null"
-- in data/forever – whether they also grant the riding skill is not confirmed
-- from the data; the note therefore says "your class mount comes from this
-- quest; riding trainer otherwise" and the arrow is set regardless of gold
-- so the player can investigate for themselves.
--
-- Riding detection:
--   IsSpellKnown(33388/33391) tried first; skill line 762 (Compat.SKILL_LINES'
--   "riding") is the authoritative fallback used throughout the addon.
--   Spell ids 33388/33391 are TBC-era; factcheck.py has no spell lookup and
--   neither id appears in data/forever – reported in commit message.
--
-- Costs (copper):
--   Apprentice (level 40): 100 g = 1,000,000 c; 10% off Honored → 900,000 c
--   Journeyman (level 60): 1,000 g = 10,000,000 c; 10% off → 9,000,000 c
--
-- Home faction ids verified from data/forever/factions.json:
--   Orc 76 · Troll 530 · Tauren 81 · Scourge/Undead 68
--   Human 72 · NightElf 69 · Dwarf 47 · Gnome 54
--   Skyborne Alliance (High Order) 2779 · Skyborne Horde (Windshapers) 2778
--
-- Per-character state in PolestarCharDB.flags:
--   ridingReminder40 / ridingReminder60 — note printed for tier
--   ridingArrow40    / ridingArrow60    — arrow pointed for tier
--
--   Riding.Check(level)      called on PLAYER_LEVEL_UP and PLAYER_ENTERING_WORLD
--   Riding.HasRiding(tier)   pure predicate, for tests

local ADDON, ns = ...
local L = ns.L
local QoL = ns.QoL
local Client = QoL.Client

local floor, format, pairs = math.floor, string.format, pairs

local Riding = {}
QoL.Riding = Riding

ns.RegisterDefaults("qol", { ridingReminder = true })

---------------------------------------------------------------------------
-- Riding detection
---------------------------------------------------------------------------

local APPRENTICE_SPELL  = 33388  -- TBC-era spell ids; may not exist in this client
local JOURNEYMAN_SPELL  = 33391
local RIDING_SKILL_LINE = 762    -- Compat.SKILL_LINES' riding: authoritative fallback

-- True when the character has learned riding at the given tier.
-- tier 1 = Apprentice (level 40), tier 2 = Journeyman (level 60).
function Riding.HasRiding(tier)
	local C = ns.Compat
	local spellID = tier == 1 and APPRENTICE_SPELL or JOURNEYMAN_SPELL
	if C.IsSpellKnown(spellID) then return true end
	local rank, maxRank
	if C.GetSkillRank then rank, maxRank = C.GetSkillRank(RIDING_SKILL_LINE) end
	if tier == 1 then
		return rank ~= nil and rank > 0
	else
		return maxRank ~= nil and maxRank >= 150
	end
end

---------------------------------------------------------------------------
-- Trainer data
---------------------------------------------------------------------------

local TRAINERS = {
	Orc      = { map = 1454, x = 69.4,  y = 13.1,  name = "Kildar",               faction = 76  },
	Troll    = { map = 1411, x = 55.3,  y = 75.5,  name = "Xar'Ti",               faction = 530 },
	Tauren   = { map = 1412, x = 46.8,  y = 62.0,  name = "Kar Stormsinger",       faction = 81  },
	Scourge  = { map = 1420, x = 60.1,  y = 52.6,  name = "Velma Warnam",          faction = 68  },
	Human    = { map = 1429, x = 84.3,  y = 64.9,  name = "Randal Hunter",         faction = 72  },
	NightElf = { map = 1438, x = 25.3,  y = 50.2,  name = "Jartsam",              faction = 69  },
	Dwarf    = { map = 1426, x = 63.7,  y = 50.1,  name = "Ultham Ironhorn",       faction = 47  },
	Gnome    = { map = 1426, x = 49.2,  y = 48.1,  name = "Binjy Featherwhistle", faction = 54  },
}
local TRAINERS_SKYBORNE = {
	Alliance = { map = 2521, x = 53.5, y = 80.5, name = "Genn Fairweather", faction = 2779 },
	Horde    = { map = 2521, x = 53.5, y = 80.5, name = "Genn Fairweather", faction = 2778 },
}
local STRAHAD = { map = 1413, x = 62.6, y = 35.5, name = "Strahad Farsan" }
local GRAYSON = { map = 1453, x = 48.43, y = 50.22, name = "Lord Grayson Shadowbreaker" }

local function trainerFor(race, faction)
	if race == "Skyborne" then return TRAINERS_SKYBORNE[faction] end
	return TRAINERS[race]
end

---------------------------------------------------------------------------
-- Cost and discount
---------------------------------------------------------------------------

local BASE_COST = { [1] = 1000000, [2] = 10000000 }
local HONORED   = 5

local function effectiveCost(tier, factionID)
	local base = BASE_COST[tier]
	if factionID then
		local standing = ns.Compat.GetFactionStanding(factionID)
		if standing and standing >= HONORED then
			return floor(base * 0.9 + 0.5)
		end
	end
	return base
end

local function isHonored(factionID)
	if not factionID then return false end
	local standing = ns.Compat.GetFactionStanding(factionID)
	return standing ~= nil and standing >= HONORED
end

---------------------------------------------------------------------------
-- Class routing  (tier 1 only)
---------------------------------------------------------------------------

local WARLOCK_FINAL = 4490
local PALADIN_FINAL = 4486

-- Returns (npc, factionID, classKind) for class-mount routing at tier 1.
-- classKind ("WARLOCK" | "PALADIN") signals free-mount wording + no-gold gate.
-- Returns nil, nil, nil when no class route applies or the chain is done.
local function classRoute(class, faction, tier)
	if tier ~= 1 then return nil, nil, nil end
	local C = ns.Compat
	if class == "WARLOCK" then
		if not C.IsQuestCompleted(WARLOCK_FINAL) then
			return STRAHAD, nil, "WARLOCK"
		end
	elseif class == "PALADIN" and faction == "Alliance" then
		if not C.IsQuestCompleted(PALADIN_FINAL) then
			return GRAYSON, nil, "PALADIN"
		end
	end
	return nil, nil, nil
end

---------------------------------------------------------------------------
-- Per-character flags
---------------------------------------------------------------------------

local NOTE_FLAGS  = { [1] = "ridingReminder40", [2] = "ridingReminder60" }
local ARROW_FLAGS = { [1] = "ridingArrow40",    [2] = "ridingArrow60"    }

local function markNote(tier)  local s = ns.CharState(); s.flags[NOTE_FLAGS[tier]]  = true end
local function markArrow(tier) local s = ns.CharState(); s.flags[ARROW_FLAGS[tier]] = true end
local function noteSeen(tier)  return ns.CharState().flags[NOTE_FLAGS[tier]]  == true end
local function arrowSeen(tier) return ns.CharState().flags[ARROW_FLAGS[tier]] == true end

---------------------------------------------------------------------------
-- PLAYER_MONEY watcher: points the arrow once the player can afford riding
---------------------------------------------------------------------------

local moneyPending = {}    -- tier -> true when watching for that tier's arrow
local moneyRegistered = false

local onMoney  -- forward declaration

local function unregisterMoney()
	if moneyRegistered then
		ns.UnregisterEvent("PLAYER_MONEY", onMoney)
		moneyRegistered = false
	end
end

-- Try to fire the deferred arrow for one tier.  Called from onMoney and from
-- Check (when the note is already shown but the arrow was never set).
local function tryArrow(tier)
	-- Drop stale entries cheaply.
	if arrowSeen(tier) or not QoL.On("ridingReminder") or Riding.HasRiding(tier) then
		moneyPending[tier] = nil
		return
	end
	local info = ns.Compat.GetPlayerInfo()
	local race    = info and info.race    or ""
	local class   = info and info.class   or ""
	local faction = info and info.faction or ""
	local classNpc, _, classKind = classRoute(class, faction, tier)
	local trainer = classNpc or trainerFor(race, faction)
	if not trainer then moneyPending[tier] = nil; return end

	local canFire
	if classKind then
		canFire = true  -- class-mount route: always offer arrow regardless of gold
	else
		local factionID = trainer.faction
		canFire = Client.Money() >= effectiveCost(tier, factionID)
	end

	if canFire then
		markArrow(tier)
		moneyPending[tier] = nil
		local N = ns.Nav
		if N and N.SetTarget then
			N.SetTarget(trainer.map, trainer.x, trainer.y, trainer.name)
			ns.Print(format(L["Arrow: %s."], trainer.name))
		end
	end
end

onMoney = function()
	-- Early out: nothing pending.
	if not next(moneyPending) then unregisterMoney(); return end
	local any = false
	for tier in pairs(moneyPending) do
		tryArrow(tier)
		if moneyPending[tier] then any = true end
	end
	if not any then unregisterMoney() end
end

local function watchMoney(tier)
	moneyPending[tier] = true
	if not moneyRegistered then
		ns.RegisterEvent("PLAYER_MONEY", onMoney)
		moneyRegistered = true
	end
end

---------------------------------------------------------------------------
-- Core logic
---------------------------------------------------------------------------

-- Derives which tier applies to `level`.  Returns nil for levels below 40.
local function tierForLevel(level)
	if level >= 60 then return 2
	elseif level >= 40 then return 1
	end
end

function Riding.Check(level)
	if not QoL.On("ridingReminder") then return end

	local tier = tierForLevel(level)
	if not tier then return end

	-- Already handled both note and arrow for this tier.
	if noteSeen(tier) and arrowSeen(tier) then return end

	-- Already learned.
	if Riding.HasRiding(tier) then
		-- Clear any pending watch (learned since last session).
		if moneyPending[tier] then
			moneyPending[tier] = nil
			if not next(moneyPending) then unregisterMoney() end
		end
		return
	end

	local info = ns.Compat.GetPlayerInfo()
	local race    = info and info.race    or ""
	local class   = info and info.class   or ""
	local faction = info and info.faction or ""

	local classNpc, classFaction, classKind = classRoute(class, faction, tier)
	local trainer = classNpc or trainerFor(race, faction)
	local factionID = classNpc and classFaction or (trainer and trainer.faction)

	-- Print note (once per tier).
	if not noteSeen(tier) then
		markNote(tier)
		local msg
		if classKind == "WARLOCK" then
			msg = L["Riding: your class mount comes from the Summon Felsteed quest chain (Strahad Farsan, Ratchet); the riding trainer otherwise."]
		elseif classKind == "PALADIN" then
			msg = L["Riding: your class mount comes from the Tome of Nobility quest chain (Lord Grayson Shadowbreaker, Stormwind); the riding trainer otherwise."]
		else
			local tierName = tier == 1 and L["Apprentice Riding"] or L["Journeyman Riding"]
			local baseGold = tier == 1 and L["100 g"] or L["1,000 g"]
			msg = format(L["Riding reminder: %s costs %s."], tierName, baseGold)
			if factionID and isHonored(factionID) then
				msg = msg .. " " .. L["(Honored: 10% off)"]
			elseif factionID then
				msg = msg .. " " .. L["(10% off at Honored with the home faction)"]
			end
			msg = msg .. " " .. format(L["You have %s."], QoL.Money(Client.Money()))
		end
		ns.Print(msg)
	end

	-- Set arrow (once per tier).
	if not arrowSeen(tier) then
		if classKind then
			-- Free-mount route: offer arrow regardless of gold.
			tryArrow(tier)
		else
			local cost = effectiveCost(tier, factionID)
			if Client.Money() >= cost then
				tryArrow(tier)
			else
				-- Watch money until affordable.
				watchMoney(tier)
			end
		end
	end
end

---------------------------------------------------------------------------
-- Events
---------------------------------------------------------------------------

ns.RegisterEvent("PLAYER_LEVEL_UP", function(_, level)
	ns.SafeCall(Riding.Check, level)
end)

-- Also check on login so existing characters (installed at 40+) get the note.
ns.RegisterEvent("PLAYER_ENTERING_WORLD", function()
	local C = ns.Compat
	local info = C.GetPlayerInfo and C.GetPlayerInfo()
	if info then ns.SafeCall(Riding.Check, info.level) end
end)
