'use strict';
// Guide steps with `when` in the simulator (docs/SIMULATION.md §5): a step
// is replayed only when its level and quest predicates hold where the replay
// reaches it, decided once for the whole step, as the engine decides it
// (addon/Polestar/Core/Engine.lua: Own.whenHolds).

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildWorld } = require('../tools/lib/sim/world');
const { compileRun, makeTables } = require('../tools/lib/sim/run');
const { Evaluator } = require('../tools/lib/sim/evaluate');
const { compileSequence } = require('../tools/lib/sim/sequence');
const { effective, means } = require('../tools/lib/sim/params');
const syn = require('./fixtures/sim/synthetic');

function setup() {
	const data = syn.makeData();
	const w = buildWorld(data, { faction: 'Horde', bandWidth: 5, extraStarts: syn.START });
	w.questXp = syn.questXpRows();
	const run = compileRun(w, { race: 'Orc', family: 'solo' });
	const ev = new Evaluator(run, makeTables(run, means(effective({ calibrated: {} }))), {});
	return { run, ev };
}

// Rat Trouble (501) after Word to the Warden (503), in a step whose `when` is `preds`.
function events(preds) {
	const cond = { preds };
	return [
		{ t: 'accept', q: 503 }, { t: 'turnin', q: 503 },
		{ t: 'accept', q: 501, cond }, { t: 'turnin', q: 501, cond },
	];
}

test('sequences: the events of one step share its condition; other events have none', () => {
	const { run } = setup();
	const preds = [{ k: 'level', op: '<', n: 5 }];
	const seq = compileSequence(run, events(preds));
	const conds = [...seq.cond];
	assert.equal(conds[0], -1);
	assert.ok(conds.slice(-2).every((c) => c === 0), `condition indexes ${conds.join(',')}`);
	assert.deepEqual(seq.conds, [preds]);
});

test('a step is replayed when its `when` holds and left out whole when it does not', () => {
	const { run, ev } = setup();
	const quests = (preds) => ev.evaluateSequence(compileSequence(run, events(preds)), {}).endQuests;
	const with501 = quests([{ k: 'turnedin', q: 503 }]);
	assert.equal(quests([{ k: 'turnedin', q: 503, neg: true }]), with501 - 1);
	assert.equal(quests([{ k: 'level', op: '>=', n: 30 }]), with501 - 1);
	assert.equal(quests([{ k: 'available', q: 501 }]), with501);
	assert.equal(quests([{ k: 'onquest', q: [503] }]), with501 - 1, 'Word to the Warden is handed in, no longer in the log');
	// Items, zones and the bind point are not modelled: they hold.
	assert.equal(quests([{ k: 'has', item: 100, n: 1 }]), with501);
});

test('the decision is taken once, where the replay reaches the step', () => {
	const { run, ev } = setup();
	// Rat Trouble is not in the log when the step begins; its accept puts it
	// there, and the step's turn-in still runs.
	const r = ev.evaluateSequence(compileSequence(run, events([{ k: 'onquest', q: [501], neg: true }])), {});
	const all = ev.evaluateSequence(compileSequence(run, events([])), {});
	assert.equal(r.endQuests, all.endQuests);
});
