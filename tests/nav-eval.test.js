'use strict';
// `nav eval` (tools/lib/nav/eval): the walking router run standalone by the
// Lua harness on a synthetic two-cluster map folder (pack.js on a tiny
// CellGrid), the per-route metrics, the acceptance comparison, and the route
// corpus against our grid (data/local/nav3; skipped without it).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { tmpdir } = require('./helpers/tmp');
const { needs, DATA } = require('./helpers/data');
const { CellGrid, buildHpa, encodeMaps, packFiles } = require('../tools/lib/nav/pack');

const ROOT = path.join(__dirname, '..');
const T = 1600 / 3;
const lua = ['luajit', 'lua5.1'].find((b) => spawnSync(b, ['-e', 'io.write(_VERSION)'], { encoding: 'utf8' }).status === 0);
const noLua = lua ? false : 'no luajit or lua5.1';

// Map 0 with two clusters side by side (x 0..T, y 0..2T), every cell open
// ground joined to its neighbours; only the maps (Nav/): the router comes
// from the repository's addon/Polestar_Nav.
function twoClusterFolder() {
	const C = 16;
	const cg = new CellGrid({ C, NX: 1, NY: 2, CX0: 0, CY0: 0 });
	for (const k of [0, 1]) cg.cluster(k).val.fill(1);
	for (let gx = 0; gx < cg.GW; gx++) {
		for (let gy = 0; gy < cg.GH; gy++) {
			for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
				const x = gx + dx;
				const y = gy + dy;
				if (x < cg.GW && y >= 0 && y < cg.GH) cg.join(gx * cg.GH + gy, x * cg.GH + y);
			}
		}
	}
	cg.finish();
	const maps = encodeMaps(cg, buildHpa(cg));
	const { files } = packFiles({ map: 0, cg, maps, global: 'PolestarPathData', gen: '-- nav-eval test map' });
	const dir = tmpdir('polestar-eval-');
	fs.mkdirSync(path.join(dir, 'Nav'));
	for (const [name, text] of files) fs.writeFileSync(path.join(dir, 'Nav', name), text);
	fs.writeFileSync(path.join(dir, 'Nav', 'Nav.xml'), `<Ui>\n${files.map(([name]) => `\t<Script file="${name}"/>`).join('\n')}\n</Ui>\n`);
	return dir;
}

test('eval harness: a route query on a two-cluster map returns ok with points; yards and hubs null when the router gives none', { skip: noLua }, () => {
	const { runRoutes } = require('../tools/lib/nav/eval/run');
	const navDir = twoClusterFolder();
	const [r] = runRoutes({ navDir, lua, routes: [{ id: 'across', map: 0, from: [200, 200, null], to: [300, 800, null] }] });
	assert.equal(r.id, 'across');
	assert.equal(r.ok, true, `routed (${r.reason})`);
	assert.ok(r.pts.length >= 2, 'points');
	assert.ok(Math.hypot(r.pts[0][0] - 200, r.pts[0][1] - 200) < 40, 'starts near the start');
	assert.ok(Math.hypot(r.pts.at(-1)[0] - 300, r.pts.at(-1)[1] - 800) < 40, 'ends near the end');
	assert.ok(r.cost >= Math.hypot(100, 600) * 0.9, `cost ${r.cost}`);
	assert.equal(r.yards, null);
	assert.equal(r.hubs, null);
	assert.ok(r.ms >= 0);
});

test('eval harness: a many query returns one cost per target (false off the map)', { skip: noLua }, () => {
	const { runQueries } = require('../tools/lib/nav/eval/run');
	const navDir = twoClusterFolder();
	const { results } = runQueries({ navDir, lua, queries: [{ type: 'many', id: 'm', map: 0, from: [200, 200, null], targets: [[250, 250, null], [300, 800, null], [5000, 5000, null]] }] });
	const [m] = results;
	assert.equal(m.type, 'many');
	assert.equal(m.costs.length, 3);
	assert.ok(m.costs[0] > 0 && m.costs[1] > m.costs[0], `costs ${m.costs}`);
	assert.equal(m.costs[2], false);
});

test('metrics: yards from the drawn line, the steepest climb between points; blocked, roads, hubs and indoor null without grid and layers', () => {
	const { metrics } = require('../tools/lib/nav/eval/metrics');
	const m = metrics({ ok: true, cost: 70, yards: null, pts: [[0, 0, 0], [30, 40, 0], [30, 50, 10], [30, 60, 0]] }, { grid: null, layers: {} });
	assert.equal(m.yards, 70);
	assert.equal(m.seconds, 10);
	assert.equal(m.maxClimbDeg, 45);
	assert.deepEqual([m.blocked, m.offRoad, m.hubYards, m.indoorYards], [null, null, null, null]);
	// hubYards.<side>: yards a player of that side walks in hubs hostile to it (a hub's side is its owner).
	const hubsLayer = { hubs: { 0: [{ id: 1, side: 'Alliance', name: 'Southshore', disks: [[50, 0, 10]] }, { id: 2, side: 'Horde', name: 'Tarren Mill', disks: [[0, 0, 10]] }] } };
	const through = metrics({ ok: true, cost: 100, pts: [[20, 0, 0], [100, 0, 0]] }, { grid: null, layers: hubsLayer, map: 0 });
	assert.ok(Math.abs(through.hubYards.Horde - 20) <= 1, `a Horde player through the Alliance hub: ${through.hubYards.Horde}`);
	assert.equal(through.hubYards.Alliance, 0, 'an Alliance player in its own hub counts nothing');
	const home = metrics({ ok: true, cost: 30, pts: [[0, 0, 0], [30, 0, 0]] }, { grid: null, layers: hubsLayer, map: 0 });
	assert.equal(home.hubYards.Horde, 0, 'a Horde walk out of its own hub counts 0');
	assert.ok(Math.abs(home.hubYards.Alliance - 10) <= 1, `an Alliance player in the Horde hub: ${home.hubYards.Alliance}`);
});

test('compare: A1 fails when a route that was ok becomes unreachable; the same maps pass; checks without data are n/a', () => {
	const { compare } = require('../tools/lib/nav/eval/compare');
	const route = (ok) => ({ id: 'raptor-horns', kind: 'reported', profile: null, expect: [{ type: 'ok' }], result: { ok, reason: ok ? null : 'unreachable', cost: ok ? 140 : null, ms: 10, pts: ok ? [[0, 0, 0], [140, 0, 0]] : [] }, metrics: ok ? { yards: 140, seconds: 20, blocked: 0.05, offRoad: null, hubYards: null, maxClimbDeg: 10, indoorYards: null } : null });
	const report = (ok) => ({ routes: [route(ok)], sweep: [] });
	const same = compare(report(true), report(true));
	assert.equal(same.pass, true, JSON.stringify(same.checks));
	assert.deepEqual(same.checks.map((c) => c.id), ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']);
	assert.equal(same.checks.find((c) => c.id === 'A2').pass, null, 'no hub layer: n/a');
	const lost = compare(report(true), report(false));
	assert.equal(lost.pass, false);
	assert.equal(lost.checks.find((c) => c.id === 'A1').pass, false);
	const sweep = (costs) => ({ routes: [], sweep: [{ id: '0|1429|Alliance', zone: 1429, profile: 'Alliance', targets: [[1, 2, null], [3, 4, null]], costs }] });
	assert.equal(compare(sweep([10, 20]), sweep([10, false])).checks.find((c) => c.id === 'A6').pass, false);
	assert.equal(compare(sweep([10, false]), sweep([12, 30])).checks.find((c) => c.id === 'A6').pass, true);
});

test('compare: A4 fails when any route found on the candidate climbs a step over 50 deg, and lists it beside the baseline\'s own', () => {
	const { compare } = require('../tools/lib/nav/eval/compare');
	const route = (id, kind, climb) => ({ id, kind, profile: null, expect: [], result: { ok: true, cost: 70, ms: 10, pts: [[0, 0, 0], [70, 0, 0]] }, metrics: { yards: 70, seconds: 10, blocked: 0, offRoad: null, hubYards: null, maxClimbDeg: climb, indoorYards: null } });
	const base = { routes: [route('ref-a', 'reference', 55), route('ref-b', 'reference', 20)], sweep: [] };
	const cand = { routes: [route('ref-a', 'reference', 30), route('ref-b', 'reference', 52.5)], sweep: [] };
	const a4 = compare(base, cand).checks.find((c) => c.id === 'A4');
	assert.equal(a4.pass, false);
	assert.match(a4.detail, /1 routes climb over 50 deg \(ref-b 52\.5\)/);
	assert.match(a4.detail, /baseline: 1 \(ref-a 55\)/);
	const fixed = { routes: [route('ref-a', 'reference', 30), route('ref-b', 'reference', 20)], sweep: [] };
	assert.notEqual(compare(base, fixed).checks.find((c) => c.id === 'A4').pass, false, 'the baseline over the limit never fails a candidate under it');
});

const noGrid = needs('map-frames.json', 'zones.json') || (fs.existsSync(path.join(ROOT, 'data', 'local', 'nav3', 'index.json')) ? false : 'no grid at data/local/nav3');

test('the route corpus: ids unique, every kind present, 20+ reference routes; every zone-map end converts and snaps to a walkable surface of our grid within 10 yd', { skip: noGrid }, () => {
	const { loadCorpus, resolveRoutes } = require('../tools/lib/nav/eval/run');
	const { Geo } = require('../tools/lib/planner/geo');
	const { openNav } = require('../tools/lib/nav/path');
	const corpus = loadCorpus();
	const ids = corpus.routes.map((r) => r.id);
	assert.equal(new Set(ids).size, ids.length, 'unique ids');
	for (const kind of ['reference', 'reported', 'hub', 'road', 'building', 'slope']) assert.ok(corpus.routes.some((r) => r.kind === kind), kind);
	assert.ok(corpus.routes.filter((r) => r.kind === 'reference').length >= 20);
	const geo = new Geo(JSON.parse(fs.readFileSync(path.join(DATA, 'map-frames.json'), 'utf8')), JSON.parse(fs.readFileSync(path.join(DATA, 'zones.json'), 'utf8')));
	const nav = openNav({ dir: path.join(ROOT, 'data', 'local', 'nav3') });
	const resolved = resolveRoutes(corpus.routes, geo);
	const far = [];
	let converted = 0;
	for (const [i, r] of resolved.entries()) {
		for (const end of ['from', 'to']) {
			if (Array.isArray(corpus.routes[i][end])) continue;
			converted++;
			const [wx, wy] = r[end];
			const s = nav.snap({ c: r.map, wx, wy, radius: 10 });
			if (!s || Math.hypot(s.wx - wx, s.wy - wy) > 10) far.push(`${r.id} ${end}`);
		}
	}
	assert.ok(converted >= 16, `${converted} zone-map ends`);
	assert.deepEqual(far, [], 'every converted end within 10 yd of a walkable surface');
});
