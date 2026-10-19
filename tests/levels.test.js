'use strict';
// What a list of quests is worth in levels (addon/Polestar/Core/Levels.lua):
// the quests still to do in turn-in order, with the client's reduction for
// quests far below, against the tools' own XP rules (tools/lib/game/xp.js);
// and a guide's turn-ins for this character, their XP from the Codex.
// tests/ui-dungeons.test.js and tests/ui-picker-levels.test.js cover the
// chips and their tooltip.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');
const { LEVEL_XP, MAX_LEVEL, questXpShare } = require('../tools/lib/game/xp');
const { luaValue } = require('../tools/lib/playtest');

const FILES = ['Core/Core.xml'];

function lua(script) {
	return runAddon({ stubs: ['stub_world.lua'], addons: [{ name: 'Polestar', files: FILES }], script: `stub.login()\nlocal Lv = Polestar.Levels\n${script}` }).emitted;
}

// quests: { id, level, xp (null: none known), classes } in turn-in order; done: the ids done.
function run(player, quests, done = []) {
	const [s] = lua(`local done = {}
for _, id in ipairs(${luaValue(done)}) do done[id] = true end
Polestar.Compat.IsQuestCompleted = function(id) return done[id] or false end
emit(Lv.Run(${luaValue(quests)}, ${luaValue(player)}))`);
	return s;
}

test('the level table and the reduction are the tools\' own', () => {
	const [out] = lua(`local shares = {}
for p = 1, 60 do for q = 1, 60 do shares[#shares + 1] = Lv.Share(p, q) end end
emit({ table = Lv.LEVEL_XP, max = Lv.MAX_LEVEL, shares = shares })`);
	assert.deepEqual(out.table, LEVEL_XP.slice(1), 'Levels.LEVEL_XP is tools/lib/game/xp.js LEVEL_XP');
	assert.equal(out.max, MAX_LEVEL);
	const shares = [];
	for (let p = 1; p <= 60; p++) for (let q = 1; q <= 60; q++) shares.push(questXpShare(p, q));
	assert.deepEqual(out.shares, shares);
});

test('quests in turn-in order carry the character over a level; the client\'s XP to level counts for the level it is at', () => {
	const s = run({ level: 20, xp: 19800, xpMax: 23000, class: 'DRUID', faction: 'Horde' }, [
		{ id: 1, level: 18, xp: 2000 },
		{ id: 2, level: 22, xp: 2400 },
	]);
	assert.equal(s.quests, 2);
	assert.equal(s.xp, 4400);
	assert.deepEqual(s.from, { level: 20, xp: 19800, need: 23000 });
	// 19,800 + 4,400 = 24,200: 23,000 (the client's) to 21, 1,200 into 21 of 25,200.
	assert.deepEqual(s.to, { level: 21, xp: 1200, need: 25200 });
	assert.ok(Math.abs(s.levels - (21 + 1200 / 25200 - (20 + 19800 / 23000))) < 1e-9);
	assert.equal(s.maxed, false);
});

test('a quest far below gives its share, at the level reached when it is turned in', () => {
	// At 26 the level 17 quest is 9 below: 20%. The level 20 one is 6 below: 80%.
	const s = run({ level: 26, xp: 0, class: 'MAGE', faction: 'Alliance' }, [
		{ id: 1, level: 17, xp: 1000 },
		{ id: 2, level: 20, xp: 1000 },
		{ id: 3, level: 25, xp: 1000 },
	]);
	assert.equal(s.xp, 200 + 800 + 1000);
	assert.equal(s.reduced, 2);
	assert.equal(s.quests, 3);
	// The order counts: a level gained on the way reduces what comes after.
	const late = run({ level: 25, xp: 36000, class: 'MAGE', faction: 'Alliance' }, [
		{ id: 1, level: 25, xp: 1000 },
		{ id: 2, level: 20, xp: 1000 },
	]);
	assert.equal(late.to.level, 26);
	assert.equal(late.xp, 1000 + 800, 'turned in at 26, the level 20 quest is 6 below');
});

test('done quests, another class\'s and those with no XP known are left out and counted apart', () => {
	const s = run({ level: 20, xp: 0, class: 'DRUID', faction: 'Horde' }, [
		{ id: 1, level: 20, xp: 1000 },
		{ id: 2, level: 20, xp: 1000 },
		{ id: 3, level: 20, xp: 1000, classes: ['WARRIOR'] },
		{ id: 4, level: 20, xp: null },
	], [2]);
	assert.equal(s.xp, 1000);
	assert.deepEqual([s.quests, s.done, s.other, s.unknown], [1, 1, 1, 1]);
});

test('at 60 nothing counts: the summary says maxed; the XP stops at 60', () => {
	const s = run({ level: 60, xp: 0, class: 'DRUID', faction: 'Horde' }, [{ id: 1, level: 58, xp: 9000 }]);
	assert.equal(s.maxed, true);
	assert.equal(s.xp, 0);
	assert.equal(s.levels, 0);
	const last = run({ level: 59, xp: 209000, class: 'DRUID', faction: 'Horde' }, [{ id: 1, level: 59, xp: 9000 }]);
	assert.equal(last.to.level, 60);
	assert.equal(last.to.xp, 0);
});

// A guide of turn-ins, some for one race or class only, one quest twice; the
// Codex gives each quest's level and XP (9 none known).
const GUIDE = `
local guide = { id = "sample", steps = {
	{ goals = { { t = "accept", quest = 1 }, { t = "turnin", quest = 1 }, { t = "turnin", quest = 2, only = { races = { "Tauren" } } } } },
	{ only = { classes = { "WARRIOR" } }, goals = { { t = "turnin", quest = 3 } } },
	{ goals = { { t = "turnin", quest = 4 }, { t = "turnin", quest = 1 }, { t = "turnin", quest = 9 } } },
} }
Polestar.Guides.Get = function(id) return id == "sample" and guide or nil end
local CODEX = { [1] = { level = 10, xp = 1000 }, [2] = { level = 10, xp = 2000 }, [3] = { level = 10, xp = 4000 }, [4] = { level = 12, xp = 500 }, [9] = { level = 12 } }
Polestar.Codex = { IsLoaded = function() return true end, Load = function() return true end, Quest = function(id) return CODEX[id] end }
`;

test('a guide: its turn-ins for this character in route order, each once, the XP from the Codex', () => {
	const [orc, tauren, warrior, none, noCodex] = lua(`${GUIDE}
local function p(race, class) return { level = 10, xp = 0, class = class, race = race, faction = "Horde" } end
local function brief(s) return s and { xp = s.xp, quests = s.quests, unknown = s.unknown, to = s.to.level } or false end
emit(brief(Lv.ForGuide("sample", p("Orc", "SHAMAN"))))
emit(brief(Lv.ForGuide("sample", p("Tauren", "DRUID"))))
emit(brief(Lv.ForGuide("sample", p("Orc", "WARRIOR"))))
emit(Lv.ForGuide("nowhere", p("Orc", "SHAMAN")) == nil)
Polestar.Codex.IsLoaded = function() return false end
Polestar.Codex.Load = function() return false, "missing" end
emit(Lv.ForGuide("sample", p("Orc", "SHAMAN")) == nil)`);
	assert.deepEqual(orc, { xp: 1500, quests: 2, unknown: 1, to: 10 });
	assert.deepEqual(tauren, { xp: 3500, quests: 3, unknown: 1, to: 10 }, 'the Tauren-only turn-in counts for a Tauren');
	assert.deepEqual(warrior, { xp: 5500, quests: 3, unknown: 1, to: 10 }, 'the Warrior step counts for a Warrior');
	assert.equal(none, true, 'an unknown guide has no summary');
	assert.equal(noCodex, true, 'without the Codex there is nothing to count');
});

test('a kill is worth what the tools say: every player level, mob level and elite', () => {
	const { mobXp } = require('../tools/lib/game/xp');
	const [got] = lua(`local out = {}
for p = 1, 60 do for m = 1, 63 do out[#out + 1] = Lv.MobXP(p, m, false); out[#out + 1] = Lv.MobXP(p, m, true) end end
emit(out)`);
	const want = [];
	for (let p = 1; p <= 60; p++) for (let m = 1; m <= 63; m++) want.push(mobXp(p, m, false), mobXp(p, m, true));
	assert.deepEqual(got, want);
});

test('kills in route order: each at the level reached, nothing for grey mobs; summed apart from the quests', () => {
	// At 10, 380 of 7,600: a level 10 mob is 95 a kill; a level 3 mob is grey.
	const s = run({ level: 10, xp: 7400, class: 'MAGE', faction: 'Alliance' }, [
		{ kind: 'kill', n: 2, mob: 10 },
		{ kind: 'kill', n: 1, mob: 3 },
		{ id: 1, level: 10, xp: 500 },
		{ kind: 'kill' },
	]);
	// 7,400 + 95 + 95 = 7,590; then 500: 7,600 to 11, 490 in.
	assert.deepEqual([s.kills, s.killXP, s.questXP, s.xp, s.killsUnknown], [3, 190, 500, 690, 1]);
	assert.deepEqual(s.to, { level: 11, xp: 490, need: 8800 });
	// A level gained on the way: the level 10 mob is worth less at 11.
	const up = run({ level: 10, xp: 7550, class: 'MAGE', faction: 'Alliance' }, [{ kind: 'kill', n: 2, mob: 10 }]);
	assert.equal(up.killXP, 95 + Math.round(100 * (1 - 1 / 7)));
});

test('below the start level the sums run from it, at none of its XP; the character is kept as now', () => {
	const s = run({ level: 8, xp: 300, xpMax: 5400, class: 'MAGE', faction: 'Alliance' }, [{ id: 1, level: 12, xp: 1000 }]);
	assert.equal(s.below, undefined, 'no start given: from where the character is');
	const [b] = lua(`emit(Lv.Run({ { id = 1, level = 12, xp = 1000 } }, { level = 8, xp = 300, xpMax = 5400, class = "MAGE" }, 12))`);
	assert.equal(b.below, 12);
	assert.deepEqual(b.now, { level: 8, xp: 300, need: 5400 });
	assert.deepEqual(b.from, { level: 12, xp: 0, need: 10100 });
	assert.deepEqual(b.to, { level: 12, xp: 1000, need: 10100 });
	const [same] = lua(`emit(Lv.Run({}, { level = 12, xp = 50, class = "MAGE" }, 12).below == nil)`);
	assert.equal(same, true, 'at the start level: not below');
});

// A guide of kill and loot goals: an objective split over two steps, a done
// quest's objective, loot from its own mob, loot also picked up from an
// object, a mob the Codex does not know.
const KILLS = `
local guide = { id = "hunt", minLevel = 10, steps = {
	{ goals = { { t = "kill", quest = 20, oi = 1, npc = 100, count = 4 } } },
	{ goals = { { t = "kill", quest = 20, oi = 1, npc = 100, count = 4 }, { t = "kill", quest = 21, oi = 1, npc = 100, count = 5 } } },
	{ goals = { { t = "collect", quest = 22, oi = 1, item = 500, count = 3, fromKind = "npc", fromId = 101 } } },
	{ goals = { { t = "collect", quest = 23, oi = 1, item = 501, count = 6 } } },
	{ goals = { { t = "kill", quest = 24, oi = 1, npc = 999, count = 2 } } },
} }
Polestar.Guides.Get = function(id) return id == "hunt" and guide or nil end
local NPCS = { [100] = { level = 10, levelMax = 12 }, [101] = { level = 10, elite = true }, [102] = { level = 10 } }
local ITEMS = {
	[500] = { sources = { { type = "drop", npc = 102, chance = 90 }, { type = "drop", npc = 101, chance = 50 } } },
	[501] = { sources = { { type = "drop", npc = 102, chance = 50 }, { type = "object", object = 7 } } },
}
Polestar.Codex = { IsLoaded = function() return true end, Quest = function() return nil end,
	Npc = function(id) return NPCS[id] end, Item = function(id) return ITEMS[id] end }
Polestar.Compat.IsQuestCompleted = function(id) return id == 21 end
`;

test('a guide\'s kills: kill goals and loot from mobs, an objective once, none for done quests or gathered loot', () => {
	const [s] = lua(`${KILLS}
emit(Lv.ForGuide("hunt", { level = 10, xp = 0, class = "MAGE", race = "Human", faction = "Alliance" }))`);
	// Quest 20: 4 kills of the level 11 mob (10-12) once; quest 21 done; quest
	// 22: 3 / 50% = 6 kills of its own elite mob; 23 is also an object: none;
	// mob 999 unknown.
	assert.equal(s.kills, 4 + 6);
	assert.equal(s.killsUnknown, 1);
	assert.equal(s.below, undefined);
	const at10 = (mob, elite) => require('../tools/lib/game/xp').mobXp(10, mob, elite);
	assert.equal(s.killXP, 4 * at10(11) + 6 * at10(10, true));
	const [low] = lua(`${KILLS}
local s = Lv.ForGuide("hunt", { level = 7, xp = 100, class = "MAGE", race = "Human", faction = "Alliance" })
emit({ below = s.below, from = s.from.level, now = s.now.level })`);
	assert.deepEqual(low, { below: 10, from: 10, now: 7 }, 'below the guide\'s minLevel: from there');
});
