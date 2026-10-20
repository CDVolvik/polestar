'use strict';
// Walking paths players reported as impossible, each on the real engine and
// the shipped maps (addon/Polestar_Nav): the player's spot and the target as
// the bug report gave them (Era map coordinates), the path the engine draws,
// and the ground it must not cross. A report stays here once fixed, so the
// next re-pack cannot bring it back.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runAddon } = require('./helpers/lua');
const { needs, DATA } = require('./helpers/data');

const skip = needs('map-frames.json');

// Compat.MapToWorld with the Era frame: continent, wx (north), wy (west).
function world(map, x, y) {
	const b = JSON.parse(fs.readFileSync(path.join(DATA, 'map-frames.json'), 'utf8')).era[map];
	return { c: b.c, x: b.top + ((b.bottom - b.top) * y) / 100, y: b.left + ((b.right - b.left) * x) / 100 };
}

// The engine's path from `from` to `to` (a height each only when given: the
// client reports none for the player; a goal or a leg's end may carry one),
// as { points = { { x, y, z }, ... }, cost } or false when it finds none;
// profile: "Alliance" | "Horde" (none by default).
function walk(from, to, profile) {
	assert.equal(from.c, to.c);
	const pt = (p) => `{ x = ${p.x}, y = ${p.y}${typeof p.z === 'number' ? `, z = ${p.z}` : ''} }`;
	const [got] = runAddon({
		stubs: ['stub_encoding.lua'],
		addons: ['Polestar_Nav'],
		script: `
local Path = Polestar_NavEngine
local frames = {}
Path.after = function(fn) frames[#frames + 1] = fn end
local got = false
Path.Find(${from.c}, ${pt(from)}, ${pt(to)}, function(points, cost)
	if points then
		got = { points = {}, cost = cost }
		for i, p in ipairs(points) do got.points[i] = { p.x, p.y, p.z or false } end
	end
end${profile ? `, { profile = "${profile}" }` : ''})
while #frames > 0 do table.remove(frames, 1)() end
emit(got)`,
	}).emitted;
	return got;
}

// Nearest distance (yd) from point p to the path's line.
function offPath(points, p) {
	let best = Infinity;
	for (let i = 1; i < points.length; i++) {
		const [ax, ay] = points[i - 1];
		const [bx, by] = points[i];
		const dx = bx - ax;
		const dy = by - ay;
		const l2 = dx * dx + dy * dy;
		const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / l2)) : 0;
		best = Math.min(best, Math.hypot(ax + dx * t - p.x, ay + dy * t - p.y));
	}
	return best;
}

// Fitz, 2026-10-16, Raptor Horns (The Barrens): from 61.66,35.46 to the
// horns' first spot at 61.00,33.70 the arrow went straight up the hill in
// front of him, which he could not climb. The maps put the ground at 80 yd
// where he stood and 94 yd 12 yd on (84, 90 between: 45-56 degrees), flat
// beyond; every cell of that face packed as walkable both ways.
test('Raptor Horns, the Barrens: the walk from 61.66,35.46 to 61.00,33.70 does not climb the 80 to 94 yd face in front of the player', { skip }, () => {
	const from = world(1413, 61.66, 35.46);
	const to = world(1413, 61.0, 33.7);
	const got = walk(from, to);
	assert.ok(got, 'the engine finds a walk');
	const pts = got.points;
	const last = pts[pts.length - 1];
	assert.ok(Math.hypot(last[0] - to.x, last[1] - to.y) < 10, 'to the spot');
	// The middle of the face: 8 yd from the player towards the spot (90 yd high).
	const straight = Math.hypot(to.x - from.x, to.y - from.y);
	const face = { x: from.x + ((to.x - from.x) * 8) / straight, y: from.y + ((to.y - from.y) * 8) / straight };
	const off = offPath(pts, face);
	assert.ok(off > 3, `the path passes ${off.toFixed(1)} yd from the face's middle (${pts.length} points, ${Math.round(got.cost)} yd)`);
});

// Fitz, 2026-10-16, Ratchet (The Barrens), Horde, heading for 54,51: the walk
// left the north-east road, ran straight south along a line and turned 90
// degrees west onto the main road instead of keeping to the north-east road
// down to the junction. The tile border at y -3733.3 crosses both roads 35 yd
// apart, and its one entrance there sat on the main road, so every walk off
// the north-east road crossed the border along it. The 62 yd leg between two
// spots on the north-east road either side of the border walked 91 yd.
test('Ratchet, the Barrens: the 62 yd walk along the north-east road across the tile border (-913.3,-3749.2 to -935.1,-3692) stays on the road', { skip }, () => {
	const from = { c: 1, x: -913.3, y: -3749.2 };
	const to = { c: 1, x: -935.1, y: -3692 };
	const got = walk(from, to, 'Horde');
	assert.ok(got, 'the engine finds a walk');
	const pts = got.points;
	const last = pts[pts.length - 1];
	assert.ok(Math.hypot(last[0] - to.x, last[1] - to.y) < 10, 'to the spot');
	let yards = 0;
	for (let i = 1; i < pts.length; i++) yards += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
	const straight = Math.hypot(to.x - from.x, to.y - from.y);
	assert.ok(yards <= straight * 1.15, `the walk is ${yards.toFixed(1)} yd for ${straight.toFixed(1)} yd straight (${pts.length} points)`);
});

// The yards a path walks, along the ground (x, y).
function yardsOf(pts) {
	let yards = 0;
	for (let i = 1; i < pts.length; i++) yards += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
	return yards;
}

// #420 (Fitz, found checking Annie's #350), the Undercity: every walk from the
// Apothecarium (1458 51.47,56.39, z -61.4) to the Royal Quarter climbed out of
// the city to the ruins (z +80) and ended in a 485 yd straight line down,
// 1159 yd: the corridor into the Royal Quarter (1458 46,73 to 49,88) and the
// quarter itself lie under one of Tirisfal's lakes, and the pack dropped every
// floor under the lake. The navigation grid walks it in 373 yd indoors.
test('Undercity: the walk from the Apothecarium to Varimathras stays in the city (#420)', { skip }, () => {
	const from = { c: 0, x: 1516.99, y: 379.403, z: -61.4 };
	const to = { c: 0, x: 1287.769, y: 333.545, z: -60 };
	const got = walk(from, to, 'Horde');
	assert.ok(got, 'the engine finds a walk');
	const pts = got.points;
	const last = pts[pts.length - 1];
	assert.ok(Math.hypot(last[0] - to.x, last[1] - to.y) < 10, 'to Varimathras');
	const yards = yardsOf(pts);
	assert.ok(yards < 500, `the walk is ${yards.toFixed(0)} yd (${pts.length} points)`);
	const top = Math.max(...pts.filter((p) => p[2] !== false).map((p) => p[2]));
	assert.ok(top < -30, `it stays under the ground, never higher than ${top.toFixed(1)}`);
});

// #541 (Deadshot), Stormwind, Alliance: from the Trade District (1453
// 68.48,75.35 live, street height 107) to Jennea Cannon in the Wizard's
// Sanctum (the guide's goal: 49.56,85.80 live, z 29.7) the arrow ran a
// straight line along the city walls, 369 yd. The client gives no height
// for the player, so the walk may start on any storey under them: it takes
// the terrain buried under the streets (75 yd under the Trade District, 59.5
// under the Mage Quarter) and joins the Sanctum's lower floors from it. The
// navigation grid walks the streets, 489 yd, never under 87 yd. Open: the
// maps keep that terrain walkable.
test('Stormwind: the walk from the Trade District to Jennea Cannon keeps to the streets, not the terrain under them (#541)', { skip, todo: 'open: the maps still walk the terrain under the city' }, () => {
	const from = { c: 0, x: -8868.639, y: 533.077 };
	const to = { c: 0, x: -8989.686, y: 861.813, z: 29.7 };
	const got = walk(from, to, 'Alliance');
	assert.ok(got, 'the engine finds a walk');
	const pts = got.points;
	const last = pts[pts.length - 1];
	assert.ok(Math.hypot(last[0] - to.x, last[1] - to.y) < 10, 'to Jennea Cannon');
	// Outside the Sanctum (40 yd round her), every point stands on a street.
	for (const [x, y, z] of pts) {
		if (z === false || Math.hypot(x - to.x, y - to.y) < 40) continue;
		assert.ok(z > 85, `the walk passes ${x.toFixed(1)},${y.toFixed(1)} at ${z} yd, under the streets (${pts.length} points, ${Math.round(yardsOf(pts))} yd)`);
	}
});

// #338 (Tazul), Stormwind: from the Dwarven District (66.04,39.37, street
// height 95) the walk to the Deeprun Tram climbed the road towards the Keep and
// ended on the roof above the tram's entrance, 417 yd: the tram's end had no
// height, so the engine took the cheapest surface there. The travel data gives
// the end the entrance's floor (its AreaTrigger's height on the grid), and the
// walk there is 131 yd, almost straight.
test('Stormwind: the walk to the Deeprun Tram ends at its entrance, not on the roof above it (#338)', { skip }, () => {
	const [tram] = runAddon({
		stubs: ['stub_nav.lua'],
		addons: [{ name: 'Polestar', files: ['Core/Init.lua', 'Nav/Nav.xml'] }],
		script: `
			for _, t in ipairs(Polestar.Nav.GetTravelData().transports) do
				if t.id == "tram-stormwind-ironforge" then emit({ c = t.a.c, x = t.a.wx, y = t.a.wy, z = t.a.z or false }) end
			end`,
	}).emitted;
	assert.ok(tram, 'the tram is in the travel data');
	assert.equal(typeof tram.z, 'number', 'its Stormwind end has a height');
	const from = { c: 0, x: -8451.868, y: 575.472, z: 95 };
	const got = walk(from, tram, 'Alliance');
	assert.ok(got, 'the engine finds a walk');
	const pts = got.points;
	const last = pts[pts.length - 1];
	assert.ok(Math.hypot(last[0] - tram.x, last[1] - tram.y) < 10, 'to the tram');
	const yards = yardsOf(pts);
	assert.ok(yards < 150, `the walk is ${yards.toFixed(0)} yd (${pts.length} points)`);
	const end = pts.filter((p) => p[2] !== false).pop();
	assert.ok(Math.abs(end[2] - tram.z) < 5, `it ends at the entrance's height (${end[2]}, the entrance ${tram.z})`);
});
