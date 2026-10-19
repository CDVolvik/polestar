'use strict';
// The catch-up, with "Skip grey quests" on (off by default): a character who
// already did part of the route opens a leveling guide and it resumes where
// they are, as placement does, leaving out what is too low to be worth it:
// grey quests anywhere, green ones behind the last quest progress, the way to
// them, and a whole guide they are past (opened for them, it chains to the
// next one; opened by them, it stays). A low quest a later quest worth doing
// needs is kept. Guides that are not leveling ones do every step. Real Core
// manifest, stub world.

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

// test/low (1-12): grey for them, done in part, with a grey quest handed in
// with no accept (`turnin ... direct`, as Distracting Jarven in Dun
// Morogh). test/mid (15-22): a trip to a green quest behind their progress, a grey quest a yellow one needs, a
// green quest still in the log behind it (kept: they chose it), and the last
// quest they did.
const GUIDES = `
Polestar.RegisterGuide({ id = "test/low", pack = "test", title = "Low", faction = "Alliance", minLevel = 1, maxLevel = 12, next = "test/mid", steps = {
	{ goals = { { t = "accept", quest = 101, title = "Grey done", qlvl = 5 } } },
	{ goals = { { t = "goto", map = 1429, x = 10, y = 10, label = "Farm" } } },
	{ goals = { { t = "accept", quest = 102, title = "Grey not done", qlvl = 6 } } },
	{ goals = { { t = "turnin", quest = 102, title = "Grey not done" }, { t = "turnin", quest = 101, title = "Grey done" } } },
	{ goals = { { t = "turnin", quest = 104, title = "Grey direct", direct = true, qlvl = 7 } } },
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

// Saved variables with "Skip grey quests" on (plus `extra` behaviour
// settings) and the character's own (`db`, none by default).
function catchUpOn(extra = '', db = 'PolestarCharDB = nil') {
	return { Polestar: `PolestarDB = { schema = 1, settings = { behavior = { skipGrey = true${extra} } } }; ${db}` };
}
const ON = catchUpOn();
// No guide picked at login: Start guide opens one for the player.
const PICK_OFF = catchUpOn(', autoSelectGuide = false');

function run({ before = '', guides = GUIDES, saved = ON, script }) {
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

test('a level-20 character given a grey guide is taken through it to the next, and resumes at the grey quest a yellow one needs', () => {
	const [out] = run({
		before: DONE,
		saved: PICK_OFF,
		script: `${STATUSES}
			E.StartGuide(); flush()
			emit({ guide = E.GetGuide().id, at = E.GetStepIndex(), placed = PLACED[#PLACED], statuses = statuses() })
		`,
	});
	assert.equal(out.guide, 'test/mid');
	assert.equal(out.at, 5, 'the grey quest Yellow needs, after the trip to the green quest left behind');
	assert.deepEqual(out.placed, { id: 'test/mid', step: 5, chain: 'test/low' });
	// Green behind and its turn-in are left out, the trips pass; the quest in the log keeps its turn-in.
	assert.deepEqual(out.statuses.slice(0, 9), ['done', 'na', 'done', 'na', 'active', 'pending', 'done', 'pending', 'done']);
});

// Yendi at 30 in Duskwood (25-27): Gather Rot Blossoms (24) and The Night
// Watch (26) in the log, neither done. In the log by the same rules as a quest
// not taken: too low and not done, it goes; done, it stays to be handed in.
test('a low quest in the log goes while it is not done, and stays once it only has to be handed in', () => {
	const duskwood = `
		Polestar.RegisterGuide({ id = "test/dusk", pack = "test", title = "Duskwood", faction = "Alliance", minLevel = 25, maxLevel = 27, next = "test/mid", steps = {
			{ goals = { { t = "accept", quest = 57, title = "The Night Watch", qlvl = 26 } } },
			{ goals = { { t = "accept", quest = 156, title = "Gather Rot Blossoms", qlvl = 24 } } },
			{ goals = { { t = "collect", item = 1598, itemName = "Rot Blossom", quest = 156, oi = 1, count = 8 } } },
			{ goals = { { t = "kill", target = "Skeletal Horror", npc = 202, quest = 57, oi = 1, count = 15 } } },
			{ goals = { { t = "turnin", quest = 156, title = "Gather Rot Blossoms" }, { t = "turnin", quest = 57, title = "The Night Watch" } } },
		} })
	` + GUIDES;
	const night = 'stub.world.onQuest(57, { { required = 15, fulfilled = 1 } })';
	// Opened for the player (as Start guide does, in place of the login's
	// pick), so a guide passed whole chains on.
	const script = 'E.SetGuide(nil); E.OpenTab("test/dusk", true, true); flush(); emit({ guide = E.GetGuide().id, at = E.GetStepIndex() })';
	const [notDone] = run({
		before: `stub.world.level = 30
			stub.world.onQuest(156, { { type = "item", required = 8, fulfilled = 0 } })
			${night}`,
		guides: duskwood,
		script,
	});
	assert.equal(notDone.guide, 'test/mid', 'both too low and not done: the guide passes');
	const [ready] = run({
		before: `stub.world.level = 30
			stub.world.onQuest(156, { { type = "item", required = 8, fulfilled = 8 } })
			${night}`,
		guides: duskwood,
		script,
	});
	assert.deepEqual(ready, { guide: 'test/dusk', at: 5 }, 'the blossoms gathered: the guide takes them to hand in');
});

test('without "Skip grey quests" the guide is placed as before: the first quest not done, in the first guide', () => {
	const [out] = run({
		before: DONE,
		saved: OFF,
		script: 'E.SetGuide("test/low"); flush(); emit({ guide = E.GetGuide().id, at = E.GetStepIndex() })',
	});
	assert.deepEqual(out, { guide: 'test/low', at: 3 }, 'the trip to the farm is behind a quest turned in');
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
			emit({ at = E.GetStepIndex(), statuses = statuses() })
		`,
	});
	assert.deepEqual(out, { at: 1, statuses: ['active', 'pending', 'pending'] });
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

test('a reload places the saved guide again at the same step, without a catch-up to play; with nothing behind the player, the guide is placed as before', () => {
	const [reload] = run({
		before: DONE,
		saved: catchUpOn('', 'PolestarCharDB = { schema = 1, tabs = { "test/mid" }, activeTab = 1 }'),
		script: 'emit({ at = E.GetStepIndex(), placed = #PLACED })',
	});
	assert.deepEqual(reload, { at: 5, placed: 0 }, 'GUIDE_PLACED is for a guide just opened');

	const [fresh] = run({
		script: 'E.SetGuide("test/mid"); flush(); emit(E.GetStepIndex())',
	});
	assert.equal(fresh, 1, 'nothing done: the guide starts at its first step');
});

// Yendi: the first time, the guide starts from the race's first guide and
// goes through every guide to where the character is, for them to see.
test('with no guide open at login, the catch-up starts from the first guide and goes through to where the character is', () => {
	const [out] = run({
		before: DONE,
		saved: ON,
		script: 'emit({ guide = E.GetGuide().id, at = E.GetStepIndex(), placed = PLACED[#PLACED], first = Polestar.Guides.FirstGuide(), suggest = Polestar.Guides.Suggest(), start = E.StartingGuide() })',
	});
	// The guide window's and the welcome's Start guide open E.StartingGuide() too.
	assert.deepEqual(out, { guide: 'test/mid', at: 5, placed: { id: 'test/mid', step: 5, chain: 'test/low' }, first: 'test/low', suggest: 'test/mid', start: 'test/low' });

	// Without the catch-up, the guide for their level, as before.
	const [off] = run({ before: DONE, saved: { Polestar: 'PolestarDB = { schema = 1, settings = { behavior = { skipGrey = false } } }; PolestarCharDB = nil' }, script: 'emit(E.GetGuide().id)' });
	assert.equal(off, 'test/mid');
});

// Yendi at 30 in Darkshore (15-18): The Tower of Althalaxx, grey and green
// there, leads to four quests at 28 and 31 in Ashenvale. In a guide the
// character is past, a low chain is worth the detour only when at least three
// quests from yellow up need it.
test('in a guide the character is past, a low chain stays only when three quests from yellow up need it', () => {
	const guides = (worth) => `
		Polestar.RegisterGuide({ id = "test/dark", pack = "test", title = "Darkshore", faction = "Alliance", minLevel = 10, maxLevel = 15, next = "test/ashen", steps = {
			{ goals = { { t = "accept", quest = 401, title = "Tower 1", qlvl = 12 } } },
			{ goals = { { t = "turnin", quest = 401, title = "Tower 1" }, { t = "accept", quest = 402, title = "Tower 2", qlvl = 14, pre = { 401 } } } },
			{ goals = { { t = "turnin", quest = 402, title = "Tower 2" } } },
			{ goals = { { t = "accept", quest = 403, title = "Lone low", qlvl = 12 } } },
			{ goals = { { t = "turnin", quest = 403, title = "Lone low" } } },
		} })
		Polestar.RegisterGuide({ id = "test/ashen", pack = "test", title = "Ashenvale", faction = "Alliance", minLevel = 18, maxLevel = 25, steps = {
			{ goals = { { t = "accept", quest = 410, title = "Tower 3", qlvl = 19, pre = { 402 } } } },
			{ goals = { { t = "turnin", quest = 410, title = "Tower 3" }, { t = "accept", quest = 411, title = "Tower 4", qlvl = 20, pre = { 410 } } } },
			${worth ? '{ goals = { { t = "turnin", quest = 411, title = "Tower 4" }, { t = "accept", quest = 412, title = "Tower 5", qlvl = 21, pre = { 411 } } } },' : ''}
			{ goals = { { t = "accept", quest = 420, title = "After the lone one", qlvl = 19, pre = { 403 } } } },
			{ goals = { { t = "accept", quest = 430, title = "Ashenvale", qlvl = 20 } } },
		} })
	`;
	const script = `${STATUSES}
		E.SetGuide(nil); E.OpenTab("test/dark", true, true); flush()
		emit({ guide = E.GetGuide().id, at = E.GetStepIndex() or false, statuses = E.GetGuide().id == "test/dark" and statuses() or false })`;
	const [three] = run({ guides: guides(true), script });
	assert.deepEqual(three, { guide: 'test/dark', at: 1, statuses: ['active', 'pending', 'pending', 'na', 'na'] }, 'three quests from yellow up: the chain stays, the lone low quest goes');
	const [two] = run({ guides: guides(false), script });
	assert.equal(two.guide, 'test/ashen', 'two only: not worth the detour, the guide passes');
});

// Yendi: the guide list's check means every quest of the guide is done; a
// guide the catch-up passed whole with grey quests never done is not checked.
// A guide all done, opened by the player, stays open, finished.
test('a guide the catch-up passed whole is done for the list only once all its quests are; opened by hand, it stays', () => {
	const allDone = 'stub.world.complete({ 101, 102, 104, 204 }); stub.world.onQuest(206, {})';
	const [passed] = run({
		before: DONE,
		saved: PICK_OFF,
		script: 'E.StartGuide(); flush(); emit({ guide = E.GetGuide().id, low = E.GetGuideState("test/low") })',
	});
	assert.deepEqual(passed, { guide: 'test/mid', low: 'started' }, 'passed with a grey quest never done: not done');
	const [byHand] = run({
		before: DONE,
		script: 'E.SetGuide("test/low"); flush(); emit({ guide = E.GetGuide().id, at = E.GetStepIndex() or false, low = E.GetGuideState("test/low") })',
	});
	assert.deepEqual(byHand, { guide: 'test/low', at: false, low: 'started' }, 'opened by hand: it stays, not done for the list');
	const [opened] = run({
		before: allDone,
		script: 'E.SetGuide("test/low"); flush(); emit({ guide = E.GetGuide().id, at = E.GetStepIndex() or false, low = E.GetGuideState("test/low") })',
	});
	assert.deepEqual(opened, { guide: 'test/low', at: false, low: 'done' }, 'all done and opened by hand: it stays, finished');
});

// Yendi: a catch-up stopped at the end of a guide ("Guide complete, Up next")
// on a second try in the session (the next guide had finished on the first),
// and on a quest whose prerequisite was a grey one it left out.
test('a catch-up goes on to the next guide silently: on a second try, and past a quest whose prerequisite it left out', () => {
	const guides = GUIDES.replace('maxLevel = 12, next = "test/mid"', 'maxLevel = 12, next = "test/low2"') + `
		Polestar.RegisterGuide({ id = "test/low2", pack = "test", title = "Low 2", faction = "Alliance", minLevel = 8, maxLevel = 14, next = "test/mid", steps = {
			{ goals = { { t = "accept", quest = 150, title = "Grey start", qlvl = 8 } } },
			{ goals = { { t = "turnin", quest = 150, title = "Grey start" }, { t = "accept", quest = 152, title = "Yellow after it", qlvl = 19, pre = { 150 } } } },
			{ goals = { { t = "turnin", quest = 152, title = "Yellow after it" } } },
		} })
	`;
	const [out] = run({
		before: DONE,
		guides,
		script: `
			local first = { E.GetGuide().id, PLACED[#PLACED].chain }
			E.SetGuide(nil); E.StartGuide(); flush()
			emit({ first = first, again = { E.GetGuide().id, PLACED[#PLACED].chain } })`,
	});
	assert.deepEqual(out.first, ['test/mid', 'test/low,test/low2'], 'the first run goes through both');
	assert.deepEqual(out.again, ['test/mid', 'test/low,test/low2'], 'a second try in the session too');
});

// Yendi: Start guide with no guide open stopped on "Guide complete" at the
// end of Dun Morogh, every quest of it done: it goes on to the next guide,
// as the login's pick does. The list's own open keeps a finished guide.
test('Start guide goes on through guides with every quest done; the list keeps such a guide open', () => {
	const allDone = 'stub.world.complete({ 101, 102, 104, 204 }); stub.world.onQuest(206, {})';
	const saved = PICK_OFF;
	const [start] = run({ before: allDone, saved, script: 'local none = E.GetGuide() == nil; E.StartGuide(); flush(); emit({ none = none, guide = E.GetGuide().id, at = E.GetStepIndex() or false })' });
	assert.deepEqual(start, { none: true, guide: 'test/mid', at: 5 });
	const [list] = run({ before: allDone, saved, script: 'E.OpenTab("test/low"); flush(); emit({ guide = E.GetGuide().id, at = E.GetStepIndex() or false })' });
	assert.deepEqual(list, { guide: 'test/low', at: false });
});

// Review of #300: a character who did nothing in a guide got its flight
// path, hearth and class training stored as done, because a grey quest after
// them was left out. Only travel goes with a quest left out ahead of the
// player's progress; the rest holds, as without the catch-up.
test('a quest left out ahead of any progress takes only the travel to it: no flight path, hearth or training stored as done', () => {
	const guides = `
		Polestar.RegisterGuide({ id = "test/utility", pack = "test", title = "Utility", faction = "Alliance", minLevel = 15, maxLevel = 25, steps = {
			{ goals = { { t = "getfp", location = "Sentinel Hill" } } },
			{ goals = { { t = "sethome", location = "Lakeshire" } } },
			{ goals = { { t = "train", class = true, npc = 911, npcName = "Trainer" } } },
			{ goals = { { t = "goto", map = 1429, x = 40, y = 40, label = "Grey camp" } } },
			{ goals = { { t = "accept", quest = 501, title = "Grey", qlvl = 8 } } },
			{ goals = { { t = "accept", quest = 502, title = "Yellow", qlvl = 20 } } },
		} })
	`;
	const [out] = run({
		guides,
		saved: ON,
		script: `E.SetGuide("test/utility"); flush()
			local m = PolestarCharDB.manual["test/utility"] or {}
			local keys = {}
			for k in pairs(m) do keys[#keys + 1] = k end
			table.sort(keys)
			emit({ at = E.GetStepIndex(), manual = table.concat(keys, ",") })`,
	});
	assert.deepEqual(out, { at: 1, manual: '4:1' }, 'the guide starts with its flight path; only the way to the grey quest passes');
});

// Review of #300: with "Skip grey quests" on, a guide finished in normal play
// with a grey quest left out no longer showed as done in the guide list.
test('a guide finished in play is done for the list, a grey quest left out or not', () => {
	const guides = `
		Polestar.RegisterGuide({ id = "test/play", pack = "test", title = "Play", faction = "Alliance", minLevel = 18, maxLevel = 22, steps = {
			{ goals = { { t = "accept", quest = 601, title = "Grey", qlvl = 8 } } },
			{ goals = { { t = "accept", quest = 602, title = "Yellow", qlvl = 20 } } },
			{ goals = { { t = "turnin", quest = 602, title = "Yellow" } } },
		} })
	`;
	const [out] = run({
		guides,
		saved: ON,
		script: `E.SetGuide("test/play"); flush()
			local at = E.GetStepIndex()
			stub.world.accept(602, {}, "Yellow"); flush()
			stub.world.turnIn(602); flush()
			emit({ at = at, finished = E.GetStepIndex() == nil, state = E.GetGuideState("test/play") })`,
	});
	assert.deepEqual(out, { at: 2, finished: true, state: 'done' });
});

// Review of #300: levelling past a guide during play showed no outgrown
// banner (and so no hand-over) until a reload.
test('levelling past a guide during play shows the outgrown banner, the catch-up on or not', () => {
	const guides = `
		Polestar.RegisterGuide({ id = "test/young", pack = "test", title = "Young", faction = "Alliance", minLevel = 10, maxLevel = 16, steps = {
			{ goals = { { t = "accept", quest = 701, title = "Yellow then", qlvl = 15 } } },
			{ goals = { { t = "turnin", quest = 701, title = "Yellow then" } } },
		} })
		Polestar.RegisterGuide({ id = "test/older", pack = "test", title = "Older", faction = "Alliance", minLevel = 17, maxLevel = 24, steps = {
			{ goals = { { t = "accept", quest = 702, title = "Next", qlvl = 19 } } },
		} })
	`;
	for (const saved of [ON, OFF]) {
		const [out] = run({
			before: 'stub.world.level = 16',
			guides,
			saved,
			script: `OUT = {}
				Polestar.On("GUIDE_OUTLEVELED", function(id, suggested) OUT[#OUT + 1] = id .. ">" .. tostring(suggested) end)
				E.SetGuide("test/young"); flush()
				local before = #OUT
				stub.world.setLevel(19); flush()
				emit({ before = before, banner = table.concat(OUT, ","), guide = E.GetGuide().id })`,
		});
		assert.deepEqual(out, { before: 0, banner: 'test/young>test/older', guide: 'test/young' });
	}
});

// Maintainer scope on #300: a guide opened by hand is placed within itself;
// it never jumps to the next guide on its own.
test('a guide opened by hand stays, though the catch-up would pass it whole', () => {
	const [out] = run({
		before: DONE,
		saved: ON,
		script: 'E.SetGuide("test/low"); flush(); emit({ guide = E.GetGuide().id, placed = PLACED[#PLACED] })',
	});
	assert.equal(out.guide, 'test/low');
	assert.deepEqual(out.placed, { id: 'test/low', step: false, chain: '' });
});

