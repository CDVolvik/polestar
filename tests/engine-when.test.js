'use strict';
// Conditions checked during play (`when` on a step, addon/Polestar/Core/Engine.lua):
// a step applies only while its predicates hold, checked on the live state
// until the route moves past the step; from then on the outcome is stored
// (CharState().when), so a passed step never comes back when the condition
// changes, and a reload keeps it. Real Core manifest, stub world (a level 1
// Human Warrior in Elwynn Forest).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');
const { TEST_PACK, TEST_SOURCE } = require('./helpers/packs');
const { luaValue } = require('../tools/lib/playtest');

const CORE = { name: 'Polestar', files: ['Core/Core.xml'] };

const WORLD = `
local w = stub.world
w.addMap(1429, { name = "Elwynn Forest", c = 0, left = 1500, right = -1500, top = 500, bottom = -1500 })
w.moveTo(1429, 48, 42)
w.titles[783] = "A Threat Within"; w.titles[7] = "Kobold Camp Cleanup"
`;

// Step 2 is the conditional one: a trainer visit between taking and handing
// in A Threat Within. `when` is Lua for step 2's predicates.
function guide(when) {
	return `
Polestar.RegisterGuide({
	id = "test/when", pack = "test", title = "When", minLevel = 1, maxLevel = 10,
	steps = {
		{ title = "Deputy Willem", goals = {
			{ t = "accept", quest = 783, title = "A Threat Within", npc = 823, npcName = "Deputy Willem", map = 1429, x = 48.2, y = 42.0 },
		} },
		{ title = "Trainer", when = ${when}, goals = {
			{ t = "train", npc = 911, npcName = "Llane Beshere" },
		} },
		{ title = "Marshal McBride", goals = {
			{ t = "turnin", quest = 783, title = "A Threat Within", npc = 197, npcName = "Marshal McBride", map = 1429, x = 48.9, y = 41.6 },
		} },
	},
})
`;
}

const HELPERS = `
E = Polestar.Engine
function flush() stub.advance(0.25) end
-- The live step, step 2's status and what keeps it off.
function state() local v = E.GetStepView(2); return { live = E.GetLiveStep(), status = v.status, unmet = v.unmet } end
`;

function run({ when, before = '', saved = 'PolestarCharDB = { schema = 1, guide = "test/when" }', script }) {
	return runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD + before,
		addons: [CORE],
		saved: { Polestar: saved },
		script: `${TEST_PACK}
${TEST_SOURCE}\n${guide(when)}\n${HELPERS}\nstub.login()\nstub.fire("QUEST_LOG_UPDATE"); stub.advance(0.6)\n${script}`,
	}).emitted;
}

// The player has taken A Threat Within: step 2 or 3 is the live step.
const TAKEN = 'w.onQuest(783, {})';

test('a step applies while its `when` holds, and is passed (status na, unmet names the predicate) while it does not', () => {
	const [low, high] = run({
		when: '{ { k = "level", op = "<", n = 3 } }',
		before: TAKEN,
		script: `
			emit(state())
			stub.world.setLevel(3); flush()
			emit(state())
		`,
	});
	assert.deepEqual(low, { live: 2, status: 'current' });
	assert.deepEqual(high, { live: 3, status: 'na', unmet: { k: 'level', op: '<', n: 3 } });
});

test('once the route has moved past a step, its outcome is stored: a failed `when` never brings the step back, and a reload keeps it', () => {
	const [first, after, db] = run({
		when: '{ { k = "has", item = 159, n = 1, neg = true } }',
		before: `${TAKEN}; w.addItem(159, 1)`,
		script: `
			emit(state())
			stub.world.addItem(159, -1); flush()
			emit(state())
			stub.fire("PLAYER_LOGOUT")
			emit(PolestarCharDB.when)
		`,
	});
	assert.deepEqual(first, { live: 3, status: 'na', unmet: { k: 'has', item: 159, n: 1, neg: true } });
	// Without the stored outcome the water used up would pull the guide back to step 2.
	assert.deepEqual(after, { live: 3, status: 'na', unmet: true });
	assert.deepEqual(db, { 'test/when': { 2: false } });

	const [reloaded] = run({
		when: '{ { k = "has", item = 159, n = 1, neg = true } }',
		before: TAKEN,
		saved: `PolestarCharDB = ${luaValue({ schema: 1, guide: 'test/when', when: { 'test/when': { 2: false } } })}`,
		script: 'emit(state())',
	});
	assert.deepEqual(reloaded, { live: 3, status: 'na', unmet: true });
});

test('a step that applied stays applied once passed, and ResetProgress forgets the stored outcomes', () => {
	const [passed, later, reset] = run({
		when: '{ { k = "level", op = "<", n = 3 } }',
		before: TAKEN,
		script: `
			stub.world.trainer(911); flush(); stub.world.close(); flush()
			local a = state()
			stub.world.setLevel(5); flush()
			local b = state()
			E.ResetProgress(); flush()
			emit(a); emit(b); emit(state())
		`,
	});
	assert.deepEqual(passed, { live: 3, status: 'done' });
	assert.deepEqual(later, { live: 3, status: 'done' });
	// Reset, the route is placed again: at level 5 the step no longer applies.
	assert.deepEqual(reset, { live: 3, status: 'na', unmet: { k: 'level', op: '<', n: 3 } });
});

test('quest predicates: onquest (any of), complete, turnedin and their negations', () => {
	const [rows] = run({
		when: 'WHEN',
		before: `${TAKEN}
			WHEN = { { k = "level", op = ">=", n = 1 } }`,
		script: `
			local G = Polestar.Guides.Get("test/when")
			local w = stub.world
			local out = {}
			local function check(label, preds) PolestarCharDB.when["test/when"] = nil; G.steps[2].when = preds; flush(); out[#out + 1] = label .. "=" .. E.GetStepView(2).status end
			check("onquest 7,783", { { k = "onquest", q = { 7, 783 } } })
			check("onquest 7", { { k = "onquest", q = { 7 } } })
			check("!onquest 7", { { k = "onquest", q = { 7 }, neg = true } })
			check("complete 783", { { k = "complete", q = 783 } })
			check("!complete 783", { { k = "complete", q = 783, neg = true } })
			check("turnedin 776", { { k = "turnedin", q = 776 } })
			w.complete({ 776 })
			check("turnedin 776 done", { { k = "turnedin", q = 776 } })
			check("!turnedin 776 done", { { k = "turnedin", q = 776, neg = true } })
			emit(out)
		`,
	});
	assert.deepEqual(rows, [
		'onquest 7,783=current', 'onquest 7=na', '!onquest 7=current',
		'complete 783=current', '!complete 783=na',
		'turnedin 776=na', 'turnedin 776 done=current', '!turnedin 776 done=na',
	]);
});

test('available: not taken or done, the level reached, prerequisites done and nothing that closes it taken', () => {
	const [rows] = run({
		when: 'WHEN',
		before: `${TAKEN}
			WHEN = { { k = "level", op = ">=", n = 1 } }`,
		script: `
			local G = Polestar.Guides.Get("test/when")
			local w = stub.world
			local out = {}
			local function check(label, pred) pred.k = "available"; PolestarCharDB.when["test/when"] = nil; G.steps[2].when = { pred }; flush(); out[#out + 1] = label .. "=" .. E.GetStepView(2).status end
			check("free", { q = 60 })
			check("in log", { q = 783 })
			check("level 4", { q = 60, minLevel = 4 })
			check("pre 33", { q = 60, pre = { 33 } })
			check("preAll 33,34", { q = 60, preAll = { 33, 34 } })
			w.complete({ 33 })
			check("pre 33 done", { q = 60, pre = { 33 } })
			check("preAll 33,34 one done", { q = 60, preAll = { 33, 34 } })
			check("closedBy 783", { q = 60, closedBy = { 783 } })
			check("!available free", { q = 60, neg = true })
			emit(out)
		`,
	});
	assert.deepEqual(rows, [
		'free=current', 'in log=na', 'level 4=na', 'pre 33=na', 'preAll 33,34=na',
		'pre 33 done=current', 'preAll 33,34 one done=na', 'closedBy 783=na', '!available free=na',
	]);
});

test('zone, subzone and bound read the area name in the client\'s language, else the name the guide wrote', () => {
	const [rows] = run({
		when: 'WHEN',
		before: `${TAKEN}
			WHEN = { { k = "level", op = ">=", n = 1 } }
			C_Map.GetAreaInfo = function(id) return ({ [12] = "Forêt d'Elwynn", [87] = "Comté-de-l'Or" })[id] end
			w.setZone("Forêt d'Elwynn", "Comté-de-l'Or"); w.bind("Comté-de-l'Or")`,
		script: `
			local G = Polestar.Guides.Get("test/when")
			local out = {}
			local function check(label, pred) PolestarCharDB.when["test/when"] = nil; G.steps[2].when = { pred }; flush(); out[#out + 1] = label .. "=" .. E.GetStepView(2).status end
			check("zone area", { k = "zone", name = "Elwynn Forest", area = 12 })
			check("zone name", { k = "zone", name = "Forêt d'Elwynn" })
			check("zone other", { k = "zone", name = "Westfall" })
			check("!zone other", { k = "zone", name = "Westfall", neg = true })
			check("subzone area", { k = "subzone", name = "Goldshire", area = 87 })
			check("subzone is not the zone", { k = "subzone", name = "Elwynn Forest", area = 12 })
			check("bound area", { k = "bound", name = "Goldshire", area = 87 })
			check("!bound area", { k = "bound", name = "Goldshire", area = 87, neg = true })
			emit(out)
		`,
	});
	assert.deepEqual(rows, [
		'zone area=current', 'zone name=current', 'zone other=na', '!zone other=current',
		'subzone area=current', 'subzone is not the zone=na', 'bound area=current', '!bound area=na',
	]);
});

test('a turn-in whose only accept sits in a step passed by its `when` goes with it', () => {
	const [view] = runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD,
		addons: [CORE],
		saved: { Polestar: 'PolestarCharDB = { schema = 1, guide = "test/side" }' },
		script: `${TEST_PACK}
${TEST_SOURCE}
Polestar.RegisterGuide({
	id = "test/side", pack = "test", title = "Side", minLevel = 1, maxLevel = 10,
	steps = {
		{ title = "Side quest", when = { { k = "level", op = ">=", n = 5 } }, goals = {
			{ t = "accept", quest = 7, title = "Kobold Camp Cleanup", npc = 197, npcName = "Marshal McBride", map = 1429, x = 48.9, y = 41.6 },
		} },
		{ title = "Deputy Willem", goals = {
			{ t = "accept", quest = 783, title = "A Threat Within", npc = 823, npcName = "Deputy Willem", map = 1429, x = 48.2, y = 42.0 },
			{ t = "turnin", quest = 7, title = "Kobold Camp Cleanup", npc = 197, npcName = "Marshal McBride", map = 1429, x = 48.9, y = 41.6 },
		} },
	},
})
${HELPERS}
stub.login()
stub.fire("QUEST_LOG_UPDATE"); stub.advance(0.6)
local v = E.GetStepView(2)
emit({ live = E.GetLiveStep(), turnin = v.goals[2].status })
`,
	}).emitted;
	assert.deepEqual(view, { live: 2, turnin: 'na' });
});

test('a guide with a malformed `when` is refused', () => {
	const [out] = runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD,
		addons: [CORE],
		script: `
local V = Polestar.Guides.Validate
local function step(when) return { id = "test/x", title = "X", steps = { { when = when, goals = { { t = "level", level = 2 } } } } } end
emit({
	ok = V(step({ { k = "level", op = "<", n = 3 }, { k = "onquest", q = { 7 } }, { k = "has", item = 159 }, { k = "zone", name = "Elwynn Forest" } })) or false,
	empty = V(step({})),
	op = V(step({ { k = "level", op = "=", n = 3 } })),
	kind = V(step({ { k = "money", n = 3 } })),
	quests = V(step({ { k = "onquest", q = 7 } })),
	place = V(step({ { k = "bound" } })),
})
`,
	}).emitted;
	assert.deepEqual(out, {
		ok: false,
		empty: 'step 1: bad when',
		op: 'step 1: bad when',
		kind: 'step 1: bad when',
		quests: 'step 1: bad when',
		place: 'step 1: bad when',
	});
});
