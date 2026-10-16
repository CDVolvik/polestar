'use strict';
// The roads layer: per grid column, how much of the ground the client paints
// with a road texture, from the terrain's own texture layers (tex0.js) and
// the reviewed allowlist of road textures (road-textures.json, names from the
// community listfile, listfile.js). One file per ADT tile,
// data/local/nav-layers/roads/<c>/<col>_<row>.bin: 65536 bytes, the weight
// 0-255 of column (i, j) at j * 256 + i (the grid's column order,
// tools/lib/nav/grid/format.js); a column is road from 128 (half the ground).
// index.json there: { build, continents: { [c]: ['col_row'] } } of the tiles
// with any road.
//
//   tileRoadWeights(parsedTex0, roadFdids) -> Uint8Array(65536)
//   roadWeights(c, col, row, dir?) -> Uint8Array(65536) | null (tile not built)
//   isRoadTexture(path) -> bool
//   buildRoads({ casc, sourcesDir, continents, dir, log }) -> per continent stats
//   roadAllowlist({ casc, sourcesDir, continents, log }) -> { textures, used }
//   roadsPng(weights) -> PNG Buffer (the planner's Roads layer)
//
// Blending: a layer above the base weighs its alpha; the base what they
// leave (255 minus their sum, at least 0); weights are normalised by their
// sum, as the client's terrain shader blends (height bias left out). A
// column's weight is the mean of its 4 x 4 alpha texels (a chunk is 16 x 16
// columns and 64 x 64 texels).

const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('../../paths');
const { parseTex0, MPHD_BIG_ALPHA } = require('./tex0');
const { chunks } = require('../geom/adt');
const { continentTiles, continentFlags } = require('../geom');
const { ensureListfile, scanListfile } = require('./listfile');

const ROADS_DIR = path.join(ROOT, 'data', 'local', 'nav-layers', 'roads');
const ALLOWLIST_FILE = path.join(__dirname, 'road-textures.json');
const COLUMNS = 65536;
const ROAD = 128;

// The allowlist's pattern: road-like words in a tileset path.
const ROAD_PATTERN = /road|path|cobble|street|trail/;

// A texture path as the allowlist names it: lowercase, forward slashes, the
// `_s` (specular, what MDID names) and `_h` (height) variants as their base.
const textureKey = (p) => String(p).toLowerCase().replace(/\\/g, '/').replace(/_[sh]\.blp$/, '.blp');

const matchesRoadPattern = (p) => {
	const k = String(p).toLowerCase().replace(/\\/g, '/');
	return k.startsWith('tileset/') && k.endsWith('.blp') && !/_[sh]\.blp$/.test(k) && ROAD_PATTERN.test(k.slice('tileset/'.length));
};

let allowed = null;
function allowlist() {
	if (!allowed) allowed = new Set(JSON.parse(fs.readFileSync(ALLOWLIST_FILE, 'utf8')).textures.map(textureKey));
	return allowed;
}

const isRoadTexture = (p) => allowlist().has(textureKey(p));

// Parsed tex0 (tex0.js) and the road textures' fdids -> per column weights.
function tileRoadWeights({ textures, chunks }, roadFdids) {
	const out = new Uint8Array(COLUMNS);
	const sum = new Float64Array(16 * 16);
	const road = new Float64Array(64 * 64);
	chunks.forEach(({ layers }, n) => {
		const isRoad = layers.map((l) => roadFdids.has(textures[l.tex]));
		if (!isRoad.some(Boolean)) return;
		for (let t = 0; t < 4096; t++) {
			let above = 0;
			let roadAbove = 0;
			for (let k = 1; k < layers.length; k++) {
				const a = layers[k].alpha ? layers[k].alpha[t] : 0;
				above += a;
				if (isRoad[k]) roadAbove += a;
			}
			const base = Math.max(0, 255 - above);
			const total = base + above;
			road[t] = total ? (255 * (roadAbove + (isRoad[0] ? base : 0))) / total : 0;
		}
		sum.fill(0);
		for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) sum[(y >> 2) * 16 + (x >> 2)] += road[y * 64 + x];
		const x0 = (n % 16) * 16;
		const y0 = Math.floor(n / 16) * 16;
		for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) out[(y0 + j) * 256 + x0 + i] = Math.round(sum[j * 16 + i] / 16);
	});
	return out;
}

const tileFile = (dir, c, col, row) => path.join(dir, String(c), `${col}_${row}.bin`);

function roadWeights(c, col, row, dir = ROADS_DIR) {
	const file = tileFile(dir, c, col, row);
	if (!fs.existsSync(file)) return null;
	const b = fs.readFileSync(file);
	if (b.length !== COLUMNS) throw new Error(`${file}: ${b.length} bytes, not ${COLUMNS}`);
	return new Uint8Array(b.buffer, b.byteOffset, b.length);
}

// fn(tile) over tiles, `limit` at a time.
async function eachLimited(list, limit, fn) {
	let next = 0;
	const run = async () => {
		while (next < list.length) await fn(list[next++]);
	};
	await Promise.all(Array.from({ length: Math.min(limit, list.length) }, run));
}

// The 4-bit fix per chunk (root MCNK without 0x8000), only read when the WDT has no big alpha.
async function fixOf(casc, tile, bigAlpha) {
	if (bigAlpha) return false;
	const flags = chunks(await casc.get(tile.root)).filter((x) => x.tag === 'MCNK').map((x) => x.data.readUInt32LE(0));
	return (n) => !(flags[n] & 0x8000);
}

async function buildRoads({ casc, sourcesDir, continents = [0, 1], dir = ROADS_DIR, offline = false, log = () => {} }) {
	const listfile = await ensureListfile({ sourcesDir, offline, log });
	const roadFdids = new Set();
	const names = new Map();
	await scanListfile(listfile, (fdid, p) => {
		if (isRoadTexture(p)) {
			roadFdids.add(fdid);
			names.set(fdid, p);
		}
	});
	const indexFile = path.join(dir, 'index.json');
	const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : { continents: {} };
	const stats = {};
	for (const c of continents) {
		const t0 = Date.now();
		const tiles = (await continentTiles(casc, c)).filter((t) => t.tex0);
		const bigAlpha = !!((await continentFlags(casc, c)) & MPHD_BIG_ALPHA);
		fs.mkdirSync(path.join(dir, String(c)), { recursive: true });
		const withRoad = [];
		const used = new Map(); // road fdid -> tiles using it
		let roadColumns = 0;
		let done = 0;
		await eachLimited(tiles, 8, async (t) => {
			const parsed = parseTex0(await casc.get(t.tex0), { bigAlpha, fix: await fixOf(casc, t, bigAlpha) });
			const w = tileRoadWeights(parsed, roadFdids);
			for (const f of new Set(parsed.textures)) if (roadFdids.has(f)) used.set(f, (used.get(f) || 0) + 1);
			let n = 0;
			for (let k = 0; k < COLUMNS; k++) if (w[k] >= ROAD) n++;
			roadColumns += n;
			if (w.some((v) => v)) withRoad.push(`${t.col}_${t.row}`);
			const file = tileFile(dir, c, t.col, t.row);
			fs.writeFileSync(`${file}.tmp`, w);
			fs.renameSync(`${file}.tmp`, file);
			if (++done % 200 === 0) log(`roads ${c}: ${done}/${tiles.length} tiles`);
		});
		withRoad.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
		index.build = casc.build;
		index.continents[c] = withRoad;
		stats[c] = {
			tiles: tiles.length, roadTiles: withRoad.length, roadColumns, bigAlpha, seconds: +((Date.now() - t0) / 1000).toFixed(1),
			textures: [...used].sort((a, b) => b[1] - a[1]).map(([f, n]) => ({ fdid: f, path: names.get(f), tiles: n })),
		};
		fs.writeFileSync(indexFile, JSON.stringify(index) + '\n');
	}
	return stats;
}

// The allowlist's candidates: every diffuse texture the continents' tex0
// files use, named by the listfile, whose base path matches ROAD_PATTERN.
// -> { textures: [base path] (sorted), used: Map path -> tiles, unnamed: [fdid] }
async function roadAllowlist({ casc, sourcesDir, continents = [0, 1], offline = false, log = () => {} }) {
	const counts = new Map(); // fdid -> tiles
	for (const c of continents) {
		const tiles = (await continentTiles(casc, c)).filter((t) => t.tex0);
		await eachLimited(tiles, 8, async (t) => {
			const mdid = chunks(await casc.get(t.tex0)).find((x) => x.tag === 'MDID');
			if (!mdid) return;
			const seen = new Set();
			for (let o = 0; o + 4 <= mdid.data.length; o += 4) seen.add(mdid.data.readUInt32LE(o));
			for (const f of seen) counts.set(f, (counts.get(f) || 0) + 1);
		});
		log(`allowlist: ${c} read (${tiles.length} tiles)`);
	}
	const listfile = await ensureListfile({ sourcesDir, offline, log });
	const used = new Map(); // base path -> tiles
	const named = new Set();
	await scanListfile(listfile, (fdid, p) => {
		if (!counts.has(fdid)) return;
		named.add(fdid);
		used.set(textureKey(p), (used.get(textureKey(p)) || 0) + counts.get(fdid));
	});
	const textures = [...used.keys()].filter(matchesRoadPattern).sort();
	return { textures, used, unnamed: [...counts.keys()].filter((f) => !named.has(f)) };
}

// Road weights -> a 256 x 256 RGBA PNG: the page's success green
// (docs/DESIGN.md), strong on road columns (>= 128), faint below.
function roadsPng(w) {
	const { encodePng } = require('../../planner/art/png');
	const px = new Uint8Array(COLUMNS * 4);
	for (let k = 0; k < COLUMNS; k++) {
		if (!w[k]) continue;
		px[k * 4] = 0x6b;
		px[k * 4 + 1] = 0xd9;
		px[k * 4 + 2] = 0x99;
		px[k * 4 + 3] = w[k] >= ROAD ? 200 : Math.round(w[k] * 0.6);
	}
	return encodePng(px, 256, 256);
}

module.exports = { tileRoadWeights, roadWeights, isRoadTexture, textureKey, matchesRoadPattern, buildRoads, roadAllowlist, roadsPng, ROADS_DIR, ALLOWLIST_FILE, ROAD_PATTERN, ROAD };
