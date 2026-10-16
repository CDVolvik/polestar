'use strict';
// `node tools/polestar.js nav`: terrain navigation from the Forever client's
// own geometry (docs/ARCHITECTURE.md, "Navigation grid").
// `nav build` builds the grid under data/local/nav (tools/lib/nav/grid);
// `nav path` routes between two map points on it (tools/lib/nav/path.js);
// `nav aids` generates the arrow's crossings, open borders and approach
// chains from it and measures them (tools/lib/nav/aids.js, arrow.js).
// `nav pack` writes Polestar's walking maps of Eastern Kingdoms and Kalimdor
// from the grid into addon/Polestar_Nav in Shortest Path Forever's format
// (tools/lib/nav/pack.js, chokepoints.js); `nav vendor` / `nav check` copy
// his map of Zephras Isle there and hold the folder to UPSTREAM.json and
// PACK.json (tools/lib/nav/vendor.js; docs/ARCHITECTURE.md, "In-game walking
// routes"); the walking router (Routing/) is Polestar's, started from his.
// `nav eval` runs that router standalone on a folder's
// maps over a route corpus and a per-zone goal sweep, and judges two folders
// against the walking maps' acceptance checks (tools/lib/nav/eval).

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('../lib/cli');
const { ROOT, DATA, SOURCES } = require('../lib/paths');

const DEFAULT_DIR = path.join(ROOT, 'data', 'local', 'nav');
const NAV_ADDON = path.join(ROOT, 'addon', 'Polestar_Nav');

const usage = `usage: node tools/polestar.js nav build [--continents 0,1] [--force] [--offline] [--workers N] [--out <dir>] [--product <p>]
       node tools/polestar.js nav path <map> <x>,<y> <map> <x>,<y> [--class C] [--level N] [--frame era|forever] [--json] [--dir <dir>]
       node tools/polestar.js nav aids [--out <file>] [--lua <file>] [--report] [--continents 0,1] [--workers N] [--reference <file>] [--dir <dir>]
       node tools/polestar.js nav pack [--cells N] [--date <YYYY-MM-DD>] [--dir <grid dir>] [--out <dir>] | nav pack --check [--out <dir>]
       node tools/polestar.js nav vendor <shortest-path-forever checkout> [--out <dir>] [--date <YYYY-MM-DD>]
       node tools/polestar.js nav check [--out <dir>]
       node tools/polestar.js nav eval [--nav <Polestar_Nav dir>] [--baseline <dir or eval .json>] [--routes <file>] [--sweep] [--out <file.json>]
       node tools/polestar.js nav layers roads [--c 0|1] [--allowlist] [--offline] [--product <p>]
       node tools/polestar.js nav layers hubs [--dir <grid dir>] [--offline]

build   the navigation grid of every continent map-frames.json names (or
        --continents): client geometry per ADT tile through the CASC cache
        (data/sources/casc), walkable surfaces, links, regions and the
        abstract graph, in worker threads, written to data/local/nav (--out).
        A tile already built is kept unless --force; --offline only reads
        cached client files.
path    a route between two map points: <map> a uiMapID, <x>,<y> percent on
        it (the Era frame unless --frame forever). Prints yards, seconds by
        class, falls and the simplified points (map percent of the first
        map); --json prints the whole result. --class (e.g. Druid) and --level
        (default 10) choose the movement profile.
aids    the arrow's aids from the grid (tools/lib/nav/aids.js): zone
        crossings, open borders and approach chains in the crossings schema,
        validated, written to data/local/nav/aids.json (--out). --lua writes
        them as a Crossings.lua for a local test (never into
        addon/Polestar_Travel); to build a test copy of the data addon:
        node tools/polestar.js travel build --offline --crossings data/local/nav/aids.json --travel-addon <test folder> --json <test folder>/travel.json --lua <test folder>/TravelData.lua
        Pockets are tested in --workers threads (default: up to 6).
        --report also plans every consecutive pair of located goals in our
        guides with the addon's planner without and with the aids and writes
        aids-report.json and aids-report.md next to --out, comparing with the
        reference crossings file (--reference, default
        data/local/crossings.json; read only).
pack    Polestar's walking maps of maps 0 (Eastern Kingdoms) and 1
        (Kalimdor) from the grid (--dir, default data/local/nav; grid version
        3 or 4) in Shortest Path Forever's walking-map format
        (tools/lib/nav/pack.js, a port of his gen_nav.py and pack_nav.py), with
        Chokepoints.lua (lifts, bridges, gates, tunnels, cave and building
        mouths, passes; tools/lib/nav/chokepoints.js), into
        addon/Polestar_Nav (--out): Nav/Nav0*.lua, Nav/Nav1*.lua,
        Nav/Chokepoints.lua, PACK.json (grid build, cells, date, sizes, sha256
        of every file) and Nav/Nav.xml. --cells cuts each ADT tile into N x N
        cells (default 128, 4.17 yd); --date dates the generated headers
        (default today; the same grid, cells and date give the same bytes).
        --check only compares the folder with PACK.json.
vendor  copies Shortest Path Forever's walking maps of the maps Polestar
        does not pack (Nav/Nav2991*.lua, Zephras Isle) from a
        clean git checkout whose origin is
        https://github.com/cjber/shortest-path-forever (https or ssh; any
        uncommitted or untracked change, or another origin, is refused)
        into addon/Polestar_Nav (--out: a folder with an UPSTREAM.json, or a
        new, empty one), by Cillian Berragan,
        GPL-3.0-or-later. The only change is mechanical: the data global
        ShortestPathForeverPathData becomes PolestarPathData (Polestar always
        reads its own copy of the maps), and each file gets a header line
        naming its upstream file, commit, his copyright and licence and the
        date of the change (GPLv3 section 5a; --date, default today). Only
        map files named Nav<name>.lua are taken from Nav.xml; any other name
        stops the copy. Writes UPSTREAM.json (repo, commit, version, vendored
        date, sha256 of every vendored file) and Nav/Nav.xml. Files the
        previous UPSTREAM.json listed that the new commit no longer has are
        removed; no other file in the folder is touched (Polestar's packed
        maps and the walking router in Routing/, Polestar's since 2026-10-16,
        stay). Update CREDITS.md's commit line by hand.
check   the vendored files match UPSTREAM.json and the transform, the packed
        maps PACK.json, and Nav/Nav.xml lists both.
eval    the walking router run standalone (LuaJIT, else Lua 5.1; a folder
        without its own Routing takes the repository's) on a folder's maps
        (--nav, default addon/Polestar_Nav): the route corpus (--routes,
        default tools/lib/nav/eval/routes.json) with each route's metrics
        (yards, seconds, the share of the drawn line our grid at
        data/local/nav3 cannot walk, off-road share, yards in hostile hubs,
        steepest climb, indoor yards; a layer not built yet reads n/a) and
        expectations; --sweep also searches, per zone with located guide
        goals and per side, from the zone's flight master (else its first
        goal) to every goal. --baseline runs the same on another folder (or
        reads an earlier --out report) and judges the acceptance checks
        A1-A8; exit 1 when one fails. --out writes the whole report.
layers  the ground layers under data/local/nav-layers. roads: per grid
        column, the share of the ground the client paints with a road
        texture (tools/lib/nav/layers/roads.js), from each tile's tex0 ADT
        (its texture layers and alpha maps) and the reviewed allowlist
        tools/lib/nav/layers/road-textures.json, texture names from the
        wowdev community listfile (downloaded once to
        data/sources/listfile; build time only), for maps 0 and 1 (--c: one
        of them), into roads/<c>/<col>_<row>.bin. --allowlist instead
        rewrites the allowlist from every texture the maps' tiles use:
        one whose tileset path names a road, path, cobble, street or trail;
        one naming dirt, footprint, brick or gravel, or listed under
        reviewed, when its shape is a road's (most of its weight in long,
        narrow, elongated strips); with every measure (review it).
        hubs: each faction's towns and outposts (tools/lib/nav/layers/hubs.js):
        its guards and service NPCs (quest givers, vendors, trainers, flight
        masters, innkeepers, bankers, repairers) from the CMaNGOS classic-db
        spawns and creature templates, judged by the client's FactionTemplate
        table, clustered, named by the AreaTable area under them (the grid's
        area ids, --dir, default data/local/nav4), into hubs.json.`;

const usageError = (msg) => Object.assign(new Error(msg), { exit: 2 });

async function build(argv) {
	const { opts: o, positional, error } = parseArgs(argv, { flags: ['--force', '--offline'], options: ['--continents', '--workers', '--out', '--product'] });
	if (error || positional.length) throw usageError(error || `unexpected argument "${positional[0]}"`);
	let continents = null;
	if (o.continents !== undefined) {
		continents = String(o.continents).split(',').map((s) => Number(s.trim()));
		if (continents.some((c) => !Number.isInteger(c) || c < 0)) throw usageError('--continents needs map ids, e.g. 0,1');
	}
	const { buildNav, defaultWorkers } = require('../lib/nav/grid/build');
	const workers = o.workers === undefined ? defaultWorkers() : Number(o.workers);
	if (!Number.isInteger(workers) || workers < 0) throw usageError('--workers needs a number (0: no threads)');
	const outDir = o.out ? path.resolve(o.out) : DEFAULT_DIR;
	const t0 = Date.now();
	const r = await buildNav({
		outDir, sourcesDir: SOURCES, dataDir: DATA, product: o.product || 'wow_classic_beta', continents,
		force: !!o.force, offline: !!o.offline, workers, log: (m) => console.error(m),
	});
	for (const w of r.warnings) console.error(`warning: ${w}`);
	let tiles = 0;
	let surfaces = 0;
	for (const c of Object.values(r.index.continents)) {
		tiles += c.tiles.length;
		surfaces += c.surfaces;
	}
	console.log(`nav ${r.build}: ${Object.keys(r.index.continents).length} continents, ${tiles} tiles, ${surfaces} walkable surfaces in ${path.relative(process.cwd(), outDir) || '.'} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
	return 0;
}

function readJson(file) {
	if (!fs.existsSync(file)) throw Object.assign(new Error(`${file} not found (node tools/polestar.js data build)`), { exit: 1 });
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function point(mapArg, xyArg) {
	const map = Number(mapArg);
	const m = /^\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/.exec(String(xyArg || ''));
	if (!Number.isInteger(map) || !m) throw usageError(`expected <map> <x>,<y>, got "${mapArg} ${xyArg || ''}"`);
	return { map, x: Number(m[1]), y: Number(m[2]) };
}

const fmt = (s) => (s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${s.toFixed(1)} s`);

async function route(argv) {
	const { opts: o, positional, error } = parseArgs(argv, { flags: ['--json'], options: ['--class', '--level', '--frame', '--dir'] });
	if (error) throw usageError(error);
	if (positional.length !== 4) throw usageError('nav path needs <map> <x>,<y> <map> <x>,<y>');
	const level = o.level === undefined ? 10 : Number(o.level);
	if (!Number.isInteger(level) || level < 1) throw usageError('--level needs a level');
	const frame = o.frame === undefined || o.frame === 'era' ? 'e' : o.frame === 'forever' ? 'l' : null;
	if (!frame) throw usageError('--frame is era or forever');
	const a = point(positional[0], positional[1]);
	const b = point(positional[2], positional[3]);
	const { Geo } = require('../lib/planner/geo');
	const geo = new Geo(readJson(path.join(DATA, 'map-frames.json')), readJson(path.join(DATA, 'zones.json')));
	const wa = geo.toWorld(a.map, a.x, a.y, frame);
	const wb = geo.toWorld(b.map, b.x, b.y, frame);
	if (!wa) throw usageError(`map ${a.map} has no frame in map-frames.json`);
	if (!wb) throw usageError(`map ${b.map} has no frame in map-frames.json`);
	const { openNav } = require('../lib/nav/path');
	const { profileFor } = require('../lib/nav/move');
	const nav = openNav({ dir: o.dir ? path.resolve(o.dir) : DEFAULT_DIR });
	if (!nav.available) throw Object.assign(new Error('no navigation grid: run `node tools/polestar.js nav build`'), { exit: 1 });
	const profile = profileFor({ cls: o.class || null, level });
	const t0 = process.hrtime.bigint();
	const r = nav.route(wa, wb, profile);
	const ms = Number(process.hrtime.bigint() - t0) / 1e6;
	const pts = [];
	for (let i = 0; i < r.pts.length; i += 3) {
		const m = geo.toMap(a.map, wa.c, r.pts[i], r.pts[i + 1], frame);
		pts.push({ wx: r.pts[i], wy: r.pts[i + 1], z: r.pts[i + 2], x: m ? m.x : null, y: m ? m.y : null });
	}
	if (o.json) {
		console.log(JSON.stringify({ ...r, pts, cls: [...r.cls], profile, ms }, null, '\t'));
		return r.ok ? 0 : 1;
	}
	if (!r.ok) {
		console.log(`no route: ${r.reason}`);
		return 1;
	}
	const by = Object.entries(r.byClass).filter(([, s]) => s > 0).map(([k, s]) => `${k} ${fmt(s)}`).join(', ');
	console.log(`${Math.round(r.yards)} yd, ${fmt(r.seconds)} (${profile.name}, ${profile.mode} ${profile.outdoor.toFixed(1)} yd/s): ${by}`);
	if (r.falls.length) console.log(`falls: ${r.falls.map((f) => `${f.h.toFixed(1)} yd${f.damage ? ` (${Math.round(f.damage * 100)}% health)` : ''}`).join(', ')}`);
	console.log(`${pts.length} points (map ${a.map}), ${r.cells} cells, ${r.tiles} tiles, ${ms.toFixed(0)} ms:`);
	const { CLS_NAMES } = require('../lib/nav/grid/format');
	pts.forEach((q, i) => {
		const where = q.x === null ? `${q.wx.toFixed(1)} ${q.wy.toFixed(1)}` : `${q.x.toFixed(2)},${q.y.toFixed(2)}`;
		console.log(`  ${where} z ${q.z.toFixed(1)}${i < r.cls.length ? `  -> ${CLS_NAMES[r.cls[i]]}` : ''}`);
	});
	return 0;
}

// The aids as a Crossings.lua (Polestar_Travel's format) for a local test.
function aidsLua(set, frames, build) {
	const { crossingsLua } = require('../lib/travel/crossings');
	const { header } = require('../lib/generated');
	return [
		header('lua', 'nav aids --lua <file>', `the navigation grid (data/local/nav, client build ${build})`),
		`-- ${set.crossings.length} crossing(s), ${set.open.length} open-ground pair(s), ${set.chains.length} approach chain(s). Local test only: never committed or packaged.`,
		'',
		'local N = Polestar and Polestar.Nav',
		'if not (N and N.RegisterCrossings) then return end',
		'',
		...crossingsLua(set, frames, { complete: true }),
		'',
	].join('\n');
}

async function aids(argv) {
	const { opts: o, positional, error } = parseArgs(argv, { flags: ['--report'], options: ['--out', '--lua', '--continents', '--workers', '--reference', '--dir'] });
	if (error || positional.length) throw usageError(error || `unexpected argument "${positional[0]}"`);
	const workers = o.workers === undefined ? Math.max(0, Math.min(6, require('node:os').availableParallelism() - 2)) : Number(o.workers);
	if (!Number.isInteger(workers) || workers < 0) throw usageError('--workers needs a number (0: no threads)');
	let continents = null;
	if (o.continents !== undefined) {
		continents = String(o.continents).split(',').map((s) => Number(s.trim()));
		if (continents.some((c) => !Number.isInteger(c) || c < 0)) throw usageError('--continents needs map ids, e.g. 0,1');
	}
	const { TRAVEL_ADDON, readCrossingsFile } = require('../lib/travel/crossings');
	const travelAddon = path.join(ROOT, 'addon', TRAVEL_ADDON);
	const luaOut = o.lua ? path.resolve(o.lua) : null;
	if (luaOut && (luaOut === travelAddon || luaOut.startsWith(travelAddon + path.sep))) throw usageError(`--lua must not write into ${path.relative(ROOT, travelAddon)} (the owner's local data addon)`);
	const out = path.resolve(o.out || path.join(DEFAULT_DIR, 'aids.json'));
	const t0 = Date.now();
	const log = (m) => console.error(`[${((Date.now() - t0) / 1000).toFixed(0)} s] ${m}`);
	const { openNav } = require('../lib/nav/path');
	const nav = openNav({ dir: o.dir ? path.resolve(o.dir) : DEFAULT_DIR, cacheTiles: 160 });
	if (!nav.available) throw Object.assign(new Error('no navigation grid: run `node tools/polestar.js nav build`'), { exit: 1 });
	const { Frames } = require('../lib/travel/geo');
	const { Geo } = require('../lib/planner/geo');
	const mapFrames = readJson(path.join(DATA, 'map-frames.json'));
	const zonesJson = readJson(path.join(DATA, 'zones.json'));
	const frames = new Frames(mapFrames.era, zonesJson);
	const geo = new Geo(mapFrames, zonesJson);
	const { generateAids, loadZoneResolver, collectTargets } = require('../lib/nav/aids');
	const zoneOfArea = loadZoneResolver({ dataDir: DATA, sourcesDir: SOURCES, build: nav.index.build, frames });
	const { compileProject } = require('../lib/dsl/project');
	const compiled = compileProject({ packDir: path.join(ROOT, 'guides'), dataDir: DATA });
	log(`${compiled.guides.length} guides compiled; areas from ${zoneOfArea.areaTable}`);
	const data = {
		quests: readJson(path.join(DATA, 'quests.json')),
		npcs: readJson(path.join(DATA, 'npcs.json')),
		objects: readJson(path.join(DATA, 'objects.json')),
		trainers: readJson(path.join(DATA, 'trainers.json')),
	};
	const travel = readJson(path.join(DATA, 'travel.json'));
	const entrances = readJson(path.join(ROOT, 'tools', 'lib', 'codex', 'entrances.json'));
	const list = continents || Object.keys(nav.index.continents).map(Number);
	const targets = collectTargets({ guides: compiled.guides, data, geo, travel, entrances, continents: list });
	log(`${targets.length} targets`);
	const { doc, stats, set } = await generateAids({ nav, frames, zoneOfArea, targets, continents: list, log, workers });
	if (stats.errors.length) throw Object.assign(new Error(`the generated aids fail validation: ${stats.errors.length} error(s)\n  ${stats.errors.join('\n  ')}`), { exit: 1 });
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, `${JSON.stringify(doc, null, '\t')}\n`);
	const genSeconds = (Date.now() - t0) / 1000;
	console.log(`nav aids ${nav.index.build}: ${doc.open.length} open pairs, ${doc.crossings.length} crossings, ${doc.chains.length} chains -> ${path.relative(process.cwd(), out)} (${genSeconds.toFixed(0)} s)`);
	const lua = aidsLua(set, frames, nav.index.build);
	if (luaOut) {
		fs.mkdirSync(path.dirname(luaOut), { recursive: true });
		fs.writeFileSync(luaOut, lua);
		console.log(`wrote ${path.relative(process.cwd(), luaOut)} (local test only)`);
	}
	if (!o.report) return 0;
	const os = require('node:os');
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'polestar-aids-'));
	try {
		const crossingsLuaFile = luaOut || path.join(tmp, 'Crossings.lua');
		if (!luaOut) fs.writeFileSync(crossingsLuaFile, lua);
		const { planRoutes, guidePairs, jobOf, arrowReport } = require('../lib/nav/arrow');
		const pairs = guidePairs({ guides: compiled.guides, geo, frames, continents: list });
		const jobs = pairs.map(jobOf);
		log(`${pairs.length} guide pairs: planning without the aids`);
		const before = planRoutes(jobs, { log });
		log('planning with the aids');
		const after = planRoutes(jobs, { crossingsLua: crossingsLuaFile, log });
		let reference = null;
		const refFile = path.resolve(o.reference || path.join(ROOT, 'data', 'local', 'crossings.json'));
		try {
			reference = readCrossingsFile(refFile, frames);
		} catch (err) {
			console.error(`warning: reference ${refFile}: ${err.message.split('\n')[0]}`);
		}
		const report = arrowReport({ nav, frames, pairs, before, after, set, reference, stats, build: `${nav.index.build} (grid built ${nav.index.builtAt})`, seconds: null, log });
		report.json.seconds = (Date.now() - t0) / 1000;
		report.json.generateSeconds = genSeconds;
		const { renderReport } = require('../lib/nav/arrow');
		const base = path.join(path.dirname(out), `${path.basename(out, '.json')}-report`);
		fs.writeFileSync(`${base}.json`, `${JSON.stringify(report.json, null, '\t')}\n`);
		fs.writeFileSync(`${base}.md`, renderReport(report.json));
		const b = report.json.legs.before;
		const a = report.json.legs.after;
		console.log(`guide legs crossing impassable ground: ${b.blocked} of ${b.withWalk} (${b.blockedShare}%) without the aids, ${a.blocked} of ${a.withWalk} (${a.blockedShare}%) with them; ${a.failed} not planned with them`);
		console.log(`wrote ${path.relative(process.cwd(), base)}.json and .md (${((Date.now() - t0) / 1000).toFixed(0)} s in all)`);
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
	return 0;
}

async function vendorCmd(argv) {
	const { opts: o, positional, error } = parseArgs(argv, { flags: [], options: ['--out', '--date'] });
	if (error) throw usageError(error);
	if (positional.length !== 1) throw usageError('nav vendor needs the Shortest Path Forever checkout');
	const { vendor } = require('../lib/nav/vendor');
	const out = o.out ? path.resolve(o.out) : NAV_ADDON;
	let res;
	try {
		const src = path.resolve(positional[0]);
		res = o.date ? vendor(src, out, undefined, o.date) : vendor(src, out);
	} catch (e) {
		console.error(`nav vendor failed: ${e.message}`);
		return 1;
	}
	console.log(`vendored ${Object.keys(res.files).length} files from Shortest Path Forever ${res.version || '(no version)'} at ${res.commit} into ${path.relative(process.cwd(), out) || '.'}`);
	for (const rel of res.removed) console.log(`removed ${rel} (no longer upstream)`);
	return 0;
}

async function checkCmd(argv) {
	const { opts: o, positional, error } = parseArgs(argv, { flags: [], options: ['--out'] });
	if (error) throw usageError(error);
	if (positional.length) throw usageError('nav check takes no folder argument');
	const { checkVendored } = require('../lib/nav/vendor');
	const { checkPack } = require('../lib/nav/pack');
	const out = o.out ? path.resolve(o.out) : NAV_ADDON;
	const problems = [...checkVendored(out), ...checkPack(out)];
	for (const p of problems) console.error(`nav check: ${p}`);
	if (problems.length) return 1;
	console.log('nav check: the vendored files match UPSTREAM.json and the packed maps PACK.json');
	return 0;
}

// The chokepoints' inputs (tools/lib/nav/chokepoints.js): the grid's aids
// (aids.json, when built) and lifts, the map frames, the client's AreaTable.
function packPlaces(dir) {
	const { Geo } = require('../lib/planner/geo');
	const { areaNames } = require('../lib/nav/chokepoints');
	const { parseCsv } = require('../lib/data/csv');
	const optional = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);
	const wago = path.join(SOURCES, 'wago');
	const builds = fs.existsSync(wago) ? fs.readdirSync(wago).filter((b) => fs.existsSync(path.join(wago, b, 'AreaTable.csv'))) : [];
	if (!builds.length) throw Object.assign(new Error(`no AreaTable.csv under ${wago} (node tools/polestar.js data build)`), { exit: 1 });
	builds.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
	return {
		aids: optional(path.join(dir, 'aids.json')),
		lifts: optional(path.join(dir, 'lifts.json')) || {},
		geo: new Geo(readJson(path.join(DATA, 'map-frames.json')), readJson(path.join(DATA, 'zones.json'))),
		areas: areaNames(parseCsv(fs.readFileSync(path.join(wago, builds[builds.length - 1], 'AreaTable.csv'), 'utf8'))),
	};
}

async function packCmd(argv) {
	const { opts: o, positional, error } = parseArgs(argv, { flags: ['--check'], options: ['--cells', '--out', '--dir', '--date'] });
	if (error || positional.length) throw usageError(error || `unexpected argument "${positional[0]}"`);
	const { packNav, shipPack, checkPack } = require('../lib/nav/pack');
	const { OWN_MAPS } = require('../lib/nav/vendor');
	const out = o.out ? path.resolve(o.out) : NAV_ADDON;
	if (o.check) {
		const problems = checkPack(out);
		for (const p of problems) console.error(`nav pack: ${p}`);
		if (problems.length) return 1;
		console.log('nav pack: the packed maps match PACK.json');
		return 0;
	}
	const cells = o.cells === undefined ? 128 : Number(o.cells);
	if (!Number.isInteger(cells) || cells < 8 || cells > 256) throw usageError('--cells needs a whole number from 8 to 256');
	if (o.date !== undefined && !/^\d{4}-\d\d-\d\d$/.test(String(o.date))) throw usageError('--date needs YYYY-MM-DD');
	const dir = o.dir ? path.resolve(o.dir) : DEFAULT_DIR;
	if (!fs.existsSync(path.join(dir, 'index.json'))) throw Object.assign(new Error('no navigation grid: run `node tools/polestar.js nav build`'), { exit: 1 });
	const { TILE_VERSIONS } = require('../lib/nav/grid/format');
	const version = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')).version;
	if (!TILE_VERSIONS.includes(version)) throw Object.assign(new Error(`${dir} is grid version ${version}, this code reads ${TILE_VERSIONS.join(' or ')}: rebuild it with \`node tools/polestar.js nav build\``), { exit: 1 });
	const files = await packNav({ dir, cells, continents: OWN_MAPS, places: packPlaces(dir), date: o.date, log: (m) => console.error(m) });
	const { written, removed } = shipPack(files, out);
	const bytes = [...files.values()].reduce((s, c) => s + Buffer.byteLength(c), 0);
	console.log(`nav pack: ${written.length} files, ${(bytes / 1e6).toFixed(1)} MB at ${cells} cells per tile in ${path.relative(process.cwd(), out) || '.'}`);
	for (const rel of removed) console.log(`removed ${rel}`);
	return 0;
}

// The walking router on a folder's maps: the route corpus, the goal sweep, and the acceptance checks against a
// baseline (tools/lib/nav/eval).
async function evalCmd(argv) {
	const { opts: o, positional, error } = parseArgs(argv, { flags: ['--sweep'], options: ['--nav', '--baseline', '--routes', '--out'] });
	if (error || positional.length) throw usageError(error || `unexpected argument "${positional[0]}"`);
	const { evaluate, loadCorpus, findInterpreter } = require('../lib/nav/eval/run');
	const { loadLayers } = require('../lib/nav/eval/metrics');
	const { compare, summarize } = require('../lib/nav/eval/compare');
	const { Geo } = require('../lib/planner/geo');
	const { openNav } = require('../lib/nav/path');
	const navDir = o.nav ? path.resolve(o.nav) : NAV_ADDON;
	const corpus = loadCorpus(o.routes ? path.resolve(o.routes) : undefined);
	const geo = new Geo(readJson(path.join(DATA, 'map-frames.json')), readJson(path.join(DATA, 'zones.json')));
	const gridDir = path.join(ROOT, 'data', 'local', 'nav3');
	const grid = fs.existsSync(path.join(gridDir, 'index.json')) ? openNav({ dir: gridDir }) : null;
	if (!grid) console.error(`nav eval: no grid at ${path.relative(ROOT, gridDir)}: blocked shares are n/a`);
	const taxi = o.sweep ? readJson(path.join(DATA, 'travel.json')).taxi.nodes : null;
	const guides = o.sweep ? fs.readFileSync(path.join(ROOT, 'addon', 'Polestar_Guides', 'Guides.lua'), 'utf8') : null;
	const common = { corpus, sweep: !!o.sweep, geo, taxi, guides, grid, layers: loadLayers(), lua: findInterpreter(), log: (m) => console.error(m) };
	const fmtSummary = (label, s) => {
		const sides = Object.entries(s.sweep).map(([p, v]) => `${p} ${v.reachable}/${v.targets} goals in ${v.zones} zones`).join(', ');
		return `${label}: routes ${s.ok}/${s.routes} found, blocked share ${s.blockedShare === null ? 'n/a' : `${(100 * s.blockedShare).toFixed(1)}%`}, median cold search ${s.medianMs} ms${sides ? `; sweep: ${sides}` : ''}`;
	};
	const report = evaluate({ navDir, ...common });
	for (const r of report.routes) {
		const m = r.metrics;
		const verdicts = r.verdicts.map((v) => `${v.pass === null ? 'n/a' : v.pass ? 'ok' : 'FAIL'} ${v.detail}`).join('; ');
		console.log(`${r.kind.padEnd(9)} ${r.id}: ${r.result.ok ? `${m.yards} yd, ${m.seconds} s, blocked ${m.blocked === null ? 'n/a' : `${(100 * m.blocked).toFixed(1)}%`}, climb ${m.maxClimbDeg} deg, ${r.result.ms} ms` : `not found (${r.result.reason})`}${verdicts ? ` [${verdicts}]` : ''}`);
	}
	console.log(fmtSummary(path.relative(process.cwd(), navDir) || '.', report.summary));
	let code = 0;
	if (o.baseline) {
		const where = path.resolve(o.baseline);
		const base = where.endsWith('.json') ? readJson(where) : evaluate({ navDir: where, ...common });
		if (!base.summary) base.summary = summarize(base);
		console.log(fmtSummary(`baseline ${path.relative(process.cwd(), where) || '.'}`, base.summary));
		report.baseline = { navDir: base.navDir, summary: base.summary };
		report.compare = compare(base, report);
		for (const c of report.compare.checks) console.log(`${c.id} ${c.pass === null ? 'n/a ' : c.pass ? 'pass' : 'FAIL'} ${c.detail}`);
		console.log(report.compare.pass ? 'nav eval: no acceptance check fails' : 'nav eval: an acceptance check fails');
		if (!report.compare.pass) code = 1;
	}
	if (o.out) {
		fs.writeFileSync(path.resolve(o.out), JSON.stringify(report) + '\n');
		console.log(`nav eval: report in ${o.out}`);
	}
	return code;
}

async function layersCmd(argv) {
	const [layer, ...rest] = argv;
	if (layer === 'hubs') return hubsLayer(rest);
	if (layer !== 'roads') throw usageError(layer ? `unknown nav layer "${layer}" (roads, hubs)` : 'nav layers needs a layer: roads or hubs');
	const { opts: o, positional, error } = parseArgs(rest, { flags: ['--allowlist', '--offline'], options: ['--c', '--product'] });
	if (error || positional.length) throw usageError(error || `unexpected argument "${positional[0]}"`);
	if (o.c !== undefined && o.c !== '0' && o.c !== '1') throw usageError('--c needs 0 or 1');
	const continents = o.c === undefined ? [0, 1] : [Number(o.c)];
	const { openCasc } = require('../lib/planner/art/casc');
	const roads = require('../lib/nav/layers/roads');
	const casc = await openCasc({ sourcesDir: SOURCES, product: o.product || 'wow_classic_beta', offline: !!o.offline });
	const log = (m) => console.error(m);
	const t0 = Date.now();
	if (o.allowlist) {
		const file = roads.ALLOWLIST_FILE;
		const reviewed = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).reviewed || [] : [];
		const r = await roads.roadAllowlist({ casc, sourcesDir: SOURCES, continents, reviewed: reviewed.map((x) => x.texture), offline: !!o.offline, log });
		const kept = r.shapes.filter((s) => s.kind !== 'other' || s.shapeRoad);
		const doc = {
			about: 'Road textures (tileset paths, the _s and _h variants as their base) for the roads layer, of the diffuse textures the tex0 ADTs of the listed maps use (names from the wowdev community listfile): every one whose path matches named; one whose path matches ground when its shape is a road\'s; one in reviewed (checked by a person to lie on known roads) when its shape is a road\'s. A shape is a road\'s when at least roadShare of the texture\'s weight lies in strips: 8-connected components of columns where it weighs >= 128 (per tile) at least longYd long (bounding box diagonal), at most narrow columns of mean width (area over half the perimeter) and at least elongated long (diagonal^2 / area, in columns). shapes: the measures of every named, ground and reviewed texture and of every other road-shaped one (kind other: candidates for review; medianWidth: the width half the weight lies under). Regenerate with node tools/polestar.js nav layers roads --allowlist.',
			build: casc.build,
			maps: continents,
			named: roads.NAMED_PATTERN.source,
			ground: roads.GROUND_PATTERN.source,
			longYd: roads.LONG_YD,
			narrow: roads.NARROW,
			elongated: roads.ELONGATED,
			roadShare: roads.ROAD_SHARE,
			reviewed,
			textures: r.textures,
			shapes: kept.map((s) => ({ texture: s.texture, kind: s.kind, tiles: s.tiles, columns: s.columns, components: s.components, medianWidth: s.medianWidth === null ? null : +s.medianWidth.toFixed(2), share: +s.share.toFixed(3), road: s.road })),
		};
		fs.writeFileSync(file, JSON.stringify(doc, null, '\t') + '\n');
		for (const s of [...kept].sort((a, b) => b.share - a.share)) console.log(`${s.road ? 'road' : '    '} ${s.kind.padEnd(6)} ${String(s.columns).padStart(9)} col ${String(s.components).padStart(6)} comp  width ${s.medianWidth === null ? '   -' : s.medianWidth.toFixed(2).padStart(5)}  share ${s.share.toFixed(3)}  ${s.texture}`);
		console.log(`nav layers roads: ${r.textures.length} road textures of ${r.used.size} used in ${path.relative(ROOT, file)}${r.unnamed.length ? `; ${r.unnamed.length} used fdids the listfile does not name` : ''} (${fmt((Date.now() - t0) / 1000)})`);
		return 0;
	}
	const stats = await roads.buildRoads({ casc, sourcesDir: SOURCES, continents, offline: !!o.offline, log });
	for (const [c, s] of Object.entries(stats)) {
		console.log(`roads ${c}: ${s.tiles} tiles, ${s.roadTiles} with road, ${s.roadColumns} road columns, ${s.bigAlpha ? '8-bit' : '4-bit'} alpha, ${fmt(s.seconds)}`);
		for (const t of s.textures) console.log(`  ${String(t.tiles).padStart(5)} tiles  ${t.path} (${t.fdid})`);
	}
	console.log(`nav layers roads ${casc.build}: in ${path.relative(ROOT, roads.ROADS_DIR)} (${fmt((Date.now() - t0) / 1000)})`);
	return 0;
}

// `nav layers hubs`: data/local/nav-layers/hubs.json.
async function hubsLayer(argv) {
	const { opts: o, positional, error } = parseArgs(argv, { flags: ['--offline'], options: ['--dir'] });
	if (error || positional.length) throw usageError(error || `unexpected argument "${positional[0]}"`);
	const hubs = require('../lib/nav/layers/hubs');
	const { loadSpawnHeights, loadCreatureTemplates, DB_REV } = require('../lib/travel/cmangos');
	const { cachedTable } = require('../lib/data/wago');
	const { openNav } = require('../lib/nav/path');
	const { cellOf } = require('../lib/nav/grid/format');
	const gridDir = o.dir ? path.resolve(o.dir) : path.join(ROOT, 'data', 'local', 'nav4');
	const nav = openNav({ dir: gridDir, cacheTiles: 64 });
	if (!nav.available) throw Object.assign(new Error(`no navigation grid at ${path.relative(ROOT, gridDir)} (its area ids name the hubs): run \`node tools/polestar.js nav build\``), { exit: 1 });
	const build = nav.index.build;
	const log = (m) => console.error(m);
	const t0 = Date.now();
	const offline = !!o.offline;
	const get = async (url) => {
		const res = await fetch(url, { headers: { 'user-agent': 'polestar-nav' } });
		if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
		return res.text();
	};
	const factionTemplates = await cachedTable({ sourcesDir: SOURCES, build, table: 'FactionTemplate', offline, get, log });
	const areaTable = await cachedTable({ sourcesDir: SOURCES, build, table: 'AreaTable', offline, get, log });
	const { npc } = await loadSpawnHeights({ sourcesDir: SOURCES, offline, log });
	const { templates } = await loadCreatureTemplates({ sourcesDir: SOURCES, offline, log });
	const areaAt = (c, x, y) => {
		const p = cellOf(x, y);
		const t = nav.tile(c, p.col, p.row);
		return t ? t.areas[(p.j >> 4) * 16 + (p.i >> 4)] : 0;
	};
	const maps = hubs.HUB_MAPS.filter((c) => nav.index.continents[c]);
	const out = hubs.buildHubs({ spawns: npc, templates, factionTemplates, areaTable, areaAt, maps });
	const doc = { build, rev: DB_REV, maps, rules: hubs.RULES, ...out };
	fs.mkdirSync(path.dirname(hubs.HUBS_FILE), { recursive: true });
	fs.writeFileSync(`${hubs.HUBS_FILE}.tmp`, `${JSON.stringify(doc)}\n`);
	fs.renameSync(`${hubs.HUBS_FILE}.tmp`, hubs.HUBS_FILE);
	for (const c of maps) {
		console.log(`hubs ${c}: ${out[c].length} (${out[c].filter((h) => h.side === 'Alliance').length} Alliance, ${out[c].filter((h) => h.side === 'Horde').length} Horde)`);
		for (const h of out[c]) console.log(`  ${h.side.padEnd(8)} ${h.name} (${h.guards} guards, ${h.services} services, ${h.disks.length} disks)`);
	}
	console.log(`nav layers hubs ${build}: ${path.relative(ROOT, hubs.HUBS_FILE)} (${fmt((Date.now() - t0) / 1000)})`);
	return 0;
}

const SUBCOMMANDS = { build, path: route, aids, pack: packCmd, vendor: vendorCmd, check: checkCmd, eval: evalCmd, layers: layersCmd };

async function run(argv) {
	const [sub, ...rest] = argv;
	try {
		if (!sub || sub === '--help' || sub === '-h') {
			console.log(usage);
			return sub ? 0 : 2;
		}
		const fn = SUBCOMMANDS[sub];
		if (!fn) throw usageError(`unknown nav command "${sub}"`);
		return await fn(rest);
	} catch (err) {
		if (err.exit === 2) {
			console.error(`${err.message}\n\n${usage}`);
			return 2;
		}
		if (err.exit === 1) {
			console.error(`nav: ${err.message}`);
			return 1;
		}
		throw err;
	}
}

module.exports = { name: 'nav', summary: "Terrain navigation from the client geometry (build the grid, route between map points) and Polestar's walking router with its maps (Polestar_Nav)", usage, run };
