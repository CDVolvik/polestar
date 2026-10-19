'use strict';
// Maps Forever added (Zephras Isle, Riverglades, Mount Hyjal, Shen'dralas)
// have no Era frame in map-frames.json, only a Forever one, and their points
// are in the live frame. Everything that measures yards on them reads that
// frame (data.frame): spawn areas, candidate towns, farm spots and the quest
// database's markers. Before, they fell back to a mid-sized zone (3000 x
// 2000 yd) and Zephras Isle (5562 x 3708 yd) was measured at about half its
// size (#299). Route geometry (route/geo.js) measured them as a 1000-yard
// square and farm spots skipped them as unplaceable (#422).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { compile, plain, DATA_DIR } = require('./helpers/dsl');
const { loadData } = require('../tools/lib/dsl/data');
const { farmSpots } = require('../tools/lib/dsl/farmspots');
const { makeProjector, dist } = require('../tools/lib/route/geo');
const { buildQuestDB } = require('../tools/lib/questdb/build');
const { tmpdir } = require('./helpers/tmp');

const ZEPHRAS = 2521;
const FRAME = { c: 2991, left: 4231.25, right: -1331.25, top: 4956.25, bottom: 1247.917 };
const SX = Math.abs(FRAME.right - FRAME.left) / 100; // 55.6 yd per x %
const SY = Math.abs(FRAME.bottom - FRAME.top) / 100; // 37.1 yd per y %

// A copy of a fixture data folder with edits applied: edit(raw) mutates parsed JSON by file name.
function dataWith(dir, edit) {
	const out = tmpdir('forever-maps-');
	const raw = {};
	for (const f of fs.readdirSync(dir)) raw[f] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
	edit(raw);
	for (const [f, v] of Object.entries(raw)) fs.writeFileSync(path.join(out, f), JSON.stringify(v));
	return out;
}

test('data.frame: the Era frame, else the Forever one; map sizes come from it', () => {
	const data = loadData(dataWith(DATA_DIR, (raw) => {
		raw['map-frames.json'].forever = { [ZEPHRAS]: FRAME };
	}));
	assert.deepEqual(data.frame(ZEPHRAS), FRAME);
	assert.equal(data.eraFrame(ZEPHRAS), null, 'Era-frame coordinates still need an Era frame');
	assert.deepEqual(data.frame(1429), data.eraFrame(1429));
	const size = data.mapSize(ZEPHRAS);
	assert.ok(Math.abs(size.w - 5562.5) < 1 && Math.abs(size.h - 3708.3) < 1, JSON.stringify(size));
	assert.equal(data.frame(99999), null);
});

test('spawn areas on a Forever-only map cover the camp in that map\'s own yards', () => {
	// A camp of 16 mobs, 1.8% x 1.8% of Zephras Isle: about 100 x 67 yd.
	const pts = [];
	for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) pts.push([44 + i * 0.6, 26 + j * 0.6]);
	const dir = dataWith(DATA_DIR, (raw) => {
		raw['map-frames.json'].forever = { [ZEPHRAS]: FRAME };
		raw['npcs.json'][92000] = { id: 92000, name: 'Isle Vuldren', level: 3, faction: null, spawns: { [ZEPHRAS]: { f: 'l', pts } } };
	});
	const r = compile(['guide t/s', 'title S', 'levels 1-10', 'zone Elwynn Forest', '', 'step S', '  kill 92000 x5', ''].join('\n'), loadData(dir));
	assert.deepEqual(r.errors, []);
	const goal = plain(r.guides[0].steps[0].goals)[0];
	assert.equal(goal.map, ZEPHRAS);
	assert.ok(goal.spots && goal.spots.length, JSON.stringify(goal));
	const outside = pts.filter(([x, y]) => !goal.spots.some((s) => Math.hypot((x - s.x) * SX, (y - s.y) * SY) <= s.r + 0.5));
	assert.deepEqual(outside, [], JSON.stringify(goal.spots));
});

test('quest-database markers on a Forever-only map are clustered in that map\'s own yards', () => {
	const fix = path.join(__dirname, 'fixtures', 'questdb');
	// Two Kobold Miner spawns 1.5% of Zephras Isle apart: 83 yd, two markers at the 70 yd
	// cluster radius (45 yd and one marker through the old 3000 x 2000 yd fallback).
	const dir = dataWith(fix, (raw) => {
		raw['map-frames.json'].forever = { [ZEPHRAS]: FRAME };
		raw['npcs.json'][40].spawns[ZEPHRAS] = { f: 'l', pts: [[40, 30], [41.5, 30]] };
	});
	const { db, warnings } = buildQuestDB({ dataDir: dir });
	assert.deepEqual(warnings, []);
	const rec = db.npcs.get(40);
	const at = rec.indexOf(ZEPHRAS);
	assert.ok(at > 0, JSON.stringify(rec));
	assert.equal(rec[at + 1], 1, 'live-frame points');
	assert.equal(rec[at + 2], 2, JSON.stringify(rec));
	assert.ok(!Object.keys(db.mapFrames).includes(String(ZEPHRAS)), 'no Era frame is emitted for it');
});

test('route geometry measures a Forever-only map in its Forever frame, author points included', () => {
	const warnings = [];
	const p = makeProjector({ era: {}, forever: { [ZEPHRAS]: FRAME } }, (w) => warnings.push(w));
	for (const f of [null, 'e', 'l']) {
		const a = p.point(ZEPHRAS, 0, 0, f);
		const b = p.point(ZEPHRAS, 100, 100, f);
		assert.deepEqual([a.c, a.wx, a.wy, b.wx, b.wy], [FRAME.c, FRAME.top, FRAME.left, FRAME.bottom, FRAME.right], `f ${f}`);
		// 1.5% of the isle east-west: 83 yd (15 yd in a 1000-yard square).
		assert.ok(Math.abs(dist(p.point(ZEPHRAS, 40, 30, f), p.point(ZEPHRAS, 41.5, 30, f)) - 1.5 * SX) < 0.01, `f ${f}`);
	}
	// An author point and a spawn on the same map are on one continent, comparable.
	assert.ok(dist(p.point(ZEPHRAS, 40, 30), p.point(ZEPHRAS, 40, 30, 'l')) < 0.01);
	assert.deepEqual(warnings, []);
	// Neither frame: still the 1000-yard square, with a warning.
	assert.equal(dist(p.point(99999, 0, 0), p.point(99999, 100, 0)), 1000);
	assert.equal(warnings.length, 1);
});

test('farm spots on a Forever-only zone of Eastern Kingdoms: contested, clustered in that map\'s yards', () => {
	// Riverglades: Eastern Kingdoms (continent 0), 4850 yd east-west, 48.5 yd per x %.
	const RIVERGLADES = 2548;
	const RFRAME = { c: 0, left: -1891.666, right: -6741.666, top: -6466.666, bottom: -9700 };
	// Two camps 2% apart: 97 yd, two spots at the 70 yd cluster radius (60 yd and one spot in a 3000 yd zone).
	const pts = [[40, 50], [40.2, 50.2], [42, 50], [42.2, 50.2]];
	const data = loadData(dataWith(DATA_DIR, (raw) => {
		raw['map-frames.json'].forever = { [RIVERGLADES]: RFRAME };
		raw['zones.json'][RIVERGLADES] = { areaId: 16591, id: RIVERGLADES, name: 'Riverglades', parent: 1415, type: 3 };
		raw['npcs.json'][92001] = { faction: null, id: 92001, level: 30, name: 'Glade Lurker', spawns: { [RIVERGLADES]: { f: 'l', pts } } };
		raw['items.json'][4306].drops.npc[92001] = 30;
	}));
	const spots = farmSpots(data, 4306).filter((s) => s.map === RIVERGLADES);
	assert.deepEqual(spots.map((s) => [s.faction, s.f, s.x, s.y, s.spawns]), [['AH', undefined, 40.1, 50.1, 2], ['AH', undefined, 42.1, 50.1, 2]]);
});
