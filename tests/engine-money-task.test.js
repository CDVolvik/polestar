'use strict';
// Money and tasks (addon/Polestar/Core/Engine.lua): a `money` goal is done once
// the character holds that much and stays done for the rest of its step; a
// `when money` step applies by the money held when the route reaches it; a
// `task` goal is done only when the player ticks it, and holds its step until
// then unless it is optional. Real Core manifest, stub world (a level 1 Human
// Warrior in Elwynn Forest, with no money).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');
const { TEST_PACK, TEST_SOURCE } = require('./helpers/packs');

const CORE = { name: 'Polestar', files: ['Core/Core.xml'] };

const WORLD = `
local w = stub.world
w.addMap(1429, { name = "Elwynn Forest", c = 0, left = 1500, right = -1500, top = 500, bottom = -1500 })
w.moveTo(1429, 48, 42)
w.titles[783] = "A Threat Within"
`;

// Step 2 holds `goals` (Lua) and, when given, `when`; steps 1 and 3 are plain.
function guide(goals, when) {
	return `
Polestar.RegisterGuide({
	id = "test/money", pack = "test", title = "Money", minLevel = 1, maxLevel = 10,
	steps = {
		{ title = "Deputy Willem", goals = {
			{ t = "accept", quest = 783, title = "A Threat Within", npc = 823, npcName = "Deputy Willem", map = 1429, x = 48.2, y = 42.0 },
		} },
		{ title = "Middle", ${when ? `when = ${when}, ` : ''}goals = ${goals} },
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
-- The live step and step 2's goals as status:text.
function state()
	local v = E.GetStepView(2)
	local goals = {}
	for i, g in ipairs(v.goals) do goals[i] = g.status .. ":" .. (g.text or "") end
	return { live = E.GetLiveStep(), status = v.status, goals = goals }
end
`;

function run({ goals, when, before = '', script }) {
	return runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD + 'w.onQuest(783, {})\n' + before,
		addons: [CORE],
		saved: { Polestar: 'PolestarCharDB = { schema = 1, guide = "test/money" }' },
		script: `${TEST_PACK}
${TEST_SOURCE}\n${guide(goals, when)}\n${HELPERS}\nstub.login()\nstub.fire("QUEST_LOG_UPDATE"); stub.advance(0.6)\n${script}`,
	}).emitted;
}

test('a money goal is done once the character holds that much, and stays done for the rest of its step', () => {
	const [poor, rich, spent] = run({
		goals: '{ { t = "money", money = 150 }, { t = "train", npc = 911, npcName = "Llane Beshere" } }',
		script: `
			emit(state())
			stub.world.setMoney(150); flush()
			emit(state())
			stub.world.setMoney(20); flush()
			emit(state())
		`,
	});
	assert.deepEqual(poor, { live: 2, status: 'current', goals: ['active:Have at least 1s 50c', 'active:Train at Llane Beshere'] });
	assert.deepEqual(rich.goals[0], 'done:Have at least 1s 50c');
	// Spending it before the step ends does not undo the goal (the trainer is still to visit).
	assert.deepEqual(spent, { live: 2, status: 'current', goals: ['done:Have at least 1s 50c', 'active:Train at Llane Beshere'] });
});

test('a step with `when money` applies by the money held when the route reaches it', () => {
	const train = '{ { t = "train", npc = 911, npcName = "Llane Beshere" } }';
	const [enough] = run({ goals: train, when: '{ { k = "money", op = ">=", n = 100 } }', before: 'w.setMoney(100)', script: 'emit(state())' });
	assert.equal(enough.live, 2);
	assert.equal(enough.status, 'current');
	const [short, later] = run({
		goals: train,
		when: '{ { k = "money", op = ">=", n = 100 } }',
		before: 'w.setMoney(99)',
		script: `
			emit(state())
			stub.world.setMoney(500); flush()
			emit(state())
		`,
	});
	assert.equal(short.live, 3);
	assert.equal(short.status, 'skipped');
	// Passed for want of money, it does not come back once the money is there.
	assert.equal(later.live, 3);
	const [below] = run({ goals: train, when: '{ { k = "money", op = "<", n = 100 } }', before: 'w.setMoney(99)', script: 'emit(state())' });
	assert.equal(below.live, 2);
});

test('a task holds its step until the player ticks it; an optional task never holds it', () => {
	const [before, ticked] = run({
		goals: '{ { t = "task", text = "Tame a Venomtail Scorpid" } }',
		script: `
			stub.world.setMoney(5000); stub.world.setLevel(5); flush()
			emit(state())
			E.ToggleGoal(2, 1); flush()
			emit(state())
		`,
	});
	assert.deepEqual(before, { live: 2, status: 'current', goals: ['active:Tame a Venomtail Scorpid'] });
	assert.equal(ticked.live, 3);
	assert.deepEqual(ticked.goals, ['done:Tame a Venomtail Scorpid']);

	const [optional] = run({
		goals: '{ { t = "task", text = "Buy a green weapon if it is cheaper", optional = true }, { t = "train", npc = 911, npcName = "Llane Beshere" } }',
		script: `
			stub.world.trainer(911); flush(); stub.world.close(); flush()
			emit(state())
		`,
	});
	assert.equal(optional.live, 3, 'the optional task did not hold the step');
});

test('a guide whose money or task goal lacks its field is refused', () => {
	const [out] = runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD,
		addons: [CORE],
		script: `
local V = Polestar.Guides.Validate
local function with(goal) return { id = "test/x", title = "X", steps = { { goals = { goal } } } } end
emit({
	ok = V(with({ t = "money", money = 100 })) or V(with({ t = "task", text = "Do it" })) or false,
	money = V(with({ t = "money" })),
	task = V(with({ t = "task" })),
})
`,
	}).emitted;
	assert.equal(out.ok, false);
	assert.match(out.money, /money/);
	assert.match(out.task, /text/);
});
