'use strict';
// `along` steps at runtime (addon/Polestar/Core/Engine.lua; docs/GUIDE_FORMAT.md,
// "Along the way"): the route passes over an along step at once; while the
// live step is past it, Engine.GetAlong lists its open goals, until they are
// done or, with `along = "<label>"`, until the live step reaches the step so
// labelled. Engine.AimAlong leads the arrow to one of them. Core/Guides.lua
// checks `label` and `along`. Real Core manifest, stub world.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');
const { TEST_PACK, TEST_SOURCE } = require('./helpers/packs');

const CORE = { name: 'Polestar', files: ['Core/Core.xml'] };

const WORLD = `
local w = stub.world
w.addMap(1429, { name = "Elwynn Forest", c = 0, left = 1500, right = -1500, top = 500, bottom = -1500 })
w.moveTo(1429, 48, 42)
w.titles[783] = "A Threat Within"; w.titles[7] = "Kobold Camp Cleanup"
`;

// 1 accept 7 · 2 along until "back": kill 10 vermin for quest 7 (placed),
// hold 2 candles (no place) · 3 along: hold 1 linen (placed) · 4 accept 783 ·
// 5 "back": turn in 7 · 6 level 6
const STEPS = {
	along2: 'along = "back"',
	along3: 'along = true',
};
function guide({ along2 = STEPS.along2, along3 = STEPS.along3 } = {}) {
	return `
Polestar.RegisterGuide({
	id = "test/along", pack = "test", title = "Along", minLevel = 1, maxLevel = 6,
	steps = {
		{ title = "McBride", goals = { { t = "accept", quest = 7, title = "Kobold Camp Cleanup", npc = 197, npcName = "Marshal McBride", map = 1429, x = 48.9, y = 41.6 } } },
		{ title = "Kobolds on the way", ${along2}, goals = {
			{ t = "kill", target = "Kobold Vermin", npc = 6, count = 10, quest = 7, oi = 1, map = 1429, x = 47.6, y = 35.1 },
			{ t = "collect", item = 750, itemName = "Candle", count = 2 },
		} },
		{ title = "Linen", ${along3}, goals = { { t = "collect", item = 2589, itemName = "Linen Cloth", count = 1, map = 1429, x = 40.0, y = 60.0 } } },
		{ title = "Willem", goals = { { t = "accept", quest = 783, title = "A Threat Within", npc = 823, npcName = "Deputy Willem", map = 1429, x = 48.2, y = 42.0 } } },
		{ title = "Back to McBride", label = "back", goals = { { t = "turnin", quest = 7, title = "Kobold Camp Cleanup", npc = 197, npcName = "Marshal McBride", map = 1429, x = 48.9, y = 41.6 } } },
		{ title = "End", goals = { { t = "level", level = 6 } } },
	},
})
`;
}

const HELPERS = `
E = Polestar.Engine
function flush() stub.advance(0.25) end
-- "<step>:<goal>[:<progress>]" for each goal Engine.GetAlong lists.
function along()
	local out = {}
	for _, s in ipairs(E.GetAlong()) do
		for _, g in ipairs(s.goals) do
			out[#out + 1] = s.index .. ":" .. g.index .. (g.progress and (":" .. g.progress.cur) or "")
		end
	end
	return table.concat(out, " ")
end
function wp()
	local w = E.GetWaypoint()
	return w and (w.stepIndex .. ":" .. w.goalIndex) or "none"
end
`;

function run(script, opts) {
	return runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD,
		addons: [CORE],
		saved: { Polestar: 'PolestarCharDB = { schema = 1, guide = "test/along" }' },
		script: `${TEST_PACK}\n${TEST_SOURCE}\n${guide(opts)}\n${HELPERS}\nstub.login()\nstub.fire("QUEST_LOG_UPDATE"); stub.advance(0.6)\n${script}`,
	}).emitted;
}

test('the route passes over along steps; their open goals are listed until done, or until the labelled step', () => {
	const out = run(`
		local w = stub.world
		emit({ E.GetLiveStep(), along() })              -- before them: nothing along
		w.accept(7, { 10 }); flush()
		emit({ E.GetLiveStep(), along() })              -- live step 4; steps 2 and 3 are along
		w.progress(7, 1, 4); flush()
		emit(along())                                   -- progress shows
		w.progress(7, 1, 10); w.addItem(750, 2); flush()
		emit(along())                                   -- step 2's goals done: gone
		w.addItem(2589, 1); flush()
		emit(along())                                   -- step 3's too
	`);
	assert.deepEqual(out, [[1, ''], [4, '2:1:0 2:2:0 3:1:0'], '2:1:4 2:2:0 3:1:0', '3:1:0', '']);
});

test('reaching the step `until` names ends the list with goals still open; a plain `along` stays', () => {
	const out = run(`
		local w = stub.world
		w.accept(7, { 10 }); flush()
		w.accept(783, {}); flush()
		emit({ E.GetLiveStep(), along() })
	`);
	assert.deepEqual(out, [[5, '3:1:0']]);
});

test('an along step that does not apply (`when`, `only`) or that the player skipped is not listed', () => {
	const out = run(`
		stub.world.accept(7, { 10 }); flush()
		emit({ E.GetLiveStep(), along() })
	`, { along2: 'along = "back", only = { classes = { "MAGE" } }', along3: 'along = true, when = { { k = "level", op = ">=", n = 50 } }' });
	assert.deepEqual(out, [[4, '']]);
	const skipped = run(`
		stub.world.accept(7, { 10 }); flush()
		E.Goto(3); E.Skip(); flush()
		emit({ E.GetLiveStep(), along() })
	`);
	assert.deepEqual(skipped, [[4, '2:1:0 2:2:0']]);
});

test('the step view says which steps are along and which carry a label; the list carries the step title', () => {
	const out = run(`
		stub.world.accept(7, { 10 }); flush()
		emit({ E.GetStepView(2).along, E.GetStepView(3).along, E.GetStepView(5).label, E.GetStepView(4).along == nil })
		emit(E.GetAlong()[1].title)
	`);
	assert.deepEqual(out, [['back', true, 'back', true], 'Kobolds on the way']);
});

test('AimAlong leads the arrow to a listed, placed, open along goal and refuses anything else', () => {
	const out = run(`
		local w = stub.world
		emit(E.AimAlong(2, 1))                 -- not behind the live step yet
		w.accept(7, { 10 }); flush()
		emit(wp())                             -- Willem
		emit({ E.AimAlong(2, 2), E.AimAlong(4, 1), E.AimAlong(2, 9) })   -- no place, not along, no goal
		emit(E.AimAlong(2, 1)); flush()
		emit(wp())
		local v = E.GetWaypoint()
		emit({ v.x, v.y, v.kind })
	`);
	assert.deepEqual(out, [false, '4:1', [false, false, false], true, '2:1', [47.6, 35.1, 'kill']]);
});

test('the arrow\'s along choice lapses when the goal is done, and holds while the route moves on', () => {
	const done = run(`
		local w = stub.world
		w.accept(7, { 10 }); flush()
		E.AimAlong(2, 1); flush()
		emit(wp())
		w.progress(7, 1, 10); flush()
		emit(wp())
	`);
	assert.deepEqual(done, ['2:1', '4:1']);
	const moved = run(`
		local w = stub.world
		w.accept(7, { 10 }); flush()
		E.AimAlong(3, 1); flush()
		emit(wp())
		w.accept(783, {}); flush()              -- live step 5; step 3 (no until) is still listed
		emit({ E.GetLiveStep(), wp() })
		emit(E.AimAlong(2, 1))                  -- step 2 ended at its label (step 5)
	`);
	assert.deepEqual(moved, ['3:1', [5, '3:1'], false]);
});

test('Guides.Validate refuses a bad label or along', () => {
	const out = run(`
		local function def(steps) return { id = "test/x", pack = "test", title = "X", steps = steps } end
		local G = { { t = "level", level = 2 } }
		emit(Polestar.Guides.Validate(def({ { along = "b", goals = G }, { label = "b", goals = G } })) == nil)
		emit(Polestar.Guides.Validate(def({ { along = true, goals = G } })) == nil)
		emit(Polestar.Guides.Validate(def({ { label = 5, goals = G } })))
		emit(Polestar.Guides.Validate(def({ { label = "a", goals = G }, { label = "a", goals = G } })))
		emit(Polestar.Guides.Validate(def({ { along = "nowhere", goals = G } })))
		emit(Polestar.Guides.Validate(def({ { label = "b", goals = G }, { along = "b", goals = G } })))
		emit(Polestar.Guides.Validate(def({ { along = 3, goals = G } })))
	`);
	assert.deepEqual(out, [true, true, 'step 1: bad label', 'step 2: duplicate label a', 'step 1: bad along', 'step 2: bad along', 'step 1: bad along']);
});
