'use strict';
// `i18n names`: the names Wowhead's Forever database gives in each client
// language (docs/TRANSLATING.md, "Names"). Its database is the Forever
// client's, so it holds the names of Forever's own quests, NPCs, objects and
// items, which neither DingDB nor pfQuest has.
//
// Bulk: the list pages in the language's path
// (www.wowhead.com/forever/<ru|de|...>/{quests,npcs,objects,items}?filter=...),
// read with the Codex's list reader (tools/lib/codex/wowhead.js: fetchLists,
// parseList, politeClient: one request at a time, DELAY_MS apart, a longer
// pause each time on 403/429, no more requests after MAX_FAILURES in a row).
// Only the id ranges holding an id the pack wants are asked for, each range
// the English list's (data/sources/wowhead/codex/lists for npcs, objects and
// items; data/sources/wowhead/names/enUS/lists for quests), so no range needs
// splitting in another language. Cached per language in
// data/sources/wowhead/names/<locale>/lists/<type>.json, kept MAX_AGE_DAYS.
//
// Stragglers: the tooltip JSON
// (nether.wowhead.com/forever/tooltip/<type>/<id>?locale=<n>), only for an id
// no list row holds that has no name from any other source, cached in
// data/sources/wowhead/names/<locale>/<type>/<id>.json.
//
// Wowhead marks a name it has no translation for with brackets
// ("[Alba Fairmoon]"): those are no names. An unbracketed name equal to the
// English one is the language's own (German keeps many proper names).

const fs = require('node:fs');
const path = require('node:path');
const { fetchLists, politeClient, LISTS, LOCALE_PATHS } = require('../codex/wowhead');

const TYPES = ['quest', 'npc', 'object', 'item'];
// Wowhead's tooltip `locale=` of each client language (checked on
// tooltip/npc/253092; not the ids older Wowhead documentation gives).
const TOOLTIP_LOCALES = { koKR: 1, frFR: 2, deDE: 3, zhCN: 4, esES: 6, ruRU: 7, ptBR: 8, zhTW: 10, esMX: 11 };
const TOOLTIP = 'https://nether.wowhead.com/forever/tooltip';
const DELAY_MS = 2500;
// No run asks faster than this, whatever --delay says.
const MIN_DELAY_MS = 2000;
const RETRY_PAUSE_MS = 30000;
const MAX_FAILURES = 5;
const MAX_AGE_DAYS = 30;
const USER_AGENT = 'Mozilla/5.0 (polestar-names-build)';

const namesDir = (sourcesDir, locale) => path.join(sourcesDir, 'wowhead', 'names', locale);
const localeListFile = (sourcesDir, locale, type) => path.join(namesDir(sourcesDir, locale), 'lists', `${type}.json`);
const tooltipFile = (sourcesDir, locale, type, id) => path.join(namesDir(sourcesDir, locale), type, `${id}.json`);
// The English list whose ranges the languages reuse: the Codex's, quests our own.
const englishListFile = (sourcesDir, type) => (type === 'quest'
	? localeListFile(sourcesDir, 'enUS', type)
	: path.join(sourcesDir, 'wowhead', 'codex', 'lists', `${type}.json`));

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);

function writeJson(file, value) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(`${file}.tmp`, `${JSON.stringify(value)}\n`);
	fs.renameSync(`${file}.tmp`, file);
}

const unhtml = (s) => String(s)
	.replace(/<br\s*\/?>/gi, '\n')
	.replace(/<[^>]*>/g, '')
	.replace(/&#0?39;/g, "'")
	.replace(/&quot;/g, '"')
	.replace(/&nbsp;/g, ' ')
	.replace(/&lt;/g, '<')
	.replace(/&gt;/g, '>')
	.replace(/&amp;/g, '&');

// A name Wowhead has in this language: not empty, not "[English]" (no
// translation), not a "[PH] ..." placeholder.
function realName(name) {
	const s = typeof name === 'string' ? name.trim() : '';
	return s && !/^\[.*\]$/.test(s) && !/^\[PH\]/i.test(s) ? s : null;
}

// The ranges of chunks (the English list's) holding at least one of ids.
function rangesWith(chunks, ids) {
	const sorted = [...ids].sort((a, b) => a - b);
	const out = [];
	for (const c of chunks) {
		let i = 0;
		while (i < sorted.length && sorted[i] < c.lo) i++;
		if (i < sorted.length && (c.hi == null || sorted[i] < c.hi)) out.push({ lo: c.lo, hi: c.hi });
	}
	return out;
}

function makeClient({ client, delayMs = DELAY_MS, log, fetchImpl }) {
	return client || politeClient({ delayMs: Math.max(MIN_DELAY_MS, delayMs), retryPauseMs: RETRY_PAUSE_MS, maxFailures: MAX_FAILURES, userAgent: USER_AGENT, log, ...(fetchImpl ? { fetchImpl } : {}) });
}

// The list pages of each language for the ranges holding a wanted id.
// want: { quest, npc, object, item: Set of ids }. The English quest list is
// read first (all of it, split as it needs) to give the quest ranges.
// -> { requests, planned, failed: [{ locale, type, url, error }], missingEnglish: [types] }
async function fetchListNames({ sourcesDir, locales, want, client, dryRun = false, offline = false, now = Date.now(), maxAgeDays = MAX_AGE_DAYS, log = () => {}, delayMs, fetchImpl }) {
	client = makeClient({ client, delayMs, log, fetchImpl });
	const before = client.requests;
	const res = { requests: 0, planned: 0, failed: [], missingEnglish: [] };
	if (!offline && want.quest && want.quest.size) {
		const en = await fetchLists({ sourcesDir, types: ['quest'], client, maxAgeDays, now, dryRun, log, listFileOf: (t) => englishListFile(sourcesDir, t) });
		res.planned += en.planned;
		for (const f of en.failed) res.failed.push({ locale: 'enUS', ...f });
	}
	const ranges = {};
	for (const type of TYPES) {
		if (!want[type] || !want[type].size) continue;
		const en = readJson(englishListFile(sourcesDir, type));
		if (!en || !Array.isArray(en.chunks)) {
			res.missingEnglish.push(type);
			continue;
		}
		ranges[type] = rangesWith(en.chunks, want[type]);
	}
	for (const locale of locales) {
		if (!LOCALE_PATHS[locale]) continue;
		const types = Object.keys(ranges);
		if (offline || !types.length) continue;
		const got = await fetchLists({
			sourcesDir, types, client, maxAgeDays, now, dryRun, log, locale, ranges,
			listFileOf: (t) => localeListFile(sourcesDir, locale, t),
		});
		res.planned += got.planned;
		for (const f of got.failed) res.failed.push({ locale, ...f });
	}
	res.requests = client.requests - before;
	return res;
}

// Tooltips for ids no list gave: wanted { [locale]: { type: [ids] } }.
// A cached answer (a name, or notFound) is never asked again. limit caps the
// requests of the run. -> { fetched, cached, requests, failed, left }
async function fetchTooltipNames({ sourcesDir, wanted, client, dryRun = false, offline = false, limit = Infinity, now = Date.now(), log = () => {}, delayMs, fetchImpl }) {
	client = makeClient({ client, delayMs, log, fetchImpl });
	const before = client.requests;
	const res = { fetched: 0, cached: 0, requests: 0, failed: [], left: 0 };
	for (const [locale, byType] of Object.entries(wanted)) {
		const n = TOOLTIP_LOCALES[locale];
		if (!n) continue;
		for (const [type, ids] of Object.entries(byType)) {
			for (const id of ids) {
				const file = tooltipFile(sourcesDir, locale, type, id);
				if (fs.existsSync(file)) {
					res.cached++;
					continue;
				}
				if (offline || dryRun || client.stopped || res.fetched + res.failed.length >= limit) {
					res.left++;
					continue;
				}
				const url = `${TOOLTIP}/${type}/${id}?locale=${n}`;
				const got = await client.get(url, 'json');
				if (got.status === 404) {
					writeJson(file, { id, notFound: true, fetchedAt: new Date(now).toISOString(), url });
					res.fetched++;
				} else if (got.body && typeof got.body === 'object') {
					writeJson(file, { id, name: got.body.name || null, tooltip: typeof got.body.tooltip === 'string' ? got.body.tooltip : null, fetchedAt: new Date(now).toISOString(), url });
					res.fetched++;
				} else res.failed.push({ locale, type, id, url, error: got.error || 'no JSON' });
			}
		}
	}
	res.requests = client.requests - before;
	return res;
}

// A quest tooltip's objective text: the paragraph after the title, before
// the requirements.
function questObjective(tooltip) {
	if (typeof tooltip !== 'string') return null;
	const body = tooltip.replace(/^[\s\S]*?<b class="q">[\s\S]*?<\/b>/, '');
	const text = unhtml(body.split(/<span class="q">/)[0]).split(/\n\s*\n/).map((s) => s.replace(/\s+/g, ' ').trim()).find((s) => s);
	return text || null;
}

// Everything cached for one language: { names: { type: Map id -> name },
// english: { type: Map id -> Wowhead's English name } (the build tells a
// translation from a string left in English by it), listed: { type: Set of
// ids a list row holds, named or not }, objective: Map quest id -> text
// (tooltips), fetched: { first, last } (ISO dates) }.
function loadWowheadNames(sourcesDir, locale) {
	const names = Object.fromEntries(TYPES.map((t) => [t, new Map()]));
	const english = Object.fromEntries(TYPES.map((t) => [t, new Map()]));
	const listed = Object.fromEntries(TYPES.map((t) => [t, new Set()]));
	const objective = new Map();
	const dates = [];
	for (const type of TYPES) {
		const en = readJson(englishListFile(sourcesDir, type));
		for (const c of (en && en.chunks) || []) for (const r of c.rows || []) if (r.name) english[type].set(r.id, String(r.name).trim());
		const take = (id, name) => names[type].set(id, name);
		const list = readJson(localeListFile(sourcesDir, locale, type));
		for (const c of (list && list.chunks) || []) {
			if (c.fetchedAt) dates.push(c.fetchedAt);
			for (const r of c.rows || []) {
				listed[type].add(r.id);
				const n = realName(r.name);
				if (n) take(r.id, n);
			}
		}
		const dir = path.join(namesDir(sourcesDir, locale), type);
		if (!fs.existsSync(dir)) continue;
		for (const f of fs.readdirSync(dir)) {
			if (!f.endsWith('.json')) continue;
			const t = readJson(path.join(dir, f));
			if (!t || t.notFound) continue;
			if (t.fetchedAt) dates.push(t.fetchedAt);
			const n = realName(t.name);
			if (n && !names[type].has(t.id)) take(t.id, n);
			if (type === 'quest' && n) {
				const o = questObjective(t.tooltip);
				if (o) objective.set(t.id, o);
			}
		}
	}
	dates.sort();
	return { names, english, listed, objective, fetched: dates.length ? { first: dates[0], last: dates[dates.length - 1] } : null };
}

module.exports = {
	TYPES, TOOLTIP_LOCALES, TOOLTIP, DELAY_MS, MIN_DELAY_MS, MAX_AGE_DAYS,
	fetchListNames, fetchTooltipNames, loadWowheadNames, questObjective, rangesWith, realName,
	localeListFile, tooltipFile, englishListFile, LISTS,
};
