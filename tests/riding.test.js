'use strict';
// Riding reminder (addon/Polestar/QoL/Riding.lua + UI/GuideFrame.lua banner):
// fires a banner at levels 40 and 60 when riding has not been learned,
// once per tier per character; gold-gated "Take me there" button;
// class routing for Warlocks and Alliance Paladins.
//
// Section 1: banner rendering and interaction (stub_ui, like ui.test.js).
// Section 2: Riding.lua unit logic (stub_qol, like the old riding.test.js).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');

// ---------------------------------------------------------------------------
// Section 1: Banner (GuideFrame.lua "riding" notice kind)
// ---------------------------------------------------------------------------
// Runs the real Core + Theme + UI against stub_ui.lua — same pattern as ui.test.js.
// GuideFrame is loaded; QoL is NOT (the banner must work without QoL loaded,
// using the cost baked into the notice and the fallback money formatter).

const UI_FILES = ['Core/Core.xml', 'Theme/Theme.xml', 'UI/UI.xml'];

function runUI(script, opts = {}) {
	return runAddon({
		stubs: ['stub_ui.lua'],
		before: opts.before || '',
		addons: [{ name: 'Polestar', files: UI_FILES }],
		saved: opts.saved,
		script: `uistub.install()\nstub.login()\nlocal GF = Polestar.UI.GuideFrame\nlocal B = GF.parts.banner\nlocal TABS = { { uistub.elwynn, 3 } }\n${script}`,
	}).emitted;
}

// ---- RIDING_DUE fires banner --------------------------------------------------

test('RIDING_DUE shows a riding banner (icon-mount, title, body, dismiss button)', () => {
	// Before fix: no "riding" notice kind — banner would be absent.
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		local notice = { tier = 1, cost = 1000000,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" }, factionID = 72 }
		function GetMoney() return 1120000 end
		Polestar.Fire("RIDING_DUE", notice)
		emit({ shown = B:IsShown(),
			text  = B.Text:GetText(),
			close = B.Close:IsShown(),
			later = B.Later:IsShown(),
			jump  = B.Jump:IsShown(),
			jumpLabel = B.Jump:IsShown() and B.Jump.Label:GetText() or nil })
	`);
	assert.equal(out.shown, true, 'banner visible');
	assert.ok(out.text.includes('Level 40'), 'title has level');
	assert.ok(out.text.includes('100 g'), 'body has cost');
	assert.ok(out.text.includes('112 g'), 'balance uses "N g" style with space');
	assert.ok(out.text.includes('10% off at Honored'), 'discount always shown');
	assert.equal(out.close, true, 'dismiss × shown');
	assert.equal(out.later, false, 'no Later button');
	assert.equal(out.jump, true, 'Take me there shown when can afford');
	assert.equal(out.jumpLabel, 'Take me there');
});

test('RIDING_DUE hides Take me there when player cannot afford', () => {
	// Before fix: no riding banner kind → jump button state irrelevant.
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 430000 end   -- 43g < 100g
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 1000000,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" }, factionID = 72 })
		emit({ jump = B.Jump:IsShown(), close = B.Close:IsShown() })
	`);
	assert.equal(out.jump, false, 'Take me there hidden when broke');
	assert.equal(out.close, true, 'dismiss still shown');
});

test('RIDING_DUE with classKind WARLOCK shows class mount text and always shows Take me there', () => {
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 0 end   -- 0g, but free for Warlock
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 0,
			trainer = { map = 1413, x = 62.6, y = 35.5, npcName = "Strahad Farsan" }, classKind = "WARLOCK" })
		emit({ text = B.Text:GetText(), jump = B.Jump:IsShown() })
	`);
	assert.ok(out.text.includes('Warlock'), 'Warlock class mount title');
	assert.ok(out.text.includes('Felsteed'), 'Felsteed quest chain in body');
	assert.equal(out.jump, true, 'Take me there always shown for class mount');
});

test('RIDING_DUE with classKind PALADIN shows Tome of Nobility text', () => {
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 0 end
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 0,
			trainer = { map = 1453, x = 48.43, y = 50.22, npcName = "Lord Grayson Shadowbreaker" }, classKind = "PALADIN" })
		emit({ text = B.Text:GetText(), jump = B.Jump:IsShown() })
	`);
	assert.ok(out.text.includes('Paladin'), 'Paladin class mount title');
	assert.ok(out.text.includes('Tome'), 'Tome of Nobility in body');
	assert.equal(out.jump, true, 'Take me there shown for class mount');
});

test('tier 2 banner shows Journeyman Riding title and 1,000 g cost', () => {
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 15000000 end
		Polestar.Fire("RIDING_DUE", { tier = 2, cost = 10000000,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" }, factionID = 72 })
		emit(B.Text:GetText())
	`);
	assert.ok(out.includes('Journeyman'), 'Journeyman Riding title');
	assert.ok(out.includes('1,000 g'), '1000g cost shown');
});

test('banner shows "Honored: 90 g" when player is Honored with home faction', () => {
	// Before fix: discount was skipped when standing was nil; when Honored, showed "10% off" not price.
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 1120000 end
		-- Override GetFactionStanding to return Honored (5) for Stormwind (72).
		Polestar.Compat.GetFactionStanding = function(id) if id == 72 then return 5 end end
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 900000, factionID = 72,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" } })
		emit(B.Text:GetText())
	`);
	assert.ok(out.includes('Honored: 90 g'), 'shows discounted price when Honored');
	assert.ok(!out.includes('10% off at Honored'), 'does not double-show');
});

test('banner shows "10% off at Honored" when faction standing is unknown', () => {
	// Before fix: when GetFactionStanding returns nil, the discount was dropped entirely.
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 1120000 end
		-- Compat.GetFactionStanding returns nil (no faction data yet).
		Polestar.Compat.GetFactionStanding = function() return nil end
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 1000000, factionID = 72,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" } })
		emit(B.Text:GetText())
	`);
	assert.ok(out.includes('10% off at Honored'), 'discount shown even when standing unknown');
});

// ---- Dismiss and Take me there -----------------------------------------------

test('clicking dismiss (×) hides the banner', () => {
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 1120000 end
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 1000000,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" } })
		B.Close:Click()
		emit(B:IsShown())
	`);
	assert.equal(out, false);
});

test('clicking Take me there sets Nav arrow to trainer and hides banner', () => {
	const [out] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 1120000 end
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 1000000,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" } })
		B.Jump:Click()
		local t = uistub.target
		emit({ hidden = not B:IsShown(), map = t and t.map, x = t and t.x, label = t and t.label })
	`);
	assert.equal(out.hidden, true, 'banner hides after Take me there');
	assert.equal(out.map, 1429);
	assert.equal(out.x, 84.3);
	assert.equal(out.label, 'Randal Hunter');
});

// ---- RIDING_MONEY re-renders button ------------------------------------------

test('RIDING_MONEY re-renders banner: adds Take me there once gold crosses threshold', () => {
	// Before fix: no RIDING_MONEY handler → button never appeared after level-up.
	const [before, after] = runUI(`
		uistub.openTabs(TABS, 1)
		local copper = 430000   -- start broke
		function GetMoney() return copper end
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 1000000,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" } })
		emit(B.Jump:IsShown())       -- (1) broke: no button
		copper = 1120000             -- now can afford
		Polestar.Fire("RIDING_MONEY")
		emit(B.Jump:IsShown())       -- (2) rich: button appears
	`);
	assert.equal(before, false, 'no button when broke');
	assert.equal(after, true, 'button appears after RIDING_MONEY when affordable');
});

// ---- Riding banner after train banner priority --------------------------------

test('training banner shows first; riding banner shows after it is dismissed', () => {
	const [first, second] = runUI(`
		uistub.openTabs(TABS, 1)
		function GetMoney() return 1120000 end
		Polestar.Fire("TRAIN_DUE", 12, { npc = 914, npcName = "Ander Germaine", map = 1453, x = 79.6, y = 70.2 })
		Polestar.Fire("RIDING_DUE", { tier = 1, cost = 1000000,
			trainer = { map = 1429, x = 84.3, y = 64.9, npcName = "Randal Hunter" } })
		emit(B.Text:GetText())         -- train has priority
		B.Later:Click()                -- dismiss train via Later
		emit(B.Text:GetText())         -- now riding shows
	`);
	assert.ok(first.includes('Level 12') || first.includes('class skills'), 'train shows first');
	assert.ok(second.includes('Level 40') || second.includes('learn to ride'), 'riding shows after');
});

// ---------------------------------------------------------------------------
// Section 2: Riding.lua unit logic (stub_qol)
// ---------------------------------------------------------------------------

const QOL_FILES = { name: 'Polestar', files: ['Core/Init.lua', 'Core/Compat.lua', 'Theme/Theme.xml', 'QoL/QoL.xml'] };

const PRELUDE = `
local q  = stub.qol
local R  = Polestar.QoL.Riding
local C  = Polestar.Compat
local _ridingRank, _ridingMaxRank = nil, nil
local _spells = {}
local _quests = {}
local _factions = {}

C.GetSkillRank    = function(line) if line == 762 then return _ridingRank, _ridingMaxRank end end
C.IsSpellKnown    = function(id)  return _spells[id] == true end
C.IsQuestCompleted = function(id) return _quests[id] == true end
C.GetFactionStanding = function(id) return _factions[id] end

local function setRiding(tier)
    if tier == 1 then _ridingRank, _ridingMaxRank = 1, 75
    elseif tier == 2 then _ridingRank, _ridingMaxRank = 75, 150
    else _ridingRank, _ridingMaxRank = nil, nil end
end

local function setMoney(copper) q.money = copper end
local function setRep(fid, standing) _factions[fid] = standing end

-- defaults: Human WARRIOR Alliance
C.GetPlayerInfo = function() return { name="T", level=q.level, race="Human", class="WARRIOR", faction="Alliance" } end

local ridings = {}   -- captures from RIDING_DUE
Polestar.On("RIDING_DUE", function(n) ridings[#ridings + 1] = n end)

local function levelUp(n)
    q.level = n
    stub.fire("PLAYER_LEVEL_UP", n, 0,0,0,0,0,0,0,0)
    stub.runTimers()
end

local function enterWorld()
    stub.fire("PLAYER_ENTERING_WORLD")
    stub.runTimers()
end
`;

function runQoL(script, opts = {}) {
	return runAddon({
		stubs: ['stub_qol.lua'],
		addons: [QOL_FILES],
		before: opts.before,
		saved: opts.saved,
		login: true,
		script: PRELUDE + script,
	}).emitted;
}

// ---- RIDING_DUE event fires instead of Print ---------------------------------

test('RIDING_DUE fires at level 40 when riding not known', () => {
	const [count] = runQoL(`levelUp(40); emit(#ridings)`);
	assert.equal(count, 1);
});

test('RIDING_DUE fires with correct tier and trainer', () => {
	const [n] = runQoL(`levelUp(40); emit(ridings[1])`);
	assert.equal(n.tier, 1);
	assert.ok(n.trainer, 'has trainer');
	assert.ok(n.cost > 0, 'cost baked in');
});

test('no RIDING_DUE at level 39', () => {
	const [count] = runQoL(`levelUp(39); emit(#ridings)`);
	assert.equal(count, 0);
});

test('no RIDING_DUE when riding (Apprentice) is already known', () => {
	const [count] = runQoL(`setRiding(1); levelUp(40); emit(#ridings)`);
	assert.equal(count, 0);
});

test('RIDING_DUE fires only once per tier (second Check is silent)', () => {
	const [first, second] = runQoL(`
		levelUp(40); emit(#ridings)
		ridings = {}
		R.Check(40); emit(#ridings)
	`);
	assert.equal(first, 1);
	assert.equal(second, 0);
});

test('once-per-tier note flag persists across reload', () => {
	const [count] = runQoL(`levelUp(40); emit(#ridings)`, {
		saved: { Polestar: `PolestarCharDB = { schema = 1, flags = { ridingReminder40 = true } }` },
	});
	assert.equal(count, 0);
});

// ---- Tier 2 ------------------------------------------------------------------

test('RIDING_DUE fires at level 60 when only Apprentice known', () => {
	const [n] = runQoL(`setRiding(1); q.level=59; levelUp(60); emit(ridings[1])`);
	assert.ok(n, 'event fired');
	assert.equal(n.tier, 2);
});

test('no RIDING_DUE at 60 when Journeyman known', () => {
	const [count] = runQoL(`setRiding(2); levelUp(60); emit(#ridings)`);
	assert.equal(count, 0);
});

// ---- PLAYER_ENTERING_WORLD ---------------------------------------------------

test('RIDING_DUE fires on login for level-40 character who has not seen it', () => {
	const [count] = runQoL(`
		q.level = 40
		C.GetPlayerInfo = function() return { name="T", level=40, race="Human", class="WARRIOR", faction="Alliance" } end
		enterWorld(); emit(#ridings)
	`);
	assert.equal(count, 1);
});

test('no RIDING_DUE on login at level 39', () => {
	const [count] = runQoL(`
		q.level = 39
		C.GetPlayerInfo = function() return { name="T", level=39, race="Human", class="WARRIOR", faction="Alliance" } end
		enterWorld(); emit(#ridings)
	`);
	assert.equal(count, 0);
});

test('login silent when note flag already set', () => {
	const [count] = runQoL(`
		q.level = 40
		C.GetPlayerInfo = function() return { name="T", level=40, race="Human", class="WARRIOR", faction="Alliance" } end
		enterWorld(); emit(#ridings)
	`, {
		saved: { Polestar: `PolestarCharDB = { schema = 1, flags = { ridingReminder40 = true } }` },
	});
	assert.equal(count, 0);
});

// ---- RIDING_MONEY fires when note set but not resolved -----------------------

test('RIDING_MONEY fires when gold changes and tier is pending', () => {
	const moneyEvents = [];
	const [fired] = runQoL(`
		local moneyFired = 0
		Polestar.On("RIDING_MONEY", function() moneyFired = moneyFired + 1 end)
		levelUp(40)                           -- note fires, watcher registers
		stub.fire("PLAYER_MONEY")
		stub.runTimers()
		emit(moneyFired)
	`);
	assert.ok(fired >= 1, 'RIDING_MONEY fired at least once');
});

test('RIDING_MONEY stops firing after OnResolve is called', () => {
	const [before, after] = runQoL(`
		local count = 0
		Polestar.On("RIDING_MONEY", function() count = count + 1 end)
		levelUp(40)
		stub.fire("PLAYER_MONEY"); stub.runTimers()
		emit(count)
		R.OnResolve(1)
		count = 0
		stub.fire("PLAYER_MONEY"); stub.runTimers()
		emit(count)
	`);
	assert.ok(before >= 1, 'fires before resolve');
	assert.equal(after, 0, 'silent after resolve');
});

// ---- Class routing (RIDING_DUE carries correct trainer) ----------------------

test('Warlock fires with classKind WARLOCK and Strahad Farsan', () => {
	const [n] = runQoL(`
		C.GetPlayerInfo = function() return { name="T", level=q.level, race="Human", class="WARLOCK", faction="Alliance" } end
		levelUp(40); emit(ridings[1])
	`);
	assert.equal(n.classKind, 'WARLOCK');
	assert.equal(n.trainer.npcName, 'Strahad Farsan');
	assert.equal(n.cost, 0, 'cost is 0 for class mount');
});

test('Alliance Paladin fires with classKind PALADIN and Lord Grayson', () => {
	const [n] = runQoL(`
		C.GetPlayerInfo = function() return { name="T", level=q.level, race="Human", class="PALADIN", faction="Alliance" } end
		levelUp(40); emit(ridings[1])
	`);
	assert.equal(n.classKind, 'PALADIN');
	assert.equal(n.trainer.npcName, 'Lord Grayson Shadowbreaker');
});

test('Warlock at tier 2 fires with no classKind (riding trainer)', () => {
	const [n] = runQoL(`
		C.GetPlayerInfo = function() return { name="T", level=q.level, race="Orc", class="WARLOCK", faction="Horde" } end
		setRiding(1); q.level=59; levelUp(60); emit(ridings[1])
	`);
	assert.ok(!n.classKind, 'no classKind at tier 2');
	assert.equal(n.trainer.npcName, 'Kildar', 'Orc trainer at tier 2');
});

test('Warlock with quest 4490 done falls back to race trainer', () => {
	const [n] = runQoL(`
		_quests[4490] = true
		C.GetPlayerInfo = function() return { name="T", level=q.level, race="Human", class="WARLOCK", faction="Alliance" } end
		levelUp(40); emit(ridings[1])
	`);
	assert.ok(!n.classKind, 'no classKind after chain done');
	assert.equal(n.trainer.npcName, 'Randal Hunter');
});

test('Undead Paladin fires with riding trainer (no class chain)', () => {
	const [n] = runQoL(`
		C.GetPlayerInfo = function() return { name="T", level=q.level, race="Scourge", class="PALADIN", faction="Horde" } end
		levelUp(40); emit(ridings[1])
	`);
	assert.ok(!n.classKind);
	assert.equal(n.trainer.npcName, 'Velma Warnam');
});

// ---- EffectiveCost includes Honored discount ---------------------------------

test('EffectiveCost returns 900000 when Honored with home faction', () => {
	const [cost] = runQoL(`
		setRep(72, 5)    -- Honored with Stormwind
		emit(R.EffectiveCost(1, 72))
	`);
	assert.equal(cost, 900000);
});

test('EffectiveCost returns full 1000000 when not Honored', () => {
	const [cost] = runQoL(`emit(R.EffectiveCost(1, 72))`);
	assert.equal(cost, 1000000);
});

// ---- option off --------------------------------------------------------------

test('option off: no RIDING_DUE fires', () => {
	const [count] = runQoL(`
		Polestar.Set("qol.ridingReminder", false)
		levelUp(40); emit(#ridings)
	`);
	assert.equal(count, 0);
});

// ---- HasRiding ---------------------------------------------------------------

test('HasRiding(1) false with no skill', () => {
	const [v] = runQoL(`emit(R.HasRiding(1))`);
	assert.equal(v, false);
});
test('HasRiding(1) true with apprentice rank', () => {
	const [v] = runQoL(`setRiding(1); emit(R.HasRiding(1))`);
	assert.equal(v, true);
});
test('HasRiding(2) false with only apprentice', () => {
	const [v] = runQoL(`setRiding(1); emit(R.HasRiding(2))`);
	assert.equal(v, false);
});
test('HasRiding(2) true with journeyman', () => {
	const [v] = runQoL(`setRiding(2); emit(R.HasRiding(2))`);
	assert.equal(v, true);
});
test('HasRiding(1) true via IsSpellKnown(33388)', () => {
	const [v] = runQoL(`_spells[33388] = true; emit(R.HasRiding(1))`);
	assert.equal(v, true);
});
