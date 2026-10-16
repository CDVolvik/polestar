'use strict';
// The names packs' sources beside DingDB and pfQuest (`i18n names`): Wowhead's
// Forever database in each language (tools/lib/i18n/names-wowhead.js: list
// pages for the ranges holding a wanted id, tooltips for the rest, bracketed
// names dropped), the client's tables, and which source wins an id
// (tools/lib/i18n/names.js buildNames).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('./helpers/tmp');
const wh = require('../tools/lib/i18n/names-wowhead');
const { parseList, listUrl, politeClient, LOCALE_PATHS } = require('../tools/lib/codex/wowhead');
const names = require('../tools/lib/i18n/names');
const { LOCALE_CODES } = require('../tools/lib/i18n/locales');

const T0 = Date.parse('2026-10-16T00:00:00Z');

test('every client language has its Wowhead path and tooltip locale (the ids checked on the live site)', () => {
	assert.deepEqual(Object.keys(LOCALE_PATHS).sort(), [...LOCALE_CODES].sort());
	assert.deepEqual(Object.keys(wh.TOOLTIP_LOCALES).sort(), [...LOCALE_CODES].sort());
	assert.deepEqual(wh.TOOLTIP_LOCALES, { koKR: 1, frFR: 2, deDE: 3, zhCN: 4, esES: 6, ruRU: 7, ptBR: 8, zhTW: 10, esMX: 11 });
	assert.equal(listUrl('npc', { lo: 253000, hi: 253200 }, 'ruRU'), 'https://www.wowhead.com/forever/ru/npcs?filter=37:37;2:5;253000:253200');
	assert.equal(listUrl('quest', { lo: 0, hi: 3000 }), 'https://www.wowhead.com/forever/quests?filter=30:30;2:5;0:3000');
});

test('the quest list\'s Listview, whose data follows other keys, is read', () => {
	const html = `<script>new Listview({template: 'quest', id: 'quests', extraCols: ['popularity'], sort: ["popularity"], maxPopularity: 725, data:[{"category":40,"id":92742,"level":12,"name":"\\u041f\\u0440\\u043e\\u0432\\u0435\\u0440\\u043a\\u0430"}]});</script>`;
	assert.deepEqual(parseList(html, 'quest').rows.map((r) => [r.id, r.name]), [[92742, 'Проверка']]);
});

// A fake Wowhead in two languages: npc list pages answer the rows of their
// range named per language (npc 7 untranslated: "[Npc 7]"), tooltips per id.
function fakeWowhead(calls) {
	const named = { ru: (id) => (id === 7 ? '[Npc 7]' : `Нпс ${id}`), de: (id) => `NPC ${id}` };
	const ids = [5, 7, 150, 250];
	return async (url) => {
		calls.push(url);
		const list = /forever\/(ru|de)\/npcs\?filter=37:37;2:5;(\d+):(\d+)$/.exec(url);
		if (list) {
			const rows = ids.filter((id) => id >= Number(list[2]) && id < Number(list[3])).map((id) => ({ id, name: named[list[1]](id) }));
			return { ok: true, status: 200, text: async () => `<script>new Listview({"template":"npc","id":"npcs","data":${JSON.stringify(rows)}});</script>` };
		}
		const tip = /tooltip\/(npc|quest)\/(\d+)\?locale=(\d+)$/.exec(url);
		if (tip && tip[2] === '404') return { ok: false, status: 404, json: async () => ({}) };
		if (tip) {
			const body = tip[1] === 'quest'
				? { name: 'Задание', tooltip: '<table><tr><td><b class="q">Задание</b><br />Убейте всех в лагере.<br /><br /><span class="q">Requirements:</span></td></tr></table>' }
				: { name: `Tip ${tip[2]} (${tip[3]})` };
			return { ok: true, status: 200, json: async () => body };
		}
		return { ok: false, status: 404, text: async () => '' };
	};
}

test('Wowhead lists: only the English ranges holding a wanted id, in each language\'s path, cached; a bracketed name is none', async () => {
	const sourcesDir = tmpdir('polestar-names-wh-');
	const en = { type: 'npc', chunks: [{ lo: 0, hi: 100, rows: [] }, { lo: 100, hi: 200, rows: [] }, { lo: 200, hi: 300, rows: [] }] };
	fs.mkdirSync(path.dirname(wh.englishListFile(sourcesDir, 'npc')), { recursive: true });
	fs.writeFileSync(wh.englishListFile(sourcesDir, 'npc'), JSON.stringify(en));
	const calls = [];
	const client = politeClient({ fetchImpl: fakeWowhead(calls), delayMs: 0 });
	const want = { npc: new Set([5, 7, 150]) };
	const res = await wh.fetchListNames({ sourcesDir, locales: ['ruRU', 'deDE'], want, client, now: T0 });
	assert.deepEqual(res.failed, []);
	assert.deepEqual(calls, [
		'https://www.wowhead.com/forever/ru/npcs?filter=37:37;2:5;0:100',
		'https://www.wowhead.com/forever/ru/npcs?filter=37:37;2:5;100:200',
		'https://www.wowhead.com/forever/de/npcs?filter=37:37;2:5;0:100',
		'https://www.wowhead.com/forever/de/npcs?filter=37:37;2:5;100:200',
	], 'no range without a wanted id (200-300)');
	const again = await wh.fetchListNames({ sourcesDir, locales: ['ruRU', 'deDE'], want, client, now: T0 + 86400000 });
	assert.equal(again.requests, 0, 'the cache serves a later run');
	const ru = wh.loadWowheadNames(sourcesDir, 'ruRU');
	assert.deepEqual([...ru.names.npc], [[5, 'Нпс 5'], [150, 'Нпс 150']], 'the bracketed [Npc 7] is no name');
	assert.ok(ru.listed.npc.has(7), 'but it is listed: no tooltip will ask for it');
	assert.equal(ru.fetched.first, new Date(T0).toISOString());
});

test('Wowhead tooltips: the language\'s locale id, asked once (a 404 too), a quest\'s objective line read', async () => {
	const sourcesDir = tmpdir('polestar-names-tip-');
	const calls = [];
	const client = politeClient({ fetchImpl: fakeWowhead(calls), delayMs: 0 });
	const wanted = { ruRU: { npc: [250, 404], quest: [92742] } };
	const res = await wh.fetchTooltipNames({ sourcesDir, wanted, client, now: T0 });
	assert.equal(res.fetched, 3);
	assert.deepEqual(calls, [
		'https://nether.wowhead.com/forever/tooltip/npc/250?locale=7',
		'https://nether.wowhead.com/forever/tooltip/npc/404?locale=7',
		'https://nether.wowhead.com/forever/tooltip/quest/92742?locale=7',
	]);
	const again = await wh.fetchTooltipNames({ sourcesDir, wanted, client, now: T0 });
	assert.deepEqual([again.requests, again.cached], [0, 3]);
	const ru = wh.loadWowheadNames(sourcesDir, 'ruRU');
	assert.equal(ru.names.npc.get(250), 'Tip 250 (7)');
	assert.equal(ru.names.npc.has(404), false);
	assert.equal(ru.objective.get(92742), 'Убейте всех в лагере.');
	const capped = await wh.fetchTooltipNames({ sourcesDir, wanted: { deDE: { npc: [1, 2, 3] } }, client, limit: 1, now: T0 });
	assert.deepEqual([capped.fetched, capped.left], [1, 2], '--limit');
});

test('per id the client\'s tables win, then Wowhead, then DingDB, then pfQuest; the extra kinds come from the client\'s tables', () => {
	const m = (o) => new Map(Object.entries(o).map(([k, v]) => [Number(k), v]));
	const ids = {
		quest: new Set([1, 2]), npc: new Set([1, 2, 3, 4]), object: new Set(), item: new Set([10, 11]),
		map: new Set([36]), encounter: null, faction: new Set([72]), taxi: new Set([2]), objective: new Set([1, 2]),
	};
	const wago = { ruRU: { item: m({ 10: 'Клиент 10' }), map: m({ 36: 'Мертвые копи', 999: 'x' }), encounter: m({ 230: 'Событие' }), faction: m({ 72: 'Штормград' }), taxi: m({ 2: 'Штормград, Элвиннский лес' }) } };
	const wowhead = { ruRU: { names: { quest: m({ 2: 'Вовхед 2' }), npc: m({ 1: 'Вовхед 1' }), object: m({}), item: m({ 10: 'Вовхед 10', 11: 'Вовхед 11' }) }, objective: m({ 2: 'Цель Вовхеда' }) } };
	const ding = { ruRU: { quest: m({ 1: 'Динг 1' }), npc: m({ 1: 'Динг 1', 2: 'Динг 2' }), object: m({}), item: m({}) } };
	const pf = {
		ruRU: { quest: m({}), npc: m({ 3: 'Пф 3', 4: 'Same' }), object: m({}), item: m({}), objective: m({ 1: 'Убить$Bвсех', 2: 'Пф цель' }) },
		enUS: { quest: m({}), npc: m({ 4: 'Same' }), object: m({}), item: m({}), objective: m({ 1: 'Kill all' }) },
	};
	const out = names.buildNames({ locales: ['ruRU'], ids, ding, pf, wago, wowhead }).ruRU;
	const obj = (k) => Object.fromEntries(out.names[k]);
	assert.deepEqual(obj('item'), { 10: 'Клиент 10', 11: 'Вовхед 11' }, 'the client table first, Wowhead for the rest');
	assert.deepEqual(obj('npc'), { 1: 'Вовхед 1', 2: 'Динг 2', 3: 'Пф 3' }, 'Wowhead before DingDB; a pfQuest name equal to its English one is none');
	assert.deepEqual(obj('quest'), { 1: 'Динг 1', 2: 'Вовхед 2' });
	assert.deepEqual(obj('objective'), { 1: 'Убить всех', 2: 'Цель Вовхеда' }, 'pfQuest\'s $B is a space; Wowhead first');
	assert.deepEqual([obj('map'), obj('encounter'), obj('faction'), obj('taxi')], [{ 36: 'Мертвые копи' }, { 230: 'Событие' }, { 72: 'Штормград' }, { 2: 'Штормград, Элвиннский лес' }],
		'only the ids Polestar names; every encounter');
	assert.deepEqual(out.from.npc, { wago: 0, wowhead: 1, ding: 1, pfquest: 1 });
	assert.deepEqual(out.from.item, { wago: 1, wowhead: 1, ding: 0, pfquest: 0 });
});

test('the extra ids: instance maps, factions, flight points, lift objects and the dungeon quests with an event objective', () => {
	const dir = tmpdir('polestar-names-extra-');
	const codex = path.join(dir, 'codex');
	fs.mkdirSync(codex);
	fs.writeFileSync(path.join(codex, 'instances.json'), JSON.stringify({ deadmines: { map: 36 }, brd: { map: 230 } }));
	fs.writeFileSync(path.join(codex, 'factions.json'), JSON.stringify({ 72: { id: 72 }, 76: { id: 76 } }));
	fs.writeFileSync(path.join(codex, 'quests.json'), JSON.stringify({
		155: { objectives: [{ type: 'event', id: 78, text: 'Escort' }] },
		166: { objectives: [{ type: 'monster', id: 639 }] },
		200: { objectives: [{ type: 'event', id: 1 }] },
	}));
	fs.writeFileSync(path.join(codex, 'journal.json'), JSON.stringify({ dungeons: { deadmines: { bosses: [{ quests: [{ id: 155 }, { id: 166 }] }] } } }));
	const travel = path.join(dir, 'TravelData.lua');
	fs.writeFileSync(travel, 'local ADDON, ns = ...\nlocal N = ns.Nav\nN.RegisterTravelData({ taxi = { {2,0,1,2,1453,1,2,1,"Stormwind"}, {4,0,1,2,1436,1,2,1,"Sentinel Hill"} } })\nN.RegisterCrossings({})\n');
	const chokepoints = path.join(dir, 'Chokepoints.lua');
	fs.writeFileSync(chokepoints, '{ kind = "lift", liftObject = 4170 },\n{ kind = "lift", liftObject = 20649 },\n');
	const extra = names.extraIds({ codex, travel, chokepoints });
	const sorted = (s) => [...s].sort((a, b) => a - b);
	assert.deepEqual([sorted(extra.map), sorted(extra.faction), sorted(extra.taxi), sorted(extra.liftObject), sorted(extra.objective)],
		[[36, 230], [72, 76], [2, 4], [4170, 20649], [155]]);
	assert.equal(extra.encounter, null, 'every encounter the client has');
	assert.deepEqual(sorted(names.extraIds({ codex: path.join(dir, 'none'), travel: path.join(dir, 'none.lua'), chokepoints }).map), [], 'missing inputs leave a kind empty');
});

test('a name some source left in English never beats a translation, whichever source has it; an id named only in English gets none', () => {
	const m = (o) => new Map(Object.entries(o).map(([k, v]) => [Number(k), v]));
	const ids = { quest: new Set(), npc: new Set([1, 2, 3, 4]), object: new Set(), item: new Set([10]) };
	const english = {};
	for (const [id, n] of [[1, 'Dolanaar Sentinel'], [2, 'Hogger'], [3, 'Grund Drokda'], [4, 'Alba Fairmoon']]) names.addEnglish(english, 'npc', id, n);
	names.addEnglish(english, 'item', 10, 'Squirrel Nut');
	const wago = { zhCN: { item: m({ 10: 'Squirrel Nut' }) } };
	const wowhead = { zhCN: { names: { npc: m({ 1: 'Dolanaar Sentinel', 4: '阿尔巴·晴月' }) } } };
	const ding = { zhCN: { npc: m({ 1: '泰达希尔卫兵', 2: 'Hogger', 3: 'Grund Drokda' }), item: m({}) } };
	const pf = { zhCN: { npc: m({ 2: '霍格' }), item: m({ 10: '松鼠坚果' }) }, enUS: { npc: m({}), item: m({}) } };
	const out = names.buildNames({ locales: ['zhCN'], ids, ding, pf, wago, wowhead, english }).zhCN;
	assert.deepEqual(Object.fromEntries(out.names.npc), { 1: '泰达希尔卫兵', 2: '霍格', 4: '阿尔巴·晴月' }, 'Wowhead\'s and DingDB\'s English give way to the next translation');
	assert.deepEqual(Object.fromEntries(out.names.item), { 10: '松鼠坚果' }, 'the client table\'s English too');
	assert.deepEqual([...out.english.npc], [3], 'named only in English: nothing stored, the English shows');
});

test('names are written with one space for every run of white space, line breaks too; placeholder and test names are none', () => {
	assert.equal(names.clean('  Avis de\n recherche\t:  "Lardeur" '), 'Avis de recherche : "Lardeur"');
	const m = (o) => new Map(Object.entries(o).map(([k, v]) => [Number(k), v]));
	const ids = { quest: new Set(), npc: new Set(), object: new Set(), item: new Set([1, 2, 3, 4, 5, 6, 7]), objective: new Set([9]) };
	const pf = {
		frFR: {
			item: m({ 1: '[PH] Épée', 2: 'Épée [PÉRIMÉ]', 3: 'Bâton (DNT)', 4: '<NYI> Bottes', 5: 'Hache\nde  guerre', 6: '[INUTILISÉ] Anneau', 7: 'Bouclier (test)' }),
			objective: m({ 9: 'Tuez$Bles kobolds.' }),
		},
		enUS: { item: m({}), objective: m({}) },
	};
	const out = names.buildNames({ locales: ['frFR'], ids, pf }).frFR;
	assert.deepEqual(Object.fromEntries(out.names.item), { 5: 'Hache de guerre' });
	assert.equal(out.names.objective.get(9), 'Tuez les kobolds.');
});

test('the client tables come from a build holding every table in English and every language asked; none stops the build', async () => {
	const { loadClientNames } = require('../tools/lib/i18n/names-wago');
	const sourcesDir = tmpdir('polestar-names-wago-');
	const csv = (rows, field) => `ID,${field}\n${rows.map(([id, n]) => `${id},${n}`).join('\n')}\n`;
	const TABLES = { ItemSparse: 'Display_lang', Map: 'MapName_lang', DungeonEncounter: 'Name_lang', Faction: 'Name_lang', TaxiNodes: 'Name_lang' };
	const write = (build, locale, tables, names_) => {
		for (const t of tables) {
			const dir = path.join(sourcesDir, 'wago', build, ...(locale ? [locale] : []));
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(path.join(dir, `${t}.csv`), csv([[1, names_[t] || `${t} ${locale || 'en'}`]], TABLES[t]));
		}
	};
	const all = Object.keys(TABLES);
	// 1.60.1.2 is newer but lacks ruRU's TaxiNodes: 1.60.1.1 is the one read.
	for (const l of [null, 'ruRU']) write('1.60.1.1', l, all, {});
	write('1.60.1.2', null, all, {});
	write('1.60.1.2', 'ruRU', all.filter((t) => t !== 'TaxiNodes'), {});
	for (const l of [null, 'ruRU']) write('1.15.9.1', l, ['ItemSparse'], { ItemSparse: l ? 'Эра' : 'Era' });
	const got = await loadClientNames({ sourcesDir, locales: ['ruRU'], offline: true });
	assert.deepEqual(got.builds, { forever: '1.60.1.1', era: '1.15.9.1' });
	assert.equal(got.names.ruRU.taxi.get(1), 'TaxiNodes ruRU');
	assert.equal(got.english.map.get(1), 'Map en');
	await assert.rejects(loadClientNames({ sourcesDir, locales: ['deDE'], offline: true }), /no forever client tables/);
});
