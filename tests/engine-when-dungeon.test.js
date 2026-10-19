'use strict';
// `when dungeon` during play (addon/Polestar/Core/Engine.lua): the step
// applies while the character has chosen to run the dungeon
// (CharState().dungeons[map], Engine.ChooseDungeon; Options, Discovery,
// Dungeons), `!dungeon` while they have not. None is chosen by default. A
// choice re-evaluates the guide at once; a step the route has passed keeps
// its stored outcome. Real Core manifest, stub world (a level 1 Human
// Warrior in Elwynn Forest), as tests/engine-when.test.js.

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
w.titles[783] = "A Threat Within"
w.onQuest(783, {})
`;

// Step 2 is the conditional one, between taking and handing in A Threat
// Within: `when` is Lua for its predicates.
function guide(when) {
	return `
Polestar.RegisterGuide({
	id = "test/dungeon", pack = "test", title = "Dungeon", minLevel = 1, maxLevel = 10,
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
function state() local v = E.GetStepView(2); return { live = E.GetLiveStep(), status = v.status } end
`;

const RFC = '{ { k = "dungeon", name = "Ragefire Chasm", map = 389 } }';
const NOT_RFC = '{ { k = "dungeon", name = "Ragefire Chasm", map = 389, neg = true } }';

function run({ when, saved = 'PolestarCharDB = { schema = 1, guide = "test/dungeon" }', login = '', script }) {
	return runAddon({
		stubs: ['stub_world.lua'],
		before: WORLD,
		addons: [CORE],
		saved: { Polestar: saved },
		script: `${TEST_PACK}
${TEST_SOURCE}\n${guide(when)}\n${HELPERS}\nstub.login()\n${login}\nstub.fire("QUEST_LOG_UPDATE"); stub.advance(0.6)\n${script}`,
	}).emitted;
}

test('by default no dungeon is chosen: a `when dungeon` step is passed, a `when !dungeon` step applies', () => {
	const [chosen, db] = run({ when: RFC, script: 'emit(state()); emit({ dungeons = PolestarCharDB.dungeons, chosen = E.DungeonChosen(389) })' });
	assert.deepEqual(chosen, { live: 3, status: 'skipped' });
	assert.deepEqual(db, { dungeons: {}, chosen: false });
	const [not] = run({ when: NOT_RFC, script: 'emit(state())' });
	assert.deepEqual(not, { live: 2, status: 'current' });
});

test('choosing the dungeon before the route reaches the step makes it apply, and the choice is saved per character', () => {
	const [view, db] = run({
		when: RFC,
		saved: `PolestarCharDB = ${luaValue({ schema: 1, guide: 'test/dungeon', dungeons: { 389: true } })}`,
		script: 'emit(state()); stub.fire("PLAYER_LOGOUT"); emit(PolestarCharDB.dungeons)',
	});
	assert.deepEqual(view, { live: 2, status: 'current' });
	assert.deepEqual(db, { 389: true });
	const [not] = run({ when: NOT_RFC, saved: `PolestarCharDB = ${luaValue({ schema: 1, guide: 'test/dungeon', dungeons: { 389: true } })}`, script: 'emit(state())' });
	assert.deepEqual(not, { live: 3, status: 'skipped' });
});

test('a choice re-evaluates the guide at once; ChooseDungeon(map, false) takes it back', () => {
	// Before the quest log is read nothing is stored, so step 2 is decided
	// live: it applies while chosen, and does not (na) once taken back.
	const [on, off] = run({
		when: RFC,
		login: 'E.ChooseDungeon(389, true); stub.advance(0.25); emit(state()); E.ChooseDungeon(389, false); stub.advance(0.25); emit(state())',
		script: '',
	});
	assert.deepEqual(on, { live: 2, status: 'current' });
	assert.deepEqual(off, { live: 3, status: 'na' });
});

test('a step the route has passed keeps its stored outcome when the choice changes later', () => {
	const [passed, chosen, db] = run({
		when: RFC,
		script: `
			emit(state())
			E.ChooseDungeon(389, true); flush()
			emit(state())
			stub.fire("PLAYER_LOGOUT")
			emit({ skipped = PolestarCharDB.skipped, dungeons = PolestarCharDB.dungeons })
		`,
	});
	assert.deepEqual(passed, { live: 3, status: 'skipped' });
	assert.deepEqual(chosen, { live: 3, status: 'skipped' });
	assert.deepEqual(db, { skipped: { 'test/dungeon': { 2: true } }, dungeons: { 389: true } });
});

test('a dungeon the compiler found no map id for is never chosen: `dungeon` never holds, `!dungeon` always does', () => {
	const [rows] = run({
		when: 'WHEN',
		saved: `PolestarCharDB = ${luaValue({ schema: 1, guide: 'test/dungeon', dungeons: { 389: true } })}
			WHEN = { { k = "level", op = ">=", n = 1 } }`,
		script: `
			local G = Polestar.Guides.Get("test/dungeon")
			local out = {}
			local function check(label, pred) PolestarCharDB.when["test/dungeon"] = nil; PolestarCharDB.skipped["test/dungeon"] = nil; G.steps[2].when = { pred }; flush(); out[#out + 1] = label .. "=" .. E.GetStepView(2).status end
			check("chosen", { k = "dungeon", name = "Ragefire Chasm", map = 389 })
			check("other", { k = "dungeon", name = "The Deadmines", map = 36 })
			check("!other", { k = "dungeon", name = "The Deadmines", map = 36, neg = true })
			check("no map", { k = "dungeon", name = "Ragefire Chasmm" })
			check("!no map", { k = "dungeon", name = "Ragefire Chasmm", neg = true })
			emit(out)
		`,
	});
	assert.deepEqual(rows, ['chosen=current', 'other=na', '!other=current', 'no map=na', '!no map=current']);
});
