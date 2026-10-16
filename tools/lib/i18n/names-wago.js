'use strict';
// `i18n names`: the client's own strings in each language, from the client's
// tables (DB2) as wago.tools exports them with `&locale=`
// (tools/lib/data/wago.js), cached per build and language in
// data/sources/wago/<build>/<locale>/<Table>.csv. The client's text is the
// most exact name there is, so these come before Wowhead, DingDB and pfQuest.
//
// From the Forever client's tables:
//   item       ItemSparse.Display_lang
//   map        Map.MapName_lang (instance maps: dungeon and raid names)
//   encounter  DungeonEncounter.Name_lang (bosses, events among them)
//   faction    Faction.Name_lang
//   taxi       TaxiNodes.Name_lang (flight points)
// Forever's ItemSparse holds only part of the Classic items (the rest load
// from the server): for those, the Classic Era client's ItemSparse, whose
// items Forever kept. Forever's newest items are in neither: Wowhead names
// those.

const { cachedTable, pickBuild } = require('../data/wago');

const TABLES = {
	item: { table: 'ItemSparse', field: 'Display_lang' },
	map: { table: 'Map', field: 'MapName_lang' },
	encounter: { table: 'DungeonEncounter', field: 'Name_lang' },
	faction: { table: 'Faction', field: 'Name_lang' },
	taxi: { table: 'TaxiNodes', field: 'Name_lang' },
};
const KINDS = Object.keys(TABLES);
// The kinds the Era client's tables fill in behind Forever's.
const ERA_KINDS = ['item'];

async function fetchText(fetchImpl, url) {
	const res = await fetchImpl(url, { headers: { 'user-agent': 'polestar-names-build' } });
	if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
	return res.text();
}

// One build's tables of kinds in English and each language: { names: {
// [locale]: { kind: Map id -> name, same: { kind: Set of the ids whose name
// is the English one } } }, urls: [url patterns], warnings }. A string the
// same as the English one is often one the client left untranslated (a test
// item, a new name): `same` lets the build prefer another source's
// translation for it.
async function loadTables({ sourcesDir, build, locales, kinds, offline, fetchImpl, log }) {
	const out = { names: {}, urls: [], warnings: [] };
	const read = async (locale, table, field) => {
		const rows = await cachedTable({ sourcesDir, build, table, locale, offline, get: (url) => fetchText(fetchImpl, url), log });
		const m = new Map();
		for (const r of rows) {
			const id = Number(r.ID);
			const name = typeof r[field] === 'string' ? r[field].trim() : '';
			if (id > 0 && name) m.set(id, name);
		}
		return m;
	};
	const english = {};
	for (const kind of kinds) {
		try {
			english[kind] = await read(null, TABLES[kind].table, TABLES[kind].field);
		} catch (err) {
			english[kind] = new Map();
			out.warnings.push(`wago.tools ${build}: no English ${TABLES[kind].table} (${err.message})`);
		}
	}
	for (const locale of locales) {
		const byKind = (out.names[locale] = { same: {} });
		for (const kind of kinds) {
			const { table, field } = TABLES[kind];
			byKind[kind] = new Map();
			byKind.same[kind] = new Set();
			try {
				byKind[kind] = await read(locale, table, field);
			} catch (err) {
				out.warnings.push(`wago.tools ${build} ${locale}: no ${table} (${err.message})`);
				continue;
			}
			const url = `https://wago.tools/db2/${table}/csv?build=${build}&locale=<locale>`;
			if (!out.urls.includes(url)) out.urls.push(url);
			for (const [id, name] of byKind[kind]) if (english[kind].get(id) === name) byKind.same[kind].add(id);
		}
	}
	return out;
}

// The client tables of each language: Forever's (build `forever`, else the
// newest wago.tools lists), then the Era client's items (build `era`, else
// the newest) for the ids Forever's lack. A product neither listed nor
// cached is left out with a warning.
// -> { names: { [locale]: { kind: Map id -> name } }, builds: { forever, era }, urls, warnings }
async function loadClientNames({ sourcesDir, locales, forever, era, offline = false, fetchImpl = globalThis.fetch, log = () => {} }) {
	const out = { names: Object.fromEntries(locales.map((l) => [l, { ...Object.fromEntries(KINDS.map((k) => [k, new Map()])), same: Object.fromEntries(KINDS.map((k) => [k, new Set()])) }])), builds: {}, urls: [], warnings: [] };
	for (const [product, build, kinds] of [['forever', forever, KINDS], ['era', era, ERA_KINDS]]) {
		let picked;
		try {
			picked = await pickBuild({ sourcesDir, build, offline, fetchImpl, product, tables: ['UiMap'] });
		} catch (err) {
			out.warnings.push(`no ${product} client tables: ${err.message}`);
			continue;
		}
		out.warnings.push(...picked.warnings);
		const got = await loadTables({ sourcesDir, build: picked.build, locales, kinds, offline, fetchImpl, log });
		out.warnings.push(...got.warnings);
		if (!got.urls.length) continue;
		out.builds[product] = picked.build;
		out.urls.push(...got.urls);
		for (const l of locales) {
			for (const k of kinds) {
				for (const [id, name] of got.names[l][k]) {
					if (out.names[l][k].has(id)) continue;
					out.names[l][k].set(id, name);
					if (got.names[l].same[k].has(id)) out.names[l].same[k].add(id);
				}
			}
		}
	}
	return out;
}

module.exports = { TABLES, KINDS, ERA_KINDS, loadClientNames };
