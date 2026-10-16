'use strict';
// `nav eval`'s per-route metrics: one routed result (run.js) measured on its
// drawn line against our grid and the ground layers.
//
//   metrics(result, { grid, layers, map }) -> null when not ok, else
//     { yards, seconds, blocked, offRoad, hubYards: { Alliance, Horde }, maxClimbDeg, indoorYards }
//   loadLayers(dir = data/local/nav-layers) -> { roads, hubs } (each null when not built)
//
// yards: the router's own (job.yards) when it gives them, else the drawn
// line's length (flat); seconds: cost / 7 (cost is in running yards, 7 yd/s).
// blocked: the share of the drawn line our grid (an openNav, path.js) cannot
// walk straight, measured as 0.2.4's maps were (NavPack's eval): <= 8 yd
// pieces, nav.los between consecutive piece ends; null without a grid.
// maxClimbDeg: the steepest uphill between consecutive points (degrees;
// points under 1 yd apart on the ground, a lift's rise, are skipped).
// offRoad: the share of the drawn line on columns whose road weight is under
// half (roads layer, data/local/nav-layers/roads/<c>/<col>_<row>.bin, one
// byte per grid column, index j * 256 + i); hubYards: per side, the yards a
// player of that side walks inside hubs hostile to it (hubYards.Horde: yards
// in Alliance hubs; hubs.json, per continent [{ id, side (the owner), name,
// disks: [[x, y, r]] }]); indoorYards: yards on indoor ground
// (layers.indoor(c, x, y, z) -> bool, from the ground classes). Each null
// until its layer exists.

const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('../../paths');
const { cellOf, tileKey, TILE_CELLS } = require('../grid/format');

const LAYERS = path.join(ROOT, 'data', 'local', 'nav-layers');
const RUN = 7; // yd/s: a cost in running yards over seconds
const PIECE = 8; // yd: blocked-share pieces (0.2.4's eval)
const SAMPLE = 2; // yd: layer samples along the line
const ROAD = 128; // road weight from which a column is road (half the alpha)
const HOSTILE_TO = { Alliance: 'Horde', Horde: 'Alliance' }; // a hub's owner -> the side it is hostile to

const flat = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

function lineLength(pts) {
	let L = 0;
	for (let i = 1; i < pts.length; i++) L += flat(pts[i - 1], pts[i]);
	return L;
}

// Share (by length) of the line our grid says one cannot walk straight along. Each vertex snaps at its own height;
// piece ends between vertices at the previous end's height (following the surface, never a hill's chord).
function blockedShare(grid, c, pts) {
	let bad = 0;
	let tot = 0;
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay, az] = pts[i - 1];
		const [bx, by, bz] = pts[i];
		const L = Math.hypot(bx - ax, by - ay);
		const n = Math.max(1, Math.ceil(L / PIECE));
		let prev = grid.snap({ c, wx: ax, wy: ay, z: az, radius: 6 });
		for (let k = 1; k <= n; k++) {
			const t = k / n;
			const z = k === n || !prev ? (az === null || bz === null ? null : az + (bz - az) * t) : prev.z;
			const s = grid.snap({ c, wx: ax + (bx - ax) * t, wy: ay + (by - ay) * t, z, radius: 6 });
			tot += L / n;
			if (!prev || !s || !grid.los(prev, s)) bad += L / n;
			prev = s;
		}
	}
	return tot ? bad / tot : 0;
}

// Walk the line in <= SAMPLE yd pieces; fn(x, y, z, length) per piece midpoint.
function along(pts, fn) {
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay, az] = pts[i - 1];
		const [bx, by, bz] = pts[i];
		const L = Math.hypot(bx - ax, by - ay);
		const n = Math.max(1, Math.ceil(L / SAMPLE));
		for (let k = 0; k < n; k++) {
			const t = (k + 0.5) / n;
			fn(ax + (bx - ax) * t, ay + (by - ay) * t, az === null || bz === null ? null : az + (bz - az) * t, L / n);
		}
	}
}

function maxClimb(pts) {
	let best = 0;
	for (let i = 1; i < pts.length; i++) {
		const d = flat(pts[i - 1], pts[i]);
		const dz = pts[i][2] - pts[i - 1][2];
		if (d < 1 || pts[i][2] === null || pts[i - 1][2] === null || !(dz > 0)) continue;
		best = Math.max(best, (Math.atan2(dz, d) * 180) / Math.PI);
	}
	return +best.toFixed(2);
}

function metrics(result, { grid = null, layers = {}, map = result.map } = {}) {
	if (!result || !result.ok) return null;
	const pts = result.pts || [];
	const drawn = lineLength(pts);
	let offRoad = null;
	if (layers.roads) {
		let off = 0;
		let known = 0;
		along(pts, (x, y, z, L) => {
			const w = layers.roads(map, x, y);
			if (w === null) return;
			known += L;
			if (w < ROAD) off += L;
		});
		offRoad = known ? off / known : null;
	}
	let hubYards = null;
	if (layers.hubs) {
		hubYards = { Alliance: 0, Horde: 0 };
		const hubs = layers.hubs[map] || layers.hubs[String(map)] || [];
		// A hub's side is its owner; its yards count for the other side (a Horde player in an Alliance hub).
		along(pts, (x, y, z, L) => {
			const inside = new Set();
			for (const h of hubs) {
				const hostileTo = HOSTILE_TO[h.side];
				if (hostileTo && !inside.has(hostileTo) && h.disks.some(([hx, hy, r]) => Math.hypot(x - hx, y - hy) <= r)) inside.add(hostileTo);
			}
			for (const side of inside) hubYards[side] += L;
		});
		for (const side of Object.keys(hubYards)) hubYards[side] = +hubYards[side].toFixed(1);
	}
	let indoorYards = null;
	if (layers.indoor) {
		indoorYards = 0;
		along(pts, (x, y, z, L) => {
			if (layers.indoor(map, x, y, z)) indoorYards += L;
		});
		indoorYards = +indoorYards.toFixed(1);
	}
	return {
		yards: +(typeof result.yards === 'number' ? result.yards : drawn).toFixed(1),
		seconds: typeof result.cost === 'number' ? +(result.cost / RUN).toFixed(1) : null,
		blocked: grid && grid.available !== false ? +blockedShare(grid, map, pts).toFixed(4) : null,
		offRoad: offRoad === null ? null : +offRoad.toFixed(4),
		hubYards,
		maxClimbDeg: maxClimb(pts),
		indoorYards,
	};
}

// The ground layers under data/local/nav-layers, null where not built yet.
function loadLayers(dir = LAYERS) {
	const roadsDir = path.join(dir, 'roads');
	let roads = null;
	if (fs.existsSync(roadsDir)) {
		const tiles = new Map();
		roads = (c, wx, wy) => {
			const { col, row, i, j } = cellOf(wx, wy);
			const key = `${c}/${tileKey(col, row)}`;
			if (!tiles.has(key)) {
				const file = path.join(roadsDir, String(c), `${tileKey(col, row)}.bin`);
				tiles.set(key, fs.existsSync(file) ? fs.readFileSync(file) : null);
			}
			const t = tiles.get(key);
			return t ? t[j * TILE_CELLS + i] : null;
		};
	}
	const hubsFile = path.join(dir, 'hubs.json');
	const hubs = fs.existsSync(hubsFile) ? JSON.parse(fs.readFileSync(hubsFile, 'utf8')) : null;
	return { roads, hubs, indoor: null };
}

module.exports = { metrics, loadLayers, lineLength, blockedShare, maxClimb };
