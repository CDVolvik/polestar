-- Riding reminder: at levels 40 and 60, if the character has not yet learned
-- riding (or the higher tier at 60), prints one note in chat per tier with
-- the cost, the Honored discount and the current balance, and when the player
-- can afford it offers the arrow to their race's riding trainer (or their
-- class's free-mount quest NPC for Warlocks and Alliance Paladins).
--
-- Riding detection:
--   IsSpellKnown(33388) / IsSpellKnown(33391) are the TBC-era spell IDs for
--   Apprentice / Journeyman Riding. In Forever's Classic-era client the
--   riding skill is exposed as skill line 762 (Compat.SKILL_LINES' "riding"):
--   the factcheck.py tool does not cover spells, and no riding spell entry was
--   found in data/forever. Both paths are tried; the skill line (762) is the
--   authoritative fallback used by Nearby.lua and the engine.
--     Tier 1 (level 40, Apprentice): any riding skill rank > 0 counts.
--     Tier 2 (level 60, Journeyman): riding skill maxRank >= 150 counts.
--
-- Costs (copper):
--   Apprentice  100 g = 1,000,000 c  |  10% off Honored → 900,000 c
--   Journeyman  1,000 g = 10,000,000 c |  10% off Honored → 9,000,000 c
--
-- Home faction IDs (GetFactionStanding):
--   Orc 76, Troll 530, Tauren 81, Scourge/Undead 68
--   Human 72, NightElf 69, Dwarf 47, Gnome 54
--   Skyborne Alliance (High Order) 2779, Skyborne Horde (Windshapers) 2778
--
-- NPC ids verified with data/local/factcheck/check.py npc <id>:
--   4752 Kildar           map 1454 x 69.4 y 13.1   Orgrimmar (Orc)
--   7953 Xar'Ti           map 1411 x 55.3 y 75.5   Sen'jin (Troll)
--   3690 Kar Stormsinger  map 1412 x 46.8 y 62.0   Bloodhoof (Tauren)
--   4773 Velma Warnam     map 1420 x 60.1 y 52.6   Brill (Undead)
--   4732 Randal Hunter    map 1429 x 84.3 y 64.9   Eastvale (Human)
--   4753 Jartsam          map 1438 x 25.3 y 50.2   Darnassus (NightElf)
--   4772 Ultham Ironhorn  map 1426 x 63.7 y 50.1   Amberstill (Dwarf)
--   7954 Binjy Featherwhistle map 1426 x 49.2 y 48.1  Steelgrill's Depot (Gnome)
--   265756 Genn Fairweather  map 2521 x 53.5 y 80.5  Zephras Isle (Skyborne)
--   6251 Strahad Farsan   map 1413 x 62.6 y 35.5   Ratchet (Warlock chain)
--   928 Lord Grayson Shadowbreaker map 1453 x 48.43 y 50.22  Stormwind (Paladin chain)
--
-- Quest ids verified with data/local/factcheck/check.py quest <id>:
--   Warlock Felsteed chain  Horde: 3631, 4489 → 4490   Alliance: 4487, 4488 → 4490
--   Paladin Tome chain      Alliance: 1661, 4485, 4486
--
--   Riding.Check(level)   called on PLAYER_LEVEL_UP; reads CharState
--   Riding.HasRiding(tier) -> bool  pure, for tests

local ADDON, ns = ...
local L = ns.L
local QoL = ns.QoL
local Client = QoL.Client

local floor, format = math.floor, string.format

local Riding = {}
QoL.Riding = Riding

-- qol.ridingReminder default registered in QoL.lua's defaults.
ns.RegisterDefaults("qol", { ridingReminder = true })

---------------------------------------------------------------------------
-- Riding detection
---------------------------------------------------------------------------

-- spell ids for riding tiers (TBC-era; may not be present in this client –
-- the skill-line fallback below is authoritative for Forever Classic).
local APPRENTICE_SPELL  = 33388
local JOURNEYMAN_SPELL  = 33391
local RIDING_SKILL_LINE = 762   -- Compat.SKILL_LINES' riding

-- true when the character has learned riding at the given tier.
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

-- { map, x, y, npcName, factionID }
-- factionID is the home city faction for the Honored-discount check.
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
-- Skyborne trainer entry per faction (same NPC, different home faction).
local TRAINERS_SKYBORNE = {
	Alliance = { map = 2521, x = 53.5, y = 80.5, name = "Genn Fairweather", faction = 2779 },
	Horde    = { map = 2521, x = 53.5, y = 80.5, name = "Genn Fairweather", faction = 2778 },
}
-- Strahad Farsan (Ratchet): end of the Warlock Felsteed chain for both factions.
local STRAHAD = { map = 1413, x = 62.6, y = 35.5, name = "Strahad Farsan" }
-- Lord Grayson Shadowbreaker (Stormwind Cathedral): Alliance Paladin chain start.
local GRAYSON = { map = 1453, x = 48.43, y = 50.22, name = "Lord Grayson Shadowbreaker" }

-- UnitRace returns the client file string.  "Scourge" is the Forsaken's token
-- (also aliased as "Undead" by Guides.NormRace, but UnitRace gives "Scourge").
local function trainerFor(race, faction)
	if race == "Skyborne" then return TRAINERS_SKYBORNE[faction] end
	return TRAINERS[race]
end

---------------------------------------------------------------------------
-- Cost and discount
---------------------------------------------------------------------------

local BASE_COST = { [1] = 1000000, [2] = 10000000 }  -- copper
local HONORED   = 5  -- GetFactionStanding's standing ID for Honored

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

-- true when the player is Honored (or above) with factionID.
local function isHonored(factionID)
	if not factionID then return false end
	local standing = ns.Compat.GetFactionStanding(factionID)
	return standing ~= nil and standing >= HONORED
end

---------------------------------------------------------------------------
-- Class routing
---------------------------------------------------------------------------

-- Warlock Felsteed quests; final quest 4490 means chain is complete.
local WARLOCK_FINAL = 4490
-- Alliance Paladin Tome of Nobility; final quest 4486 = chain complete.
local PALADIN_FINAL = 4486

-- The class-specific mount NPC (and nil when the class route is finished or
-- not applicable), plus the home faction factionID for the discount.
-- Falls back to the race's riding trainer on nil.
local function classRoute(class, faction)
	local C = ns.Compat
	if class == "WARLOCK" then
		if not C.IsQuestCompleted(WARLOCK_FINAL) then
			return STRAHAD, nil  -- Strahad has no home-city discount
		end
		return nil  -- chain done, fall through to riding trainer
	end
	if class == "PALADIN" and faction == "Alliance" then
		if not C.IsQuestCompleted(PALADIN_FINAL) then
			return GRAYSON, 72  -- Stormwind discount (Human Paladin)
		end
		return nil  -- chain done
	end
	return nil  -- no special class route
end

---------------------------------------------------------------------------
-- Core logic
---------------------------------------------------------------------------

local FLAGS = { [1] = "ridingReminder40", [2] = "ridingReminder60" }

-- Mark a tier done so we never show it again for this character.
local function markSeen(tier)
	local s = ns.CharState()
	s.flags[FLAGS[tier]] = true
end

local function alreadySeen(tier)
	local s = ns.CharState()
	return s.flags[FLAGS[tier]] == true
end

-- Called when a level event fires or on demand.
function Riding.Check(level)
	if not QoL.On("ridingReminder") then return end

	local tier
	if level == 40 then
		tier = 1
	elseif level == 60 then
		tier = 2
	else
		return
	end

	if alreadySeen(tier) then return end
	if Riding.HasRiding(tier) then return end

	-- Player needs riding.  Show once.
	markSeen(tier)

	local info = ns.Compat.GetPlayerInfo()
	local race    = info and info.race    or ""
	local class   = info and info.class   or ""
	local faction = info and info.faction or ""

	-- Determine trainer/NPC target.
	local classNpc, classFaction = classRoute(class, faction)
	local trainer = classNpc or trainerFor(race, faction)
	local factionID = classNpc and classFaction or (trainer and trainer.faction)

	local cost = effectiveCost(tier, factionID)
	local money = Client.Money()

	-- Build the message.
	local tierName  = tier == 1 and L["Apprentice Riding"] or L["Journeyman Riding"]
	local baseGold  = tier == 1 and L["100 g"] or L["1,000 g"]
	local msg = format(L["Riding reminder: %s costs %s."], tierName, baseGold)
	if factionID and isHonored(factionID) then
		msg = msg .. " " .. L["(Honored: 10% off)"]
	elseif factionID then
		msg = msg .. " " .. L["(10% off at Honored with the home faction)"]
	end
	msg = msg .. " " .. format(L["You have %s."], QoL.Money(money))
	ns.Print(msg)

	-- Offer the nav arrow when the player can afford it.
	if trainer and money >= cost then
		local N = ns.Nav
		if N and N.SetTarget then
			N.SetTarget(trainer.map, trainer.x, trainer.y, trainer.name)
			ns.Print(format(L["Arrow: %s."], trainer.name))
		end
	end
end

---------------------------------------------------------------------------
-- Event
---------------------------------------------------------------------------

ns.RegisterEvent("PLAYER_LEVEL_UP", function(_, level)
	ns.SafeCall(Riding.Check, level)
end)
