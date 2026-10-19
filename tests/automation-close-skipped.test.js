'use strict';
// Issue #360 (AurumTitanos): after Polestar's own accept or turn-in, the game
// opens the NPC's next window by itself: the follow-up of the quest just
// handed in, or the NPC's other quests again. With behavior.closeSkipped (on
// by default) Automation closes that window when it shows nothing the guide
// takes; one the player opened, one with a quest the guide wants, one in
// combat or with Shift held stays open. Each reported case is one test;
// `w.questDetail`/`w.greeting`/`w.gossip` after the turn-in or accept stand
// for the window the game opens, `stub.runTimers()` for the next frame.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');
const { TEST_PACK, TEST_SOURCE } = require('./helpers/packs');

const CORE = { name: 'Polestar', files: ['Core/Core.xml'] };

// steps: Lua step tables, e.g. '{ goals = { { t = "turnin", quest = 476, title = "Quest 476" } } }'.
function guide(steps) {
	return `
${TEST_PACK}
${TEST_SOURCE}
Polestar.RegisterGuide({
	id = "test/close", pack = "test", title = "Close", minLevel = 1, maxLevel = 20,
	steps = { ${steps.join(',\n')} },
})`;
}

function run({ before = '', steps, script }) {
	return runAddon({
		stubs: ['stub_world.lua'],
		before: `w = stub.world; w.addMap(1429, { name = "Elwynn Forest", c = 0, left = 1500, right = -1500, top = 500, bottom = -1500 }); w.moveTo(1429, 48, 42)\n${before}`,
		addons: [CORE],
		script: `${guide(steps)}\nstub.login()\n${script}
			local c = {}
			for i, x in ipairs(w.calls) do c[i] = table.concat({ tostring(x[1]), tostring(x[2]), tostring(x[3]) }, " ") end
			emit({ calls = c, open = w.frame and (w.frame.kind .. " " .. tostring(w.frame.questID)) or "none" })`,
	}).emitted[0];
}

const goal = (t, q) => `{ t = "${t}", quest = ${q}, title = "Quest ${q}" }`;
const turnin = (q) => `{ goals = { ${goal('turnin', q)} } }`;
const accept = (q) => `{ goals = { ${goal('accept', q)} } }`;
// The route's next step, at another NPC.
const AWAY = accept(33);

const reward = (q) => [`CompleteQuest ${q} nil`, `GetQuestReward ${q} 0`];

test('#360 Athridas Bearmantle: the follow-up the game offers after the turn-in is closed', () => {
	const out = run({
		before: 'w.onQuest(476, {})',
		steps: [turnin(476), AWAY],
		script: `
			w.gossip(2078, { active = { { questID = 476, isComplete = true } } })
			w.questDetail(2078, 483, { title = "The Relics of Wakening" })
			stub.runTimers()`,
	});
	assert.deepEqual(out, {
		calls: ['C_GossipInfo.SelectActiveQuest 476 nil', ...reward(476), 'CloseQuest 483 nil'],
		open: 'none',
	});
});

test('#360 Tallonkai Swiftroot: a follow-up the route leaves out is closed (Twisted Hatred 932, then 98403)', () => {
	const out = run({
		before: 'w.onQuest(932, {})',
		steps: [turnin(932), AWAY],
		script: `
			w.questProgress(3567, 932)
			w.questDetail(3567, 98403, { title = "Twisted Hatred" })
			stub.runTimers()`,
	});
	assert.deepEqual(out, { calls: [...reward(932), 'CloseQuest 98403 nil'], open: 'none' });
});

test('#360 Fandral Staghelm: the skipped follow-up is closed, and the next talk still accepts the quest the guide wants there', () => {
	const out = run({
		before: 'w.onQuest(935, {}); w.onQuest(940, {})',
		steps: [`{ goals = { ${goal('turnin', 935)}, ${goal('turnin', 940)}, ${goal('accept', 98046)} } }`, AWAY],
		script: `
			w.gossip(3516, { active = { { questID = 935, isComplete = true }, { questID = 940, isComplete = true } }, available = { { questID = 98046 } } })
			-- after 935 the game shows the NPC's quests again: Polestar carries on
			w.gossip(3516, { active = { { questID = 940, isComplete = true } }, available = { { questID = 98046 } } })
			-- after 940 it offers the follow-up, Grove of the Ancients
			w.questDetail(3516, 952, { title = "Grove of the Ancients" })
			stub.runTimers()
			stub.advance(5)
			-- the player talks to him again
			w.gossip(3516, { available = { { questID = 952 }, { questID = 98046 } } })
			w.gossip(3516, { available = { { questID = 952 } } })
			stub.runTimers()`,
	});
	assert.deepEqual(out, {
		calls: [
			'C_GossipInfo.SelectActiveQuest 935 nil', ...reward(935),
			'C_GossipInfo.SelectActiveQuest 940 nil', ...reward(940),
			'CloseQuest 952 nil',
			'C_GossipInfo.SelectAvailableQuest 98046 nil', 'AcceptQuest 98046 nil',
			'C_GossipInfo.CloseGossip nil nil',
		],
		open: 'none',
	});
});

test('#360 Rellian Greenspyre: from the greeting panel too (Tumors after 922)', () => {
	const out = run({
		before: 'w.onQuest(922, {})',
		steps: [turnin(922), AWAY],
		script: `
			w.greeting(3517, { active = { { questID = 922, isComplete = true } } })
			w.questDetail(3517, 923, { title = "Tumors" })
			stub.runTimers()`,
	});
	assert.deepEqual(out, { calls: ['SelectActiveQuest 922 1', ...reward(922), 'CloseQuest 923 nil'], open: 'none' });
});

test('#360 Sister Aquinne: The Temple of the Moon after The Sisterhood of Elune is closed', () => {
	const out = run({
		before: 'w.onQuest(98391, {})',
		steps: [turnin(98391), AWAY],
		script: `
			w.questComplete(7316, 98391)
			w.questDetail(7316, 2519, { title = "The Temple of the Moon" })
			stub.runTimers()`,
	});
	assert.deepEqual(out, { calls: ['GetQuestReward 98391 0', 'CloseQuest 2519 nil'], open: 'none' });
});

test('#360 Marshal Dughan and Remy "Two Times": the other quest the NPC offers after an accept is closed', () => {
	const out = run({
		steps: [accept(109), accept(40), AWAY],
		script: `
			w.questDetail(240, 109)
			w.questDetail(240, 62, { title = "The Fargodeep Mine" })
			stub.runTimers()
			w.questDetail(241, 40)
			w.questDetail(241, 47, { title = "Gold Dust Exchange" })
			stub.runTimers()`,
	});
	assert.deepEqual(out, {
		calls: ['AcceptQuest 109 nil', 'CloseQuest 62 nil', 'AcceptQuest 40 nil', 'CloseQuest 47 nil'],
		open: 'none',
	});
});

test('#360 Gryan Stoutmantle: the quest list left after the turn-in and the accept is closed', () => {
	const out = run({
		before: 'w.onQuest(109, {})',
		steps: [`{ goals = { ${goal('turnin', 109)}, ${goal('accept', 12)} } }`, accept(102)],
		script: `
			w.greeting(234, { active = { { questID = 109, isComplete = true } } })
			w.greeting(234, { available = { { questID = 12 }, { questID = 65 } } })
			-- the game lists the quest just taken and the one the guide skips
			w.greeting(234, { active = { { questID = 12, isComplete = false } }, available = { { questID = 65 } } })
			stub.runTimers()`,
	});
	assert.deepEqual(out, {
		calls: ['SelectActiveQuest 109 1', ...reward(109), 'SelectAvailableQuest 12 1', 'AcceptQuest 12 nil', 'CloseQuest nil nil'],
		open: 'none',
	});
});

// What is never closed.

const ATHRIDAS = `
	w.questProgress(2078, 476)
	w.questDetail(2078, 483, { title = "The Relics of Wakening" })
	stub.runTimers()`;

test('#360 a window the player opens is never closed: a quest picked from the list, one opened later, another NPC', () => {
	const fromList = run({
		before: 'w.onQuest(476, {})',
		steps: [turnin(476), AWAY],
		script: `
			w.questProgress(2078, 476)
			w.gossip(2078, { available = { { questID = 483 } }, options = { { name = "Tell me about druids." } } })
			stub.runTimers()
			C_GossipInfo.SelectAvailableQuest(483)  -- the player's click
			stub.runTimers()`,
	});
	assert.deepEqual(fromList, { calls: [...reward(476), 'C_GossipInfo.SelectAvailableQuest 483 nil'], open: 'detail 483' });

	const late = run({
		before: 'w.onQuest(476, {})',
		steps: [turnin(476), AWAY],
		script: `
			w.questProgress(2078, 476)
			stub.advance(3)
			w.questDetail(2078, 483, { title = "The Relics of Wakening" })
			stub.runTimers()`,
	});
	assert.deepEqual(late, { calls: reward(476), open: 'detail 483' });

	const otherNpc = run({
		before: 'w.onQuest(476, {})',
		steps: [turnin(476), AWAY],
		script: `
			w.questProgress(2078, 476)
			w.questDetail(3567, 483, { title = "The Relics of Wakening" })
			stub.runTimers()`,
	});
	assert.deepEqual(otherNpc, { calls: reward(476), open: 'detail 483' });
});

test('#360 a quest the guide wants stays open, even when Polestar leaves its accept to the player', () => {
	const out = run({
		before: 'w.onQuest(476, {})',
		steps: [turnin(476), accept(483)],
		script: `
			Polestar.Set("behavior.autoAccept", false)
			${ATHRIDAS}`,
	});
	assert.deepEqual(out, { calls: reward(476), open: 'detail 483' });

	const list = run({
		before: 'w.onQuest(476, {}); w.onQuest(7, { 10 })',
		steps: [turnin(476), AWAY, turnin(7)],
		script: `
			w.questProgress(2078, 476)
			w.greeting(2078, { active = { { questID = 7, isComplete = false } }, available = { { questID = 483 } } })
			stub.runTimers()`,
	});
	assert.deepEqual(list, { calls: reward(476), open: 'greeting nil' }, 'a quest the guide turns in later is listed');
});

test('#360 nothing is closed in combat, with Shift held, with the setting off, or on a gossip with other services', () => {
	const steps = [turnin(476), AWAY];
	const before = 'w.onQuest(476, {})';
	const combat = run({ before, steps, script: `
		w.questProgress(2078, 476)
		w.questDetail(2078, 483)
		stub.inCombat = true
		stub.runTimers()` });
	const shift = run({ before, steps, script: `
		w.questProgress(2078, 476)
		w.questDetail(2078, 483)
		stub.keys.shift = true
		stub.runTimers()` });
	const off = run({ before, steps, script: `Polestar.Set("behavior.closeSkipped", false)\n${ATHRIDAS}` });
	const services = run({ before, steps, script: `
		w.questProgress(2078, 476)
		w.gossip(2078, { available = { { questID = 483 } }, options = { { name = "Train me." } } })
		stub.runTimers()` });
	assert.deepEqual(
		[combat, shift, off, services],
		[
			{ calls: reward(476), open: 'detail 483' },
			{ calls: reward(476), open: 'detail 483' },
			{ calls: reward(476), open: 'detail 483' },
			{ calls: reward(476), open: 'gossip nil' },
		],
	);
	const plain = run({ before, steps, script: `
		w.questProgress(2078, 476)
		w.gossip(2078, { available = { { questID = 483 } } })
		stub.runTimers()` });
	assert.deepEqual(plain, { calls: [...reward(476), 'C_GossipInfo.CloseGossip nil nil'], open: 'none' }, 'a gossip that only lists quests is closed');
});

test('#360 the setting is on by default', () => {
	const out = runAddon({
		stubs: ['stub_world.lua'],
		addons: [CORE],
		script: 'stub.login()\nemit(Polestar.Get("behavior.closeSkipped"))',
	}).emitted[0];
	assert.equal(out, true);
});
