'use strict';
// Routed walks (tools/lib/sim/walks.js, docs/SIMULATION.md §1 "Walks"): the
// walking router's yards between the world's points replace the straight
// line × detour where `sim walks` has routed them. On the invented world of
// tests/fixtures/sim/synthetic.js, with the router's answers stubbed.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { buildWorld } = require('../tools/lib/sim/world');
const { compileRun, makeTables } = require('../tools/lib/sim/run');
const { Travel } = require('../tools/lib/sim/travel');
const { effective, means } = require('../tools/lib/sim/params');
const walks = require('../tools/lib/sim/walks');
const sim = require('../tools/lib/sim');
const syn = require('./fixtures/sim/synthetic');
const { tmpdir } = require('./helpers/tmp');

function world() {
	const w = buildWorld(syn.makeData(), { faction: 'Horde', bandWidth: 5, extraStarts: syn.START });
	w.questXp = syn.questXpRows();
	w.dataHash = 'test-world';
	return w;
}

const params = (over = {}) => ({ ...means(effective({ calibrated: {} })), ...over });

// A walking-maps folder with a PACK.json naming the synthetic world's continent.
function navDir(extra = '') {
	const dir = tmpdir('sim-walks-nav-');
	fs.writeFileSync(path.join(dir, 'PACK.json'), JSON.stringify({ format: 2, maps: { 1: {} }, note: extra }));
	return dir;
}

// The router stubbed: every walk is `factor` × the straight line.
function fakeRouter(w, factor) {
	return ({ queries }) => ({
		results: queries.map((q) => ({
			type: 'many', id: q.id, ok: true,
			yards: q.targets.map((t) => Math.round(Math.hypot(t[0] - q.from[0], t[1] - q.from[1]) * factor * 10) / 10),
		})),
	});
}

// Word to the Warden (503): Elder Testa in Testvale to Warden Fieldy in Farfield, 1000 yd east.
function wardenLeg(w, run) {
	const q = w.quests.find((x) => x.id === 503);
	const idx = new Map(Array.from(run.ptList, (p, i) => [p, i]));
	return { a: idx.get(q.giver), b: idx.get(q.ender), wa: q.giver, wb: q.ender };
}

test('walk queries: every later point on the same landmass within the radius, one search per point, as the faction', () => {
	const w = world();
	const { points, queries } = walks.walkQueries(w, { radius: 4000, maps: new Set([1]) });
	assert.ok(points.length >= 3);
	assert.deepEqual(points, points.slice().sort((a, b) => a - b));
	for (const q of queries) {
		assert.equal(q.type, 'many');
		assert.equal(q.profile, 'Horde');
		assert.equal(q.style, 'balanced');
		assert.ok(q.ids.every((t) => t > Number(q.id)), 'only later points: each pair is searched once');
		assert.equal(q.ids.length, q.targets.length);
	}
	assert.equal(walks.walkQueries(w, { radius: 100, maps: new Set([1]) }).queries.every((q) => q.ids.every((t) => Math.hypot(w.points[t][2] - w.points[Number(q.id)][2], w.points[t][3] - w.points[Number(q.id)][3]) <= 100)), true);
	assert.equal(walks.walkQueries(w, { radius: 4000, maps: new Set([0]) }).points.length, 0, 'a continent without walking maps is not routed');
});

test('build: the routed yards of every pair; a walk the router cannot find is left out', async () => {
	const w = world();
	const nav = navDir();
	const router = fakeRouter(w, 2);
	const failing = (o) => {
		const r = router(o);
		r.results[0].yards[0] = false;
		return r;
	};
	const doc = await walks.buildWalks(w, { navDir: nav, runQueries: failing });
	assert.equal(doc.schema, walks.WALKS_SCHEMA);
	assert.equal(doc.faction, 'Horde');
	assert.equal(doc.dataHash, 'test-world');
	assert.equal(doc.nav, walks.navFingerprint(nav));
	const all = walks.walkQueries(w, { maps: new Set([1]) }).queries.reduce((n, q) => n + q.targets.length, 0);
	assert.equal(doc.pairs.length / 3, all - 1);
	for (let i = 0; i < doc.pairs.length; i += 3) assert.ok(doc.pairs[i] < doc.pairs[i + 1]);
});

test('attach: used on the world and walking maps it was built on, not on another', async () => {
	const w = world();
	const nav = navDir();
	const dir = tmpdir('sim-walks-');
	walks.writeWalks(dir, await walks.buildWalks(w, { navDir: nav, runQueries: fakeRouter(w, 2) }));
	const notes = [];
	assert.ok(walks.attachWalks(w, dir, { navDir: nav, log: (m) => notes.push(m) }));
	assert.ok(w.walksId);
	const other = { ...world(), dataHash: 'another-world' };
	assert.equal(walks.attachWalks(other, dir, { navDir: nav, log: (m) => notes.push(m) }), null);
	assert.equal(other.walks, null);
	assert.equal(walks.attachWalks(world(), dir, { navDir: navDir('rebuilt maps'), log: (m) => notes.push(m) }), null);
	assert.equal(walks.attachWalks(world(), tmpdir('sim-walks-none-'), { navDir: nav, log: (m) => notes.push(m) }), null);
	assert.match(notes.join('\n'), /another world/);
	assert.match(notes.join('\n'), /other walking maps/);
	assert.match(notes.join('\n'), /straight line × detour/);
});

test('attach: walks routed by other router code (Routing/, same maps) are not used', async () => {
	const w = world();
	const nav = navDir();
	const dir = tmpdir('sim-walks-');
	walks.writeWalks(dir, await walks.buildWalks(w, { navDir: nav, runQueries: fakeRouter(w, 2) }));
	const edited = navDir();
	fs.mkdirSync(path.join(edited, 'Routing'));
	fs.writeFileSync(path.join(edited, 'Routing', 'Costs.lua'), '-- other costs\n');
	assert.ok(walks.attachWalks(world(), dir, { navDir: navDir() }), 'same maps and code');
	assert.equal(walks.attachWalks(world(), dir, { navDir: edited }), null);
});

test('travel: a routed walk costs the router\'s yards (× routeMul), the rest the straight line × detour', async () => {
	const w = world();
	const nav = navDir();
	const dir = tmpdir('sim-walks-');
	const plain = compileRun(w, { race: 'Orc' });
	const p = params();
	const { a, b } = wardenLeg(w, plain);
	const straight = new Travel(plain, makeTables(plain, p));
	const d = Math.hypot(plain.pX[a] - plain.pX[b], plain.pY[a] - plain.pY[b]);
	assert.ok(Math.abs(straight.leg(a, b, straight.base[0], false) - (d * p.detour1) / p.runSpeed) < 1e-3);

	// The router says the walk is 3x the straight line (a ridge in the way).
	walks.writeWalks(dir, await walks.buildWalks(w, { navDir: nav, runQueries: fakeRouter(w, 3) }));
	walks.attachWalks(w, dir, { navDir: nav });
	const routed = compileRun(w, { race: 'Orc' });
	const r = wardenLeg(w, routed);
	const tr = new Travel(routed, makeTables(routed, p));
	const yd = w.walks.get(r.wa * w.points.length + r.wb);
	assert.ok(Math.abs(yd - d * 3) < 1, `${yd} routed yards for a ${d.toFixed(0)} yd line`);
	assert.ok(Math.abs(tr.leg(r.a, r.b, tr.base[0], false) - yd / p.runSpeed) < 1e-3);
	assert.ok(Math.abs(tr.leg(r.b, r.a, tr.base[0], false) - yd / p.runSpeed) < 1e-6, 'a pair is walked both ways');
	const slow = new Travel(routed, makeTables(routed, params({ routeMul: 1.1 })));
	assert.ok(Math.abs(slow.leg(r.a, r.b, slow.base[0], false) - (yd * 1.1) / p.runSpeed) < 1e-3);
});

test('a short line round a cliff is not a short walk', async () => {
	const w = world();
	const nav = navDir();
	const dir = tmpdir('sim-walks-');
	walks.writeWalks(dir, await walks.buildWalks(w, { navDir: nav, runQueries: fakeRouter(w, 50) }));
	walks.attachWalks(w, dir, { navDir: nav });
	const run = compileRun(w, { race: 'Orc' });
	const p = params();
	const tr = new Travel(run, makeTables(run, p));
	const P = Array.from(run.ptList);
	// Two points under 400 yd apart: the straight line says walk, the router says 50x round.
	let pair = null;
	for (let i = 0; i < P.length && !pair; i++) {
		for (let j = i + 1; j < P.length; j++) {
			const d = Math.hypot(run.pX[i] - run.pX[j], run.pY[i] - run.pY[j]);
			if (d > 20 && d < 300 && run.pR[i] === run.pR[j] && w.walks.has(P[i] * w.points.length + P[j])) {
				pair = [i, j, d];
				break;
			}
		}
	}
	assert.ok(pair, 'a short pair in the synthetic world');
	const [i, j, d] = pair;
	assert.ok(Math.abs(tr.leg(i, j, tr.base[0], false) - (w.walks.get(P[i] * w.points.length + P[j]) * p.routeMul) / p.runSpeed) < 1e-3);
	assert.ok(tr.leg(i, j, tr.base[0], false) > (d * p.detour1 * 10) / p.runSpeed);
});

test('a search result replays only with the walks it was searched with', () => {
	const w = world();
	w.walksId = null;
	sim.assertFresh({ dataHash: 'test-world' }, w);
	w.walksId = 'abc:balanced:4000';
	assert.throws(() => sim.assertFresh({ dataHash: 'test-world' }, w), /without routed walks/);
	sim.assertFresh({ dataHash: 'test-world', walks: 'abc:balanced:4000' }, w);
	w.walksId = null;
	assert.throws(() => sim.assertFresh({ dataHash: 'test-world', walks: 'abc:balanced:4000' }, w), /with other routed walks/);
});
