'use strict';
// Conditional hand-offs (`next <id> when ...`, a guide's `nextWhen`; Engine
// "Route choice"): an option whose `when` does not hold is hidden wherever
// the options are listed (routeOptions, ChooseRoute, Engine.RouteOffered,
// Guides.OfferedBy), checked on the character as they are then. One option
// left: Polestar continues to it without asking; none: the guide ends there.
// The chain of guides ahead (prerequisites kept by "Skip grey quests") leaves
// out an option that can no longer hold. Real Core manifest, stub world.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');
const { TEST_PACK, TEST_SOURCE } = require('./helpers/packs');

const CORE = { name: 'Polestar', files: ['Core/Core.xml'] };

const WORLD = `
local w = stub.world
w.addMap(1411, { name = "Durotar", c = 1, left = -3000, right = -6000, top = 1000, bottom = -2000 })
w.addMap(1413, { name = "The Barrens", c = 1, left = 0, right = -3000, top = 1000, bottom = -2000 })
w.addMap(1421, { name = "Silverpine Forest", c = 0, left = 3000, right = 0, top = 0, bottom = -3000 })
w.race, w.raceName, w.faction, w.class = "Orc", "Orc", "Horde", "WARRIOR"
w.moveTo(1411, 52, 43)
`;

// Durotar goes on to the Barrens or Silverpine; `nextWhen` is Lua for its conditions.
function guides(nextWhen) {
	return `
Polestar.RegisterGuide({ id = "test/durotar", pack = "test", title = "Durotar", faction = "Horde", minLevel = 1, maxLevel = 10,
	next = "test/barrens", nextChoices = { "test/barrens", "test/silverpine" }, nextWhen = ${nextWhen}, steps = {
	{ goals = { { t = "accept", quest = 1, title = "Your Place In The World", map = 1411, x = 42, y = 68 } } },
	{ goals = { { t = "turnin", quest = 1, title = "Your Place In The World", map = 1411, x = 52, y = 43 } } },
} })
Polestar.RegisterGuide({ id = "test/barrens", pack = "test", title = "The Barrens", faction = "Horde", minLevel = 10, maxLevel = 20, zone = 1413,
	pitch = "Dense quests around a central hub.", steps = {
	{ goals = { { t = "goto", map = 1413, x = 52, y = 30 } } },
	{ goals = { { t = "level", level = 20 } } },
} })
Polestar.RegisterGuide({ id = "test/silverpine", pack = "test", title = "Silverpine Forest", faction = "Horde", minLevel = 10, maxLevel = 18, zone = 1421,
	pitch = "A quiet zone next to Undercity.", steps = {
	{ goals = { { t = "goto", map = 1421, x = 43, y = 41 } } },
	{ goals = { { t = "level", level = 18 } } },
} })
`;
}

const HELPERS = `
E, G = Polestar.Engine, Polestar.Guides
w = stub.world
function flush() stub.advance(0.25) end
LOG = {}
for _, m in ipairs({ "ROUTE_CHOICE", "GUIDE_CHANGED" }) do
	Polestar.On(m, function(a) LOG[#LOG + 1] = m .. " " .. tostring(a) end)
end
function takeLog() local l = LOG; LOG = {}; return l end
function finish()
	w.accept(1, {}); flush()
	w.finish(1); w.turnIn(1); flush()
end
function ids(list, key)
	local out = {}
	for i, x in ipairs(list or {}) do out[i] = key and x[key] or x.id end
	return out
end
-- What every place that lists Durotar's options sees now.
function offers()
	local c = E.GetRouteChoice("test/durotar")
	return {
		choice = c and ids(c.options) or false,
		barrens = E.RouteOffered("test/durotar", "test/barrens"),
		silverpine = E.RouteOffered("test/durotar", "test/silverpine"),
		offeredBy = { barrens = ids(G.OfferedBy("test/barrens")), silverpine = ids(G.OfferedBy("test/silverpine")) },
		next = E.NextGuide("test/durotar") or false,
	}
end
`;

function run({ nextWhen, before = '', saved, script }) {
	return runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD + before,
		addons: [CORE],
		saved,
		script: `${TEST_PACK}
${TEST_SOURCE}\n${guides(nextWhen)}\n${HELPERS}\nstub.login()\n${script}`,
	}).emitted;
}

const BARRENS_FROM_5 = '{ ["test/barrens"] = { { k = "level", op = ">=", n = 5 } } }';

test('an option whose `when` does not hold is hidden everywhere; the one left is taken without asking', () => {
	const [before, chose, after] = run({
		nextWhen: BARRENS_FROM_5,
		script: `
			E.SetGuide("test/durotar"); flush(); takeLog()
			emit(offers())
			emit(E.ChooseRoute("test/durotar", "test/barrens"))
			finish()
			emit({ log = takeLog(), guide = E.GetGuide().id })`,
	});
	assert.deepEqual(before, {
		choice: ['test/silverpine'],
		barrens: false,
		silverpine: true,
		offeredBy: { barrens: {}, silverpine: ['test/durotar'] },
		next: 'test/silverpine',
	});
	// A hidden option cannot be chosen.
	assert.equal(chose, false);
	// No "Choose your path": Polestar goes on to the one option offered.
	assert.deepEqual(after, { log: ['GUIDE_CHANGED test/silverpine'], guide: 'test/silverpine' });
});

test('once the `when` holds, the option is offered again and the player chooses', () => {
	const [offered, after] = run({
		nextWhen: BARRENS_FROM_5,
		script: `
			E.SetGuide("test/durotar"); flush()
			w.setLevel(5); flush(); takeLog()
			emit(offers())
			finish()
			local r = { log = takeLog(), guide = E.GetGuide().id, pending = E.PendingRouteChoice() }
			r.chose = E.ChooseRoute("test/durotar", "test/barrens"); flush()
			r.now = E.GetGuide().id
			emit(r)`,
	});
	assert.deepEqual(offered, {
		choice: ['test/barrens', 'test/silverpine'],
		barrens: true,
		silverpine: true,
		offeredBy: { barrens: ['test/durotar'], silverpine: ['test/durotar'] },
		next: false,
	});
	assert.deepEqual(after, { log: ['ROUTE_CHOICE test/durotar'], guide: 'test/durotar', pending: 'test/durotar', chose: true, now: 'test/barrens' });
});

test('with no option offered the guide ends without a hand-off, until one holds', () => {
	const [ended, later] = run({
		nextWhen: '{ ["test/barrens"] = { { k = "level", op = ">=", n = 5 } }, ["test/silverpine"] = { { k = "has", item = 159, n = 1 } } }',
		script: `
			E.SetGuide("test/durotar"); flush(); takeLog()
			finish()
			local r = offers()
			r.log, r.guide, r.pending = takeLog(), E.GetGuide().id, E.PendingRouteChoice() or false
			emit(r)
			w.addItem(159, 1); flush()
			emit(offers())`,
	});
	assert.deepEqual(ended, {
		choice: false,
		barrens: false,
		silverpine: false,
		offeredBy: { barrens: {}, silverpine: {} },
		next: false,
		log: {},
		guide: 'test/durotar',
		pending: false,
	});
	assert.deepEqual(later.choice, ['test/silverpine']);
	assert.equal(later.next, 'test/silverpine');
});

test('changing route offers the choice only while it has two options for the character', () => {
	const [low, high] = run({
		nextWhen: BARRENS_FROM_5,
		script: `
			E.SetGuide("test/silverpine"); flush()
			emit(E.RouteChoiceFor("test/silverpine") or false)
			w.setLevel(5); flush()
			emit(E.RouteChoiceFor("test/silverpine") or false)`,
	});
	assert.equal(low, false);
	assert.equal(high, 'test/durotar');
});

test('a guide whose `nextWhen` is malformed or names a guide it does not offer is refused', () => {
	for (const bad of ['{ ["test/barrens"] = {} }', '{ ["test/stonetalon"] = { { k = "level", op = "<", n = 5 } } }', '{ ["test/barrens"] = { { k = "level", op = "=", n = 5 } } }', '"level<5"']) {
		const [out] = run({ nextWhen: bad, script: 'emit(G.Get("test/durotar") ~= nil)' });
		assert.equal(out, false, bad);
	}
});

// "Skip grey quests" keeps a grey quest a guide down the chain needs. An
// option that can no longer be offered (a `level<N` the character is past)
// is no longer down the chain; one that may still hold stays, and the chain
// is looked at again once it is past.
test('the chain ahead leaves out an option that can no longer be offered', () => {
	const chainGuides = (when) => `
		Polestar.RegisterGuide({ id = "test/g1", pack = "test", title = "G1", faction = "Horde", minLevel = 1, maxLevel = 30,
			next = "test/g2", nextChoices = { "test/g2" }, nextWhen = { ["test/g2"] = { ${when} } }, steps = {
			{ goals = { { t = "accept", quest = 103, title = "Grey prerequisite", qlvl = 4 } } },
			{ goals = { { t = "accept", quest = 104, title = "Current", qlvl = 19 } } },
		} })
		Polestar.RegisterGuide({ id = "test/g2", pack = "test", title = "G2", faction = "Horde", minLevel = 20, maxLevel = 30, steps = {
			{ goals = { { t = "accept", quest = 105, title = "Follow-up", qlvl = 20, pre = { 103 } } } },
		} })`;
	const play = (when, script) =>
		runAddon({
			stubs: ['stub_world.lua'],
			before: `${WORLD}\nw.level = 20`,
			addons: [CORE],
			saved: { Polestar: 'PolestarDB = { schema = 1, settings = { behavior = { skipGrey = true } } }' },
			script: `${TEST_PACK}\n${TEST_SOURCE}\n${chainGuides(when)}\n${HELPERS}\nstub.login()\nE.SetGuide("test/g1"); flush()\n${script}`,
		}).emitted;
	const grey = 'local function grey() return E.GetStepView(1).goals[1].status end';
	// Past `level<20`: G2 is never offered, so its prerequisite is grey and skipped.
	assert.deepEqual(play('{ k = "level", op = "<", n = 20 }', `${grey}\nemit(grey())`), ['na']);
	// `level>=25` may hold by the hand-off: the prerequisite stays.
	assert.deepEqual(play('{ k = "level", op = ">=", n = 25 }', `${grey}\nemit(grey())`), ['active']);
	// `level<21` holds at 20; at 21 it never will again.
	assert.deepEqual(play('{ k = "level", op = "<", n = 21 }', `${grey}\nemit(grey())\nw.setLevel(21); flush()\nemit(grey())`), ['active', 'na']);
});
