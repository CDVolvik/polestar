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
    -- tier 1 = Apprentice (maxRank 75), tier 2 = Journeyman (maxRank 150)
    if tier == 1 then _ridingRank, _ridingMaxRank = 1, 75
    elseif tier == 2 then _ridingRank, _ridingMaxRank = 75, 150
    else _ridingRank, _ridingMaxRank = nil, nil end
end

local function setMoney(copper) q.money = copper end
local function setRep(factionID, standing) _factions[factionID] = standing end

-- defaults: Human, WARRIOR, Alliance
C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="WARRIOR", faction="Alliance" } end

local function levelUp(n)
    q.level = n
    stub.fire("PLAYER_LEVEL_UP", n, 0, 0, 0, 0, 0, 0, 0, 0)
    stub.runTimers()
end

-- printed(pat): true if any message contains the pattern (plain text).
local function printed(pat)
    for _, m in ipairs(stub.messages) do if m:find(pat, 1, true) then return true end end
    return false
end

-- navCount(): number of SetTarget calls this run.
local function navCount() return #q.nav.sets end
-- navLabel(i): the label of the i-th SetTarget call (1-based).
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
// Tier 1 (level 40)
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
	const [fired] = run(`
		levelUp(39)
		emit(printed("Riding reminder"))
	`);
	assert.equal(fired, false);
});

test('does not fire when riding (Apprentice) is already known at level 40', () => {
	const [fired] = run(`
		setRiding(1)
		levelUp(40)
		emit(printed("Riding reminder"))
	`);
	assert.equal(fired, false);
});

test('fires only once at tier 1 (second call at same tier is silent)', () => {
	const [first, second] = run(`
		setMoney(500000)
		levelUp(40)
		emit(printed("Riding reminder"))
		stub.messages = {}
		-- CharState has the flag now; calling Check again must be silent.
		R.Check(40)
		emit(printed("Riding reminder"))
	`);
	assert.equal(first, true, 'first check fires');
	assert.equal(second, false, 'second check silent');
});

test('once-per-tier persists across a simulated reload (CharState flag)', () => {
	const [fired] = run(`levelUp(40); emit(printed("Riding reminder"))`, {
		saved: { Polestar: `PolestarCharDB = { schema = 1, flags = { ridingReminder40 = true } }` },
	});
	assert.equal(fired, false);
});

// ---------------------------------------------------------------------------
// Tier 2 (level 60)
// ---------------------------------------------------------------------------

test('fires at level 60 when only Apprentice riding is known (no Journeyman)', () => {
	const [hasReminder, hasCost] = run(`
		setRiding(1)
		setMoney(15000000)
		levelUp(60)
		emit(printed("Riding reminder"))
		emit(printed("1,000 g"))
	`);
	assert.equal(hasReminder, true, 'reminder fires at 60');
	assert.equal(hasCost, true, 'shows 1000g cost');
});

test('does not fire at level 60 when Journeyman riding is already known', () => {
	const [fired] = run(`
		setRiding(2)
		levelUp(60)
		emit(printed("Riding reminder"))
	`);
	assert.equal(fired, false);
});

test('tiers are independent: level-40 flag does not suppress the level-60 reminder', () => {
	const [fired] = run(`
		setRiding(1)
		setMoney(15000000)
		levelUp(60)
		emit(printed("Riding reminder"))
	`, {
		saved: { Polestar: `PolestarCharDB = { schema = 1, flags = { ridingReminder40 = true } }` },
	});
	assert.equal(fired, true);
});

// ---------------------------------------------------------------------------
// Nav arrow: gold gating
// ---------------------------------------------------------------------------

test('nav arrow is set when the player can afford the base cost (100g)', () => {
	const [count, label] = run(`
		setMoney(1000000)   -- exactly 100 g
		levelUp(40)
		emit(navCount())
		emit(navLabel(1))
	`);
	assert.equal(count, 1, 'arrow pointed once');
	assert.ok(label, 'has a trainer label');
});

test('nav arrow is NOT set when the player cannot afford the base cost', () => {
	const [count] = run(`
		setMoney(500000)   -- 50 g: not enough for 100 g
		levelUp(40)
		emit(navCount())
	`);
	assert.equal(count, 0);
});

test('nav arrow respects Honored discount: 95g < 100g base but >= 90g discounted', () => {
	const [count] = run(`
		setMoney(950000)  -- 95 g: > 90 g discounted, < 100 g full
		setRep(72, 5)     -- Honored (5) with Stormwind (Human home faction)
		levelUp(40)
		emit(navCount())
	`);
	assert.equal(count, 1, 'arrow set because discount applies');
});

test('nav arrow NOT set when below full cost and NOT Honored', () => {
	const [count] = run(`
		setMoney(950000)  -- 95 g: below full price (100 g), no discount
		levelUp(40)
		emit(navCount())
	`);
	assert.equal(count, 0);
});

test('discount note is printed when player is Honored with home faction', () => {
	const [honored] = run(`
		setMoney(2000000)
		setRep(72, 5)   -- Honored with Stormwind
		levelUp(40)
		emit(printed("Honored"))
	`);
	assert.equal(honored, true);
});

// ---------------------------------------------------------------------------
// Race routing
// ---------------------------------------------------------------------------

test('Orc is sent to Kildar (Orgrimmar)', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Orc", class="WARRIOR", faction="Horde" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Kildar');
});

test('Scourge (Undead) is sent to Velma Warnam', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Scourge", class="WARRIOR", faction="Horde" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Velma Warnam');
});

test('Skyborne Alliance is sent to Genn Fairweather', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Skyborne", class="WARRIOR", faction="Alliance" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Genn Fairweather');
});

// ---------------------------------------------------------------------------
// Warlock class routing
// ---------------------------------------------------------------------------

test('Alliance Warlock is sent to Strahad Farsan (Felsteed chain)', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="WARLOCK", faction="Alliance" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Strahad Farsan');
});

test('Horde Warlock is also sent to Strahad Farsan', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Orc", class="WARLOCK", faction="Horde" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Strahad Farsan');
});

test('Warlock falls back to race trainer once quest 4490 is done', () => {
	const [label] = run(`
		_quests[4490] = true
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="WARLOCK", faction="Alliance" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Randal Hunter');
});

// ---------------------------------------------------------------------------
// Paladin class routing
// ---------------------------------------------------------------------------

test('Alliance Paladin is sent to Lord Grayson Shadowbreaker (Tome of Nobility)', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="PALADIN", faction="Alliance" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Lord Grayson Shadowbreaker');
});

test('Alliance Paladin falls back to race trainer once quest 4486 is done', () => {
	const [label] = run(`
		_quests[4486] = true
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Human", class="PALADIN", faction="Alliance" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Randal Hunter');
});

test('Undead Paladin falls back to Velma Warnam (no class chain data)', () => {
	const [label] = run(`
		C.GetPlayerInfo = function() return { name="Test", level=q.level, race="Scourge", class="PALADIN", faction="Horde" } end
		setMoney(1000000)
		levelUp(40)
		emit(navLabel(1))
	`);
	assert.equal(label, 'Velma Warnam');
});

// ---------------------------------------------------------------------------
// Option off: nothing fires
// ---------------------------------------------------------------------------

test('option off: no reminder or arrow when qol.ridingReminder is false', () => {
	const [fired, count] = run(`
		Polestar.Set("qol.ridingReminder", false)
		setMoney(2000000)
		levelUp(40)
		emit(printed("Riding reminder"))
		emit(navCount())
	`);
	assert.equal(fired, false, 'no reminder printed');
	assert.equal(count, 0, 'no arrow set');
});

// ---------------------------------------------------------------------------
// HasRiding pure helper
// ---------------------------------------------------------------------------

test('HasRiding(1) returns false when no riding skill at all', () => {
	const [v] = run(`emit(R.HasRiding(1))`);
	assert.equal(v, false);
});

test('HasRiding(1) returns true when apprentice rank is set', () => {
	const [v] = run(`setRiding(1); emit(R.HasRiding(1))`);
	assert.equal(v, true);
});

test('HasRiding(2) returns false with only apprentice (maxRank 75)', () => {
	const [v] = run(`setRiding(1); emit(R.HasRiding(2))`);
	assert.equal(v, false);
});

test('HasRiding(2) returns true with journeyman (maxRank 150)', () => {
	const [v] = run(`setRiding(2); emit(R.HasRiding(2))`);
	assert.equal(v, true);
});

test('HasRiding(1) uses IsSpellKnown(33388) as primary check', () => {
	const [v] = run(`_spells[33388] = true; emit(R.HasRiding(1))`);
	assert.equal(v, true);
});
