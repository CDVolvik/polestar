'use strict';
// The catch-up: a character who already did part of the route opens a
// leveling guide and it resumes where they are, as placement does, leaving
// out what is too low to be worth it: grey quests anywhere, green ones behind
// the last quest progress, the way to them, and a whole guide they are past
// (it chains to the next one). A low quest a later quest worth doing needs is
// kept. Guides that are not leveling ones, a guide whose author says
// `skip none`, and a guide the player sets to every step do every step.
// Real Core manifest, stub world.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');
const { TEST_PACK, TEST_SOURCE } = require('./helpers/packs');

const CORE = { name: 'Polestar', files: ['Core/Core.xml'] };

// A level-20 Human: grey at 13 and below, green from 14 to 17, yellow from 18.
const WORLD = `
local w = stub.world
w.addMap(1429, { name = "Elwynn Forest", c = 0, left = 1500, right = -1500, top = 500, bottom = -1500 })
w.moveTo(1429, 50, 50)
w.race, w.raceName, w.faction, w.class, w.className = "Human", "Human", "Alliance", "WARRIOR", "Warrior"
w.level = 20
`;

// test/low (1-12): grey for them, done in part. test/mid (15-22): a trip to a
// green quest behind their progress, a grey quest a yellow one needs, a
// green quest still in the log behind it, and the last quest they did.
const GUIDES = `
Polestar.RegisterGuide({ id = "test/low", pack = "test", title = "Low", faction = "Alliance", minLevel = 1, maxLevel = 12, next = "test/mid", steps = {
	{ goals = { { t = "accept", quest = 101, title = "Grey done", qlvl = 5 } } },
	{ goals = { { t = "goto", map = 1429, x = 10, y = 10, label = "Farm" } } },
	{ goals = { { t = "accept", quest = 102, title = "Grey not done", qlvl = 6 } } },
	{ goals = { { t = "turnin", quest = 102, title = "Grey not done" }, { t = "turnin", quest = 101, title = "Grey done" } } },
	{ goals = { { t = "fly", location = "Stormwind City" } } },
} })
Polestar.RegisterGuide({ id = "test/mid", pack = "test", title = "Mid", faction = "Alliance", minLevel = 15, maxLevel = 22, steps = {
	{ goals = { { t = "goto", map = 1429, x = 20, y = 20, label = "Town" } } },
	{ goals = { { t = "accept", quest = 201, title = "Green behind", qlvl = 15 } } },
	{ goals = { { t = "goto", map = 1429, x = 30, y = 30, label = "Camp" } } },
	{ goals = { { t = "turnin", quest = 201, title = "Green behind" } } },
	{ goals = { { t = "accept", quest = 202, title = "Grey needed", qlvl = 12 } } },
	{ goals = { { t = "turnin", quest = 202, title = "Grey needed" }, { t = "accept", quest = 203, title = "Yellow", qlvl = 19, pre = { 202 } } } },
	{ goals = { { t = "accept", quest = 206, title = "Green in the log", qlvl = 14 } } },
	{ goals = { { t = "turnin", quest = 206, title = "Green in the log" } } },
	{ goals = { { t = "accept", quest = 204, title = "Done", qlvl = 16 } } },
	{ goals = { { t = "accept", quest = 205, title = "Ahead", qlvl = 20 } } },
	{ goals = { { t = "turnin", quest = 203, title = "Yellow" } } },
} })
`;

function run({ before = '', guides = GUIDES, saved, script }) {
	return runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD + before,
		addons: [CORE],
		saved,
		script: `${TEST_PACK}
${TEST_SOURCE}
${guides}
			E = Polestar.Engine
			function flush() stub.advance(0.25) end
			PLACED = {}
			Polestar.On("GUIDE_PLACED", function(id, step, chain)
				PLACED[#PLACED + 1] = { id = id, step = step or false, chain = table.concat(chain or {}, ",") }
			end)
			stub.login()
			stub.fire("QUEST_LOG_UPDATE"); stub.advance(0.6)
			${script}`,
	}).emitted;
}

const DONE = 'stub.world.complete({ 101, 204 }); stub.world.onQuest(206, {})';
const OFF = { Polestar: 'PolestarDB = { schema = 1, settings = { behavior = { skipGrey = false } } }' };

// Each step's status, as the guide window shows it ("na": left out).
const STATUSES = `
	local function statuses()
		local out = {}
		for i = 1, #E.GetGuide().steps do
			local goals = E.GetStepView(i).goals
			out[i] = goals[#goals].status
		end
		return out
	end
`;

test('a level-20 character opening a grey guide is taken through it to the next, and resumes at the grey quest a yellow one needs', () => {
	const [out] = run({
		before: DONE,
		script: `${STATUSES}
			E.SetGuide("test/low"); flush()
			emit({ guide = E.GetGuide().id, at = E.GetStepIndex(), placed = PLACED[#PLACED], statuses = statuses() })
		`,
	});
	assert.equal(out.guide, 'test/mid');
	assert.equal(out.at, 5, 'the grey quest Yellow needs, after the trip to the green quest left behind');
	assert.deepEqual(out.placed, { id: 'test/mid', step: 5, chain: 'test/low' });
	// Green behind, its turn-in and the quest still in the log behind are left out; the trips pass.
	assert.deepEqual(out.statuses.slice(0, 9), ['done', 'na', 'done', 'na', 'active', 'pending', 'na', 'na', 'done']);
});

test('without "Skip grey quests" the guide is placed as before: the first quest not done, in the first guide', () => {
	const [out] = run({
		before: DONE,
		saved: OFF,
		script: 'E.SetGuide("test/low"); flush(); emit({ guide = E.GetGuide().id, at = E.GetStepIndex() })',
	});
	assert.deepEqual(out, { guide: 'test/low', at: 3 }, 'the trip to the farm is behind a quest turned in');
});

test('a leveling guide set to every step, by its player or by its author, keeps its grey quests and what lies behind', () => {
	const [mine] = run({
		before: DONE,
		script: `
			E.SetGuide("test/mid"); flush()
			local caught = E.GetStepIndex()
			local before = { E.GetEveryStep("test/mid") }
			E.SetEveryStep("test/mid", true); flush()
			local all = E.GetStepIndex()
			E.SetEveryStep("test/mid", false); flush()
			emit({ caught = caught, before = before, all = all, again = E.GetStepIndex(), saved = PolestarCharDB.everyStep or false })
		`,
	});
	// Every step: back to the green quest behind (the trip before it was already passed).
	assert.deepEqual(mine, { caught: 5, before: [false, true], all: 2, again: 5, saved: false });

	const author = GUIDES.replace('title = "Mid",', 'title = "Mid", everyStep = true,');
	const [theirs] = run({
		before: DONE,
		guides: author,
		script: 'E.SetGuide("test/mid"); flush(); emit({ at = E.GetStepIndex(), every = { E.GetEveryStep("test/mid") }, set = E.SetEveryStep("test/mid", false) })',
	});
	assert.deepEqual(theirs, { at: 2, every: [true, false], set: false });
});

test('a guide that is not a leveling one does every step: an item guide keeps its quests grey or not', () => {
	const item = `
		Polestar.RegisterGuide({ id = "test/bag", pack = "test", title = "Bag", category = "Collectibles", minLevel = 14, maxLevel = 60, steps = {
			{ goals = { { t = "accept", quest = 301, title = "First clue", qlvl = 8 } } },
			{ goals = { { t = "turnin", quest = 301, title = "First clue" } } },
			{ goals = { { t = "accept", quest = 302, title = "Second clue", qlvl = 9 } } },
		} })
	`;
	const [out] = run({
		guides: item,
		script: `${STATUSES}
			E.SetGuide("test/bag"); flush()
			emit({ at = E.GetStepIndex(), statuses = statuses(), every = { E.GetEveryStep("test/bag") } })
		`,
	});
	assert.deepEqual(out, { at: 1, statuses: ['active', 'pending', 'pending'], every: [true, false] });
});

test('a quest left out comes back when the player takes it by hand, and a level the guide waits for keeps it from passing whole', () => {
	const [byHand] = run({
		before: DONE,
		script: `${STATUSES}
			E.SetGuide("test/mid"); flush()
			stub.world.accept(201, {}, "Green behind"); flush()
			local s = statuses()
			emit({ accept = s[2], turnin = s[4] })
		`,
	});
	assert.deepEqual(byHand, { accept: 'done', turnin: 'active' }, 'its turn-in is the step now');

	// test/low with a quest for level 21: the guide is not passed whole.
	const waiting = GUIDES.replace('{ goals = { { t = "fly", location = "Stormwind City" } } },',
		'{ goals = { { t = "accept", quest = 103, title = "Later", qlvl = 21, minLevel = 21 } } },');
	const [held] = run({
		before: DONE,
		guides: waiting,
		script: 'E.SetGuide("test/low"); flush(); emit(E.GetGuide().id)',
	});
	assert.equal(held, 'test/low');
});

test('a reload places the guide again at the same step; with nothing behind the player, the guide is placed as before', () => {
	const [reload] = run({
		before: DONE,
		saved: { Polestar: 'PolestarCharDB = { schema = 1, tabs = { "test/mid" }, activeTab = 1 }' },
		script: 'emit({ at = E.GetStepIndex(), placed = PLACED[#PLACED] })',
	});
	assert.deepEqual(reload, { at: 5, placed: { id: 'test/mid', step: 5, chain: '' } });

	const [fresh] = run({
		script: 'E.SetGuide("test/mid"); flush(); emit(E.GetStepIndex())',
	});
	assert.equal(fresh, 1, 'nothing done: the guide starts at its first step');
});
