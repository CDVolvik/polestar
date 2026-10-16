'use strict';
// Polestar's walking router (addon/Polestar_Nav/Routing) prices a step by
// the ground class of the node it enters and the player's faction
// (Routing/Costs.lua): on synthetic one-tile maps written by pack.js
// (encodeMaps + packFiles) with a hand-made `class` field (maps format 2),
// a road is taken while it is at most 1/0.8 = 1.25 times the straight way,
// a hostile hub is gone round and one's own crossed, and a map without the
// field (format 1, 0.2.4's) routes exactly as the router did before it
// priced classes (the base commit's Routing files, from git). The fifth
// argument of Find, FindCost and FindMany is today's waterWalking flag or an
// opts table { waterWalking, profile }.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');
const { runAddon, tocEntries, ADDONS, ROOT } = require('./helpers/lua');
const { tmpdir } = require('./helpers/tmp');
const { encodeMaps, packFiles, B64 } = require('../tools/lib/nav/pack');

const NAV = path.join(ADDONS, 'Polestar_Nav');
// The router before it priced classes: pathing-v2's base (origin/next, 0.2.4's router).
const BASE = 'f537d1d';
const C = 128;
const CS = 1600 / 3 / C; // 4.17 yd cells
const MAP = 7;
// The straight strip: row Y0 from X0 to X1, 24 cells (100 yd); the way round
// is a U of depth d above it, sharing the strip's end cells.
const X0 = 20;
const S = 24;
const X1 = X0 + S;
const Y0 = 64;
const at = (x, y) => ({ x: (x + 0.5) * CS, y: (y + 0.5) * CS, z: 0 });
const FROM = at(X0, Y0);
const TO = at(X1, Y0);
// Grid lengths in cells: the strip is S orthogonal steps; the U is d - 1 up,
// a diagonal round each corner, S - 2 across and d - 1 down.
const STRAIGHT = S * CS;
const ROUND = (d) => (S + 2 * d - 4 + 2 * Math.SQRT2) * CS;
// Priced with the U at `mult` except the last step, into the strip's end cell (class 0).
const ROUND_AT = (d, mult) => (mult * (S + 2 * d - 5 + 2 * Math.SQRT2) + 1) * CS;

// Cells of the two ways: { val, cls } by local cell (x * C + y); the strip's
// inner cells take `strip`, the U's cells `round`, the two end cells are plain ground.
function layout(d, strip = {}, round = {}) {
	const cells = new Map();
	const set = (x, y, c) => cells.set(x * C + y, { val: c.val ?? 1, cls: c.cls ?? 0 });
	for (let x = X0; x <= X1; x++) set(x, Y0, x === X0 || x === X1 ? {} : strip);
	for (let y = Y0 - d; y < Y0; y++) {
		set(X0, y, round);
		set(X1, y, round);
	}
	for (let x = X0 + 1; x < X1; x++) set(x, Y0 - d, round);
	return cells;
}

// pack.js's run-length symbols (the grid field's): a symbol >= 48 repeats the previous value.
function runLength(vals) {
	let out = '';
	for (let i = 0; i < vals.length; ) {
		let j = i + 1;
		while (j < vals.length && vals[j] === vals[i]) j++;
		out += B64[vals[i]];
		for (let r = j - i - 1; r > 0; r -= 16) out += B64[48 + Math.min(r, 16) - 1];
		i = j;
	}
	return out;
}

// A one-tile map of `cells` (one cluster, no entrances, no floors), written
// by pack.js as `nav pack` writes a map; with `classes` it carries the
// format 2 `class` field (one byte per node, run-length, zlib, base64).
// -> the Lua files, in load order.
function mapFiles(cells, classes) {
	const val = new Uint8Array(C * C);
	const cls = new Array(C * C).fill(0);
	for (const [l, c] of cells) {
		val[l] = c.val;
		cls[l] = c.cls;
	}
	const cl = { val, flags: new Uint8Array(C * C), zq: new Int32Array(C * C), floorStart: 0, floorEnd: 0 };
	const cg = { C, NX: 1, NY: 1, GW: C, GH: C, CX0: 0, CY0: 0, clusters: new Map([[0, cl]]), linkedOf: new Map() };
	const maps = encodeMaps(cg, { nodes: new Map(), edges: new Map() });
	const { files } = packFiles({ map: MAP, cg, maps, global: 'PolestarPathData', gen: '-- tests/nav-router.test.js' });
	if (classes) {
		const meta = files[0][1];
		const withField = meta.replace('\tfloor = {},\n', '\tfloor = {},\n\tclass = {},\n').replace(/(\tcounts = \{ [^}]*?) \},/, '$1, class = 1 },').replace('floor = {} },', 'floor = {}, class = {} },');
		assert.notEqual(withField, meta);
		files[0][1] = withField;
		const block = zlib.deflateSync(Buffer.from(runLength(cls), 'ascii'), { level: 9 }).toString('base64');
		const last = files[files.length - 1];
		last[1] = last[1].replace('-- stylua: ignore end\n', `data.packed.class[1] = {"${block}"}\n-- stylua: ignore end\n`);
	}
	const dir = tmpdir('polestar-router-');
	return files.map(([name, text]) => {
		const file = path.join(dir, name);
		fs.writeFileSync(file, text);
		return file;
	});
}

const lua = (p) => `{ x = ${p.x}, y = ${p.y}, z = ${p.z} }`;
// One query: kind find (points and cost), cost (FindCost) or many (FindMany's one target); opts the fifth argument, Lua.
const q = (id, kind, opts = 'nil') => ({ id, kind, opts });
const CALL = {
	find: (id, opts) => `Path.Find(${MAP}, A, B, function(points, cost) out[${JSON.stringify(id)}] = { cost = str(cost), points = flat(points) } end, ${opts})`,
	cost: (id, opts) => `Path.FindCost(${MAP}, A, B, function(cost, reason) out[${JSON.stringify(id)}] = { cost = str(cost or reason) } end, ${opts})`,
	many: (id, opts) => `Path.FindMany(${MAP}, A, { B }, function(costs, reason) out[${JSON.stringify(id)}] = { cost = str(costs[1] or reason) } end, ${opts})`,
};

// Runs the queries on the map files with the router `addon` (a runAddon entry) -> { [id]: { cost, points? } },
// costs and coordinates as %.17g strings so two routers compare exactly.
function route(addon, files, queries) {
	const script = `
local Path = Polestar_NavEngine
local frames = {}
Path.after = function(fn) frames[#frames + 1] = fn end
local function str(v) return type(v) == "number" and string.format("%.17g", v) or tostring(v) end
local function flat(points)
	if not points then return nil end
	local out = {}
	for i, p in ipairs(points) do out[i] = { str(p.x), str(p.y) } end
	return out
end
local A, B = ${lua(FROM)}, ${lua(TO)}
local out = {}
${queries.map((x) => CALL[x.kind](x.id, x.opts)).join('\n')}
while #frames > 0 do table.remove(frames, 1)() end
emit(out)`;
	const before = files.map((f) => `dofile(${JSON.stringify(f)})`).join('\n');
	const [out] = runAddon({ stubs: ['stub_encoding.lua'], before, addons: [addon], script }).emitted;
	return out;
}

// Polestar_Nav without its maps: the TOC's Routing files and API.lua.
const OURS = { name: 'Polestar_Nav', files: tocEntries(NAV).filter((f) => !f.endsWith('.xml')) };

const num = (r) => Number(r.cost);
const close = (r, want, what) => assert.ok(Math.abs(num(r) - want) < 1e-9, `${what}: cost ${r.cost}, want ${want}`);
// Straight: every drawn point on the strip's row; round: some point up on the U.
const straight = (r) => r.points.every(([, y]) => Math.abs(Number(y) - FROM.y) < 1e-9);
const round = (r) => r.points.some(([, y]) => Number(y) < FROM.y - 2 * CS);

test('Costs.lua: the ground classes, the multipliers and the faction profiles', () => {
	const [got] = runAddon({
		addons: [OURS],
		script: `
local K = Polestar_NavCosts
local function m(c, p) return K.Mult(c, p) end
emit({
	class = K.CLASS, hubs = { K.HUB_ALLIANCE, K.HUB_HORDE }, hub = K.HUB, min = K.MIN,
	mult = { K.MULT[0], K.MULT[1], K.MULT[2], K.MULT[3], K.MULT[4], K.MULT[5] },
	profiles = { K.Profile("Alliance"), K.Profile("Horde"), K.Profile("Neutral") or "nil", K.Profile(nil) or "nil" },
	m = {
		m(0), m(1, "Horde"), m(3, "Alliance"), m(4), m(5, "Horde"),
		m(8 + 1, "Horde"), m(8 + 1, "Alliance"), m(8 + 1), m(16 + 3, "Alliance"), m(16 + 3, "Horde"), m(16 + 3),
		m(8 + 16, "Horde"), m(8 + 16, "Alliance"),
	},
})`,
	}).emitted;
	assert.deepEqual(got.class, { NORMAL: 0, ROAD: 1, GENTLE: 2, STEEP: 3, INDOOR: 4, CITY: 5 });
	assert.deepEqual(got.hubs, [8, 16]);
	assert.equal(got.hub, 20);
	assert.deepEqual(got.mult, [1, 0.8, 1.3, 2.5, 2, 1]);
	assert.equal(got.min, Math.min(...got.mult), 'MIN is the smallest multiplier: the heuristic stays admissible');
	assert.deepEqual(got.profiles, ['Alliance', 'Horde', 'nil', 'nil']);
	assert.deepEqual(got.m, [1, 0.8, 2.5, 2, 1, 16, 0.8, 0.8, 50, 2.5, 2.5, 20, 20]);
	const toc = tocEntries(NAV).map((f) => f.replace(/\\/g, '/'));
	assert.ok(toc.indexOf('Routing/Costs.lua') >= 0 && toc.indexOf('Routing/Costs.lua') < toc.indexOf('Routing/PathGrid.lua'), 'Costs.lua loads before the other Routing files');
});

test('format 2: a road is taken while it is at most 1.25 times the straight way (120 yd x 0.8 = 96 < 100), not at 128 yd', () => {
	const road = { cls: 1 };
	const r120 = route(OURS, mapFiles(layout(3, {}, road), true), [q('none', 'find'), q('horde', 'find', '{ profile = "Horde" }'), q('cost', 'cost'), q('many', 'many', '{ profile = "Alliance" }')]);
	assert.ok(ROUND(3) > 1.19 * STRAIGHT && ROUND(3) < 1.21 * STRAIGHT, 'the road is 120 yd');
	for (const id of ['none', 'horde']) {
		assert.ok(round(r120[id]), `${id}: by the road`);
		close(r120[id], ROUND_AT(3, 0.8), id);
	}
	close(r120.cost, ROUND_AT(3, 0.8), 'FindCost');
	close(r120.many, ROUND_AT(3, 0.8), 'FindMany');
	const r130 = route(OURS, mapFiles(layout(4, {}, road), true), [q('none', 'find'), q('alliance', 'find', '{ profile = "Alliance" }')]);
	assert.ok(ROUND(4) > 1.28 * STRAIGHT, 'the road is 128 yd');
	assert.ok(ROUND_AT(4, 0.8) > STRAIGHT);
	for (const id of ['none', 'alliance']) {
		assert.ok(straight(r130[id]), `${id}: the straight strip`);
		close(r130[id], STRAIGHT, id);
	}
});

test('format 2: a Horde player goes round an Alliance hub the Alliance player and no profile cross, and the other way round', () => {
	const queries = [q('none', 'find'), q('alliance', 'find', '{ profile = "Alliance" }'), q('horde', 'find', '{ profile = "Horde" }'), q('hordeMany', 'many', '{ profile = "Horde" }')];
	const alliance = route(OURS, mapFiles(layout(4, { cls: 8 }), true), queries);
	assert.ok(round(alliance.horde), 'Horde: round the Alliance hub');
	close(alliance.horde, ROUND(4), 'Horde');
	close(alliance.hordeMany, ROUND(4), 'Horde, FindMany');
	for (const id of ['alliance', 'none']) {
		assert.ok(straight(alliance[id]), `${id}: through it`);
		close(alliance[id], STRAIGHT, id);
	}
	const horde = route(OURS, mapFiles(layout(4, { cls: 16 }), true), queries);
	assert.ok(round(horde.alliance), 'Alliance: round the Horde hub');
	close(horde.alliance, ROUND(4), 'Alliance');
	for (const id of ['horde', 'none']) {
		assert.ok(straight(horde[id]), `${id}: through it`);
		close(horde[id], STRAIGHT, id);
	}
	// Crossing a hostile hub is still a route when it is the only way: x 20, never closed.
	const strip = new Map([...layout(4, { cls: 8 })].filter(([l]) => l % C === Y0));
	const only = route(OURS, mapFiles(strip, true), [q('horde', 'find', '{ profile = "Horde" }')]);
	close(only.horde, (20 * (S - 1) + 1) * CS, 'Horde through the only way');
});

test('the fifth argument: a boolean is waterWalking (every caller today), a table is opts { waterWalking, profile }', () => {
	const files = mapFiles(layout(4, { val: 2 }), true);
	const got = route(OURS, files, [
		q('swim', 'find'), q('swimHorde', 'find', '{ profile = "Horde" }'), q('walk', 'find', 'true'), q('walkOpts', 'find', '{ waterWalking = true, profile = "Horde" }'),
		q('walkCost', 'cost', 'true'), q('walkCostOpts', 'cost', '{ waterWalking = true }'), q('walkMany', 'many', 'true'), q('walkManyOpts', 'many', '{ waterWalking = true, profile = "Alliance" }'),
	]);
	for (const id of ['swim', 'swimHorde']) {
		assert.ok(round(got[id]), `${id}: round the water`);
		close(got[id], ROUND(4), id);
	}
	for (const id of ['walk', 'walkOpts', 'walkCost', 'walkCostOpts', 'walkMany', 'walkManyOpts']) close(got[id], STRAIGHT, `${id}: on the water`);
});

test('format 1 (no class field): the same points and costs as the router before classes, for any profile', (t) => {
	const show = (rel) => spawnSync('git', ['-C', ROOT, 'show', `${BASE}:addon/Polestar_Nav/${rel}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
	if (show('API.lua').status !== 0) {
		t.skip(`no git history with ${BASE} (not a checkout of the repository)`);
		return;
	}
	const dir = path.join(tmpdir('polestar-router-base-'), 'Polestar_Nav');
	const rels = ['Routing/PathGrid.lua', 'Routing/Path.lua', 'Routing/PathJobs.lua', 'API.lua'];
	fs.mkdirSync(path.join(dir, 'Routing'), { recursive: true });
	for (const rel of rels) {
		const r = show(rel);
		assert.equal(r.status, 0, r.stderr);
		fs.writeFileSync(path.join(dir, rel), r.stdout);
	}
	fs.writeFileSync(path.join(dir, 'Polestar_Nav.toc'), `${rels.join('\n')}\n`);
	const BEFORE = { name: 'Polestar_Nav', dir };
	// The new router's queries, with profiles; the old router takes no opts (a table would be its waterWalking flag).
	const ours = [q('none', 'find'), q('horde', 'find', '{ profile = "Horde" }'), q('alliance', 'find', '{ profile = "Alliance" }'), q('walk', 'find', 'true'), q('walkOpts', 'find', '{ waterWalking = true, profile = "Horde" }'),
		q('cost', 'cost', '{ profile = "Alliance" }'), q('many', 'many', '{ profile = "Horde" }'), q('manyWalk', 'many', 'true')];
	const theirs = [q('none', 'find'), q('horde', 'find'), q('alliance', 'find'), q('walk', 'find', 'true'), q('walkOpts', 'find', 'true'), q('cost', 'cost'), q('many', 'many'), q('manyWalk', 'many', 'true')];
	for (const [what, cells] of [['road', layout(3, {}, { cls: 1 })], ['hub', layout(4, { cls: 8 })], ['water', layout(4, { val: 2 })]]) {
		const files = mapFiles(cells, false);
		const got = route(OURS, files, ours);
		const want = route(BEFORE, files, theirs);
		assert.deepEqual(got, want, `${what}: identical to the router before classes`);
		close(got.none, what === 'water' ? ROUND(4) : STRAIGHT, `${what}: no classes on format 1`);
	}
});
