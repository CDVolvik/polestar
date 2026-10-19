'use strict';
// Riding reminder (addon/Polestar/QoL/Riding.lua): fires at levels 40 and 60
// when the character has not yet learned riding, once per tier per character,
// with gold gating on the nav arrow and class/race routing.
// Runs the real Core + Compat + QoL against tests/lua/stub_qol.lua.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');

const FILES = { name: 'Polestar', files: ['Core/Init.lua', 'Core/Compat.lua', 'Theme/Theme.xml', 'QoL/QoL.xml'] };

// -- Lua helpers injected before every test script ----------------------------
const PRELUDE = `
local q  = stub.qol
local R  = Polestar.QoL.Riding

-- Override Compat with test-friendly versions.
local C  = Polestar.Compat
local _ridingRank, _ridingMaxRank = nil, nil   -- nil = no riding skill
local _spells     = {}
local _quests     = {}
local _factions   = {}   -- factionID -> standingID (1=Hated..8=Exalted)

C.GetSkillRank = function(line)
    if line == 762 then return _ridingRank, _ridingMaxRank end
    return nil
end
C.IsSpellKnown = function(id) return _spells[id] == true end
C.IsQuestCompleted = function(id) return _quests[id] == true end
C.GetFactionStanding = function(id) local s = _factions[id]; return s end

local function setRiding(tier)
    if tier == 1 then _ridingRank, _ridingMaxRank = 1, 75
    elseif tier == 2 then _ridingRank, _ridingMaxRank = 75, 150
    else _ridingRank, _ridingMaxRank = nil, nil end
end

local function setMoney(copper) q.money = copper end
local function setRep(factionID, standing) _factions[factionID] = standing end

-- defaults: Human, WARRIOR, Alliance level 1
C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="WARRIOR", faction="Alliance" } end

local function levelUp(n)
    q.level = n
    stub.fire("PLAYER_LEVEL_UP", n, 0, 0, 0, 0, 0, 0, 0, 0)
    stub.runTimers()
end

local function enterWorld()
    stub.fire("PLAYER_ENTERING_WORLD")
    stub.runTimers()
end

local function printed(pat)
    for _, m in ipairs(stub.messages) do if m:find(pat, 1, true) then return true end end
    return false
end

local function navCount() return #q.nav.sets end
local function navLabel(i) local t = q.nav.sets[i]; return t and t.label end
`;

function run(script, opts = {}) {
	return runAddon({
		stubs: ['stub_qol.lua'],
		addons: [FILES],
		before: opts.before,
		saved: opts.saved,
		login: true,
		script: PRELUDE + script,
	}).emitted;
}

// ---------------------------------------------------------------------------
// Option default
// ---------------------------------------------------------------------------

test('ridingReminder defaults to true', () => {
	const [def] = run(`emit(Polestar.GetDefault("qol.ridingReminder"))`);
	assert.equal(def, true);
});

test('ridingReminder is registered in options with label and help', () => {
	const [found] = run(`
		local found = false
		for _, spec in ipairs(Polestar.Widgets.OptionsRegistry) do
			for _, c in ipairs(spec.controls) do
				if c.key == "qol.ridingReminder" then
					found = c.label ~= nil and c.help ~= nil
				end
			end
		end
		emit(found)
	`);
	assert.equal(found, true);
});

// ---------------------------------------------------------------------------
// Tier 1 (level 40) — basic note
// ---------------------------------------------------------------------------

test('fires a chat note at level 40 when riding is not known', () => {
	const [hasReminder, hasCost, hasBalance] = run(`
		setMoney(2000000)
		levelUp(40)
		emit(printed("Riding reminder"))
		emit(printed("100 g"))
		emit(printed("You have"))
	`);
	assert.equal(hasReminder, true, 'prints reminder');
	assert.equal(hasCost, true, 'mentions cost');
	assert.equal(hasBalance, true, 'shows balance');
});

test('does not fire at level 39', () => {
	const [fired] = run(`levelUp(39); emit(printed("Riding reminder"))`);
	assert.equal(fired, false);
});

test('does not fire when riding (Apprentice) is already known at level 40', () => {
	const [fired] = run(`setRiding(1); levelUp(40); emit(printed("Riding reminder"))`);
	assert.equal(fired, false);
});

test('fires only once at tier 1 (second call is silent)', () => {
	const [first, second] = run(`
		setMoney(500000)
		levelUp(40)
		emit(printed("Riding reminder"))
		stub.messages = {}
		R.Check(40)
		emit(printed("Riding reminder"))
	`);
	assert.equal(first, true, 'first fires');
	assert.equal(second, false, 'second is silent');
});

test('once-per-tier note flag persists across reload', () => {
	const [fired] = run(`levelUp(40); emit(printed("Riding reminder"))`, {
		saved: { Polestar: `PolestarCharDB = { schema = 1, flags = { ridingReminder40 = true } }` },
	});
	assert.equal(fired, false);
});

// ---------------------------------------------------------------------------
// Tier 2 (level 60) — basic note
// ---------------------------------------------------------------------------

test('fires at level 60 when only Apprentice riding is known', () => {
	const [hasReminder, hasCost] = run(`
		setRiding(1)
		setMoney(15000000)
		levelUp(60)
		emit(printed("Riding reminder"))
		emit(printed("1,000 g"))
	`);
	assert.equal(hasReminder, true);
	assert.equal(hasCost, true);
});

test('does not fire at level 60 when Journeyman riding is already known', () => {
	const [fired] = run(`setRiding(2); levelUp(60); emit(printed("Riding reminder"))`);
	assert.equal(fired, false);
});

test('tier 1 flag does not suppress tier 2 reminder', () => {
	const [fired] = run(`
		setRiding(1); setMoney(15000000); levelUp(60)
		emit(printed("Riding reminder"))
	`, {
		saved: { Polestar: `PolestarCharDB = { schema = 1, flags = { ridingReminder40 = true } }` },
	});
	assert.equal(fired, true);
});

// ---------------------------------------------------------------------------
// FIX 1: Class routes are tier 1 only
// ---------------------------------------------------------------------------

test('Warlock at level 60 (tier 2) goes to riding trainer, not Strahad Farsan', () => {
	// Before fix: classRoute returned STRAHAD at tier 2 too.
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Orc", class="WARLOCK", faction="Horde" } end
		setRiding(1)     -- has Apprentice, not Journeyman
		setMoney(15000000)
		levelUp(60)
		emit(navLabel(1))
	`);
	// Orc riding trainer at tier 2
	assert.equal(label, 'Kildar');
});

test('Alliance Paladin at level 60 (tier 2) goes to riding trainer, not Grayson', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="PALADIN", faction="Alliance" } end
		setRiding(1)
		setMoney(15000000)
		levelUp(60)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Randal Hunter');
});

// ---------------------------------------------------------------------------
// FIX 2: Class-mount wording and no-gold-gate for tier 1
// ---------------------------------------------------------------------------

test('Warlock note at tier 1 says quest chain, not "100 g"', () => {
	// Before fix: printed "Apprentice Riding costs 100 g".
	const [hasQuestMsg, hasGoldMsg] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="WARLOCK", faction="Alliance" } end
		setMoney(0)    -- broke – but class mount is free
		levelUp(40)
		emit(printed("Felsteed"))
		emit(printed("100 g"))
	`);
	assert.equal(hasQuestMsg, true, 'mentions Felsteed quest');
	assert.equal(hasGoldMsg, false, 'does NOT show 100 g cost');
});

test('Warlock arrow at tier 1 fires even with 0 gold', () => {
	// Before fix: arrow was gated on gold.
	const [count] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="WARLOCK", faction="Alliance" } end
		setMoney(0)
		levelUp(40)
		emit(navCount())
	`);
	assert.equal(count, 1);
});

test('Alliance Paladin note at tier 1 says Tome of Nobility, not "100 g"', () => {
	const [hasQuestMsg, hasGoldMsg] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="PALADIN", faction="Alliance" } end
		setMoney(0)
		levelUp(40)
		emit(printed("Tome"))
		emit(printed("100 g"))
	`);
	assert.equal(hasQuestMsg, true, 'mentions Tome quest');
	assert.equal(hasGoldMsg, false, 'does NOT show 100 g cost');
});

test('Alliance Paladin arrow at tier 1 fires even with 0 gold', () => {
	const [count] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="PALADIN", faction="Alliance" } end
		setMoney(0)
		levelUp(40)
		emit(navCount())
	`);
	assert.equal(count, 1);
});

// ---------------------------------------------------------------------------
// FIX 3: PLAYER_MONEY watcher — deferred arrow
// ---------------------------------------------------------------------------

test('no arrow on level-up when broke, but arrow fires when PLAYER_MONEY makes threshold', () => {
	// Before fix: no PLAYER_MONEY watch; arrow was silently skipped.
	const [countBefore, countAfter, hasArrowMsg] = run(`
		setMoney(0)
		levelUp(40)
		emit(navCount())           -- broke: no arrow yet
		setMoney(1000000)          -- exactly 100 g
		stub.fire("PLAYER_MONEY")
		stub.runTimers()
		emit(navCount())           -- now the arrow fires
		emit(printed("Arrow"))
	`);
	assert.equal(countBefore, 0, 'no arrow when broke');
	assert.equal(countAfter, 1, 'arrow fires when gold threshold met');
	assert.equal(hasArrowMsg, true, 'prints arrow line');
});

test('money-gated arrow fires only once per tier', () => {
	const [count] = run(`
		setMoney(0)
		levelUp(40)
		setMoney(1000000)
		stub.fire("PLAYER_MONEY")
		stub.runTimers()
		stub.fire("PLAYER_MONEY")  -- second event
		stub.runTimers()
		emit(navCount())
	`);
	assert.equal(count, 1);
});

test('money-gated arrow respects Honored discount', () => {
	// 95 g < 100 g base, >= 90 g discounted → arrow fires when Honored.
	const [countWithout, countWith] = run(`
		setMoney(0)
		levelUp(40)
		setMoney(950000)
		-- without honor: no arrow
		stub.fire("PLAYER_MONEY"); stub.runTimers()
		emit(navCount())
		-- add honor, then fire money event again (arrow not set yet)
		setRep(72, 5)  -- Honored with Stormwind (Human home faction)
		stub.fire("PLAYER_MONEY"); stub.runTimers()
		emit(navCount())
	`);
	assert.equal(countWithout, 0, 'no arrow without honor');
	assert.equal(countWith, 1, 'arrow fires once honored');
});

test('money watcher stops watching once riding is learned', () => {
	const [count] = run(`
		setMoney(0)
		levelUp(40)
		-- now learn riding before hitting the gold threshold
		setRiding(1)
		setMoney(1000000)
		stub.fire("PLAYER_MONEY"); stub.runTimers()
		emit(navCount())           -- should NOT fire: riding already known
	`);
	assert.equal(count, 0);
});

test('money watcher stops watching when option is turned off', () => {
	const [count] = run(`
		setMoney(0)
		levelUp(40)
		Polestar.Set("qol.ridingReminder", false)
		setMoney(1000000)
		stub.fire("PLAYER_MONEY"); stub.runTimers()
		emit(navCount())
	`);
	assert.equal(count, 0);
});

// ---------------------------------------------------------------------------
// FIX 4: PLAYER_ENTERING_WORLD check for existing characters
// ---------------------------------------------------------------------------

test('note fires on login for a level-40 character who has never seen it', () => {
	// Before fix: only PLAYER_LEVEL_UP triggered the check.
	const [fired] = run(`
		q.level = 40
		C.GetPlayerInfo = function() return { name="Test", level=40, race="Human", class="WARRIOR", faction="Alliance" } end
		enterWorld()
		emit(printed("Riding reminder"))
	`);
	assert.equal(fired, true);
});

test('note fires on login for a level-55 character (tier 1, not yet seen)', () => {
	const [fired] = run(`
		q.level = 55
		C.GetPlayerInfo = function() return { name="Test", level=55, race="Human", class="WARRIOR", faction="Alliance" } end
		enterWorld()
		emit(printed("Riding reminder"))
	`);
	assert.equal(fired, true);
});

test('tier 2 note fires on login for a level-60 character without Journeyman', () => {
	const [fired, hasTier2Cost] = run(`
		q.level = 60
		setRiding(1)   -- has Apprentice, not Journeyman
		setMoney(0)
		C.GetPlayerInfo = function() return { name="Test", level=60, race="Human", class="WARRIOR", faction="Alliance" } end
		enterWorld()
		emit(printed("Riding reminder"))
		emit(printed("1,000 g"))
	`);
	assert.equal(fired, true, 'reminder fires at 60 on login');
	assert.equal(hasTier2Cost, true, 'shows 1,000 g cost');
});

test('login check does NOT fire for level 39', () => {
	const [fired] = run(`
		q.level = 39
		C.GetPlayerInfo = function() return { name="Test", level=39, race="Human", class="WARRIOR", faction="Alliance" } end
		enterWorld()
		emit(printed("Riding reminder"))
	`);
	assert.equal(fired, false);
});

test('login check is silent when note was already shown (flag set)', () => {
	const [fired] = run(`
		q.level = 40
		C.GetPlayerInfo = function() return { name="Test", level=40, race="Human", class="WARRIOR", faction="Alliance" } end
		enterWorld()
		emit(printed("Riding reminder"))
	`, {
		saved: { Polestar: `PolestarCharDB = { schema = 1, flags = { ridingReminder40 = true } }` },
	});
	assert.equal(fired, false);
});

test('login re-starts money watcher when note was shown but arrow was not', () => {
	// Simulates: note seen last session, arrow not seen (was broke), now logging in with gold.
	const [count] = run(`
		q.level = 40
		C.GetPlayerInfo = function() return { name="Test", level=40, race="Human", class="WARRIOR", faction="Alliance" } end
		setMoney(1000000)   -- now can afford
		enterWorld()        -- should re-register the money watcher and fire immediately
		emit(navCount())
	`, {
		saved: { Polestar: `PolestarCharDB = { schema = 1, flags = { ridingReminder40 = true } }` },
	});
	// enterWorld calls Check which sees note done but arrow not done, tries arrow immediately
	assert.equal(count, 1);
});

// ---------------------------------------------------------------------------
// Nav arrow: gold gating (existing behaviour retained)
// ---------------------------------------------------------------------------

test('nav arrow is set when the player can afford the base cost on level-up', () => {
	const [count, label] = run(`
		setMoney(1000000)
		levelUp(40)
		emit(navCount())
		emit(navLabel(1))
	`);
	assert.equal(count, 1);
	assert.ok(label, 'has a trainer label');
});

test('nav arrow is NOT set on level-up when the player cannot afford it', () => {
	const [count] = run(`
		setMoney(500000)
		levelUp(40)
		emit(navCount())
	`);
	assert.equal(count, 0);
});

test('Honored discount applies: 95g >= 90g discounted threshold', () => {
	const [count] = run(`
		setMoney(950000)
		setRep(72, 5)    -- Honored with Stormwind
		levelUp(40)
		emit(navCount())
	`);
	assert.equal(count, 1);
});

test('discount note printed when Honored with home faction', () => {
	const [honored] = run(`
		setMoney(2000000); setRep(72, 5)
		levelUp(40)
		emit(printed("Honored"))
	`);
	assert.equal(honored, true);
});

// ---------------------------------------------------------------------------
// Race routing
// ---------------------------------------------------------------------------

test('Orc is sent to Kildar', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Orc", class="WARRIOR", faction="Horde" } end
		setMoney(1000000); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Kildar');
});

test('Scourge is sent to Velma Warnam', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Scourge", class="WARRIOR", faction="Horde" } end
		setMoney(1000000); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Velma Warnam');
});

test('Skyborne Alliance is sent to Genn Fairweather', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Skyborne", class="WARRIOR", faction="Alliance" } end
		setMoney(1000000); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Genn Fairweather');
});

// ---------------------------------------------------------------------------
// Warlock class routing (tier 1)
// ---------------------------------------------------------------------------

test('Alliance Warlock (tier 1) is sent to Strahad Farsan', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="WARLOCK", faction="Alliance" } end
		setMoney(0); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Strahad Farsan');
});

test('Horde Warlock (tier 1) is also sent to Strahad Farsan', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Orc", class="WARLOCK", faction="Horde" } end
		setMoney(0); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Strahad Farsan');
});

test('Warlock falls back to race trainer once quest 4490 is done', () => {
	const [label] = run(`
		_quests[4490] = true
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="WARLOCK", faction="Alliance" } end
		setMoney(1000000); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Randal Hunter');
});

// ---------------------------------------------------------------------------
// Paladin class routing (tier 1)
// ---------------------------------------------------------------------------

test('Alliance Paladin (tier 1) is sent to Lord Grayson Shadowbreaker', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="PALADIN", faction="Alliance" } end
		setMoney(0); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Lord Grayson Shadowbreaker');
});

test('Alliance Paladin falls back to race trainer once quest 4486 is done', () => {
	const [label] = run(`
		_quests[4486] = true
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="PALADIN", faction="Alliance" } end
		setMoney(1000000); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Randal Hunter');
});

test('Undead Paladin falls back to Velma Warnam (no class chain data)', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Scourge", class="PALADIN", faction="Horde" } end
		setMoney(1000000); levelUp(40); emit(navLabel(1))
	`);
	assert.equal(label, 'Velma Warnam');
});

// ---------------------------------------------------------------------------
// Option off: nothing fires
// ---------------------------------------------------------------------------

test('option off: no note, no arrow', () => {
	const [fired, count] = run(`
		Polestar.Set("qol.ridingReminder", false)
		setMoney(2000000); levelUp(40)
		emit(printed("Riding"))
		emit(navCount())
	`);
	assert.equal(fired, false);
	assert.equal(count, 0);
});

// ---------------------------------------------------------------------------
// HasRiding pure helper
// ---------------------------------------------------------------------------

test('HasRiding(1) false when no skill', () => {
	const [v] = run(`emit(R.HasRiding(1))`);
	assert.equal(v, false);
});

test('HasRiding(1) true when apprentice rank set', () => {
	const [v] = run(`setRiding(1); emit(R.HasRiding(1))`);
	assert.equal(v, true);
});

test('HasRiding(2) false with only apprentice', () => {
	const [v] = run(`setRiding(1); emit(R.HasRiding(2))`);
	assert.equal(v, false);
});

test('HasRiding(2) true with journeyman (maxRank 150)', () => {
	const [v] = run(`setRiding(2); emit(R.HasRiding(2))`);
	assert.equal(v, true);
});

test('HasRiding uses IsSpellKnown(33388) as primary', () => {
	const [v] = run(`_spells[33388] = true; emit(R.HasRiding(1))`);
	assert.equal(v, true);
});
