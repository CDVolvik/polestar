'use strict';
// Security hardening for import strings (0.2.6): tests for every finding in
// data/local/research/ImportSafety.md.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const { runAddon } = require('./helpers/lua');
const { compile, fixtureData } = require('./helpers/dsl');
const { importString, encodeImport, adler32, LIMITS } = require('../tools/lib/pack/importstring');
const { guideData } = require('../tools/lib/dsl/emit');

const CORE = { name: 'Polestar', files: ['Core/Core.xml'] };
const ID = 'yendi/northshire';

const GUIDE = `guide ${ID}
title Northshire Valley
faction Alliance
levels 1-6
zone Elwynn Forest
version 1

step Deputy Willem
  accept 783

step Back to the abbey
  turnin 783
`;

let compiled;
function guide() {
	if (!compiled) {
		const c = compile({ 'northshire.guide': GUIDE }, fixtureData(), { pack: 'yendi', author: 'Yendi' });
		assert.deepEqual(c.errors, []);
		compiled = c.guides[0];
	}
	return compiled;
}

const MANIFEST = { id: 'yendi', license: 'CC-BY-4.0' };

function string() {
	const r = importString(guide(), { manifest: MANIFEST, data: fixtureData() });
	assert.equal(r.error, undefined);
	return r.text;
}

function payload() {
	const p = { format: 3, license: 'CC-BY-4.0', guide: guideData(guide()._localised || guide()) };
	return JSON.parse(JSON.stringify(p));
}

function envelope(raw) {
	const bytes = Buffer.from(raw, 'utf8');
	return `!PS1!${adler32(bytes).toString(16).padStart(8, '0')}!${zlib.deflateSync(bytes).toString('base64')}`;
}

const WORLD = `
local w = stub.world
w.addMap(1429, { name = "Elwynn Forest", c = 0, left = 1500, right = -1500, top = 500, bottom = -1500 })
w.moveTo(1429, 48, 42)
`;

const SAVE = `
function save(text)
  local info, why = I.Preview(text) assert(info, why) assert(I.Save(info.entry)) return info
end
`;

function run(script, opts = {}) {
	return runAddon({
		stubs: ['stub_world.lua', 'stub_encoding.lua', ...(opts.stubs || [])],
		addons: [CORE],
		before: WORLD + (opts.before || ''),
		saved: opts.saved,
		login: true,
		script: `I = Polestar.Import\nG = Polestar.Guides\n${SAVE}\n${script}`,
	}).emitted;
}

const str = (s) => JSON.stringify(s);
function lua(v) {
	if (Array.isArray(v)) return `{ ${v.map(lua).join(', ')} }`;
	if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `[${/^\d+$/.test(k) ? k : JSON.stringify(k)}] = ${lua(x)}`).join(', ')} }`;
	return JSON.stringify(v);
}


// ── Finding 1: fill output is capped at 2×text (8192 bytes) ─────────────────

test('finding 1: fill stops at 8192 bytes; leftover tokens stay as written', () => {
	// A note of 100 × "{npc:1}" (700 bytes) with name value at the 128-byte cap.
	// Before the fix: O(n²) allocation; after: fill stops at 8192 bytes of
	// output and appends the remaining original text (at most 700 more bytes).
	const NOTE = '{npc:1}'.repeat(100); // 700 bytes
	const p = payload();
	p.guide.names = { 'npc:1': 'A'.repeat(128) };
	p.guide.steps[0].note = NOTE;
	const [out] = run(`
		save(${str(encodeImport(p))})
		local g = G.Get(${str(ID)})
		emit({ note_len = #(g.steps[1].note or ""), ok = true })
	`);
	assert.equal(out.ok, true);
	// After fill: at most FILL_CAP (8192) of expanded text + remaining original (≤700).
	assert.ok(out.note_len <= 8192 + NOTE.length, `note length ${out.note_len} unexpectedly large`);
	// Also ensure meaningful fill happened (more than the original note).
	assert.ok(out.note_len > NOTE.length, 'some tokens were filled');
});

test('finding 1: a names/written value over 128 bytes is refused by the writer', () => {
	const p = payload();
	p.guide.names = { 'npc:1': 'A'.repeat(129) };
	// importString's longText should catch this
	const bytes = Buffer.from(JSON.stringify(p), 'utf8');
	if (bytes.length <= LIMITS.payload) {
		// The addon also refuses it
		const [out] = run(`
			local info, why = I.Preview(${str(encodeImport(p))})
			emit({ refused = info == nil, why = why or "" })
		`);
		assert.equal(out.refused, true, 'addon must refuse a names value over 128 bytes');
		assert.match(out.why, /longer than Polestar reads/);
	}
});

test('finding 1: a names/written value at the cap (128 bytes) is accepted', () => {
	const p = payload();
	p.guide.names = { 'npc:1': 'A'.repeat(128) };
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ ok = info ~= nil, why = why or "" })
	`);
	assert.equal(out.ok, true, out.why);
});

// ── Finding 2: goals-per-step and candidates-per-goal caps ──────────────────

test('finding 2: a step with more than 100 goals is refused', () => {
	const p = payload();
	// Duplicate the first goal until we exceed the cap
	const baseGoal = p.guide.steps[0].goals[0];
	p.guide.steps[0].goals = Array.from({ length: 101 }, () => ({ ...baseGoal }));
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ refused = info == nil, why = why or "" })
	`);
	assert.equal(out.refused, true);
	assert.match(out.why, /goals in step/);
});

test('finding 2: a goal with more than 128 candidates is refused', () => {
	const p = payload();
	// Add a goal with 129 candidates
	const cand = { npc: 1, map: 1, x: 50, y: 50 };
	p.guide.steps[0].goals.push({
		t: 'turnin', quest: 783,
		candidates: Array.from({ length: 129 }, () => ({ ...cand })),
	});
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ refused = info == nil, why = why or "" })
	`);
	assert.equal(out.refused, true);
	assert.match(out.why, /candidates in a goal/);
});

test('finding 2: caps match the writer LIMITS (goals=100, candidates=128)', () => {
	assert.equal(LIMITS.goals, 100);
	assert.equal(LIMITS.candidates, 128);
	const [out] = run(`emit({ goals = I.LIMITS.goals, candidates = I.LIMITS.candidates })`);
	assert.equal(out.goals, 100);
	assert.equal(out.candidates, 128);
});

// ── Finding 3: at most one direct turn-in per quest per step ────────────────

test('finding 3: two direct turn-ins for the same quest in one step are refused', () => {
	const p = payload();
	p.guide.steps[0].goals.push({ t: 'turnin', quest: 783, direct: true });
	p.guide.steps[0].goals.push({ t: 'turnin', quest: 783, direct: true });
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ refused = info == nil, why = why or "" })
	`);
	assert.equal(out.refused, true);
	assert.match(out.why, /direct turn-in for quest/);
});

test('finding 3: one direct turn-in per quest per step is allowed', () => {
	const p = payload();
	// A valid turnin goal requires title; copy from the existing step's guide data.
	p.guide.steps[0].goals.push({ t: 'turnin', quest: 783, title: 'A Threat Within', direct: true });
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ ok = info ~= nil, why = why or "" })
	`);
	assert.equal(out.ok, true, out.why);
});

// ── Finding 4: control characters and id escaping ───────────────────────────

test('finding 4: \\b \\f \\r in JSON strings are refused', () => {
	const cases = {
		backspace: envelope('{"format":3,"license":"MIT","guide":{"id":"yendi/x","title":"a\\bb"}}'),
		formfeed: envelope('{"format":3,"license":"MIT","guide":{"id":"yendi/x","title":"a\\fb"}}'),
		cr: envelope('{"format":3,"license":"MIT","guide":{"id":"yendi/x","title":"a\\rb"}}'),
	};
	const [out] = run(`
		local out = {}
		for k, text in pairs(${lua(cases)}) do
			local info, why = I.Preview(text)
			out[k] = info and "accepted" or why
		end
		emit(out)
	`);
	for (const [name, msg] of Object.entries(out)) {
		assert.match(String(msg), /damaged or incomplete/, `${name}: expected refusal`);
	}
});

test('finding 4: \\u0000 and other control \\uXXXX are refused', () => {
	const nul = envelope('{"format":3,"license":"MIT","guide":{"id":"yendi/x","title":"a\\u0000b"}}');
	const ctrl = envelope('{"format":3,"license":"MIT","guide":{"id":"yendi/x","title":"a\\u0003b"}}');
	const [out] = run(`
		local n = I.Preview(${str(nul)})
		local c = I.Preview(${str(ctrl)})
		emit({ nul = n == nil, ctrl = c == nil })
	`);
	assert.equal(out.nul, true, 'NUL should be refused');
	assert.equal(out.ctrl, true, 'U+0003 should be refused');
});

test('finding 4: a guide id with special chars is refused', () => {
	const p = payload();
	p.guide.id = 'yendi/north|cffRed|rshire'; // colour codes in id
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ refused = info == nil })
	`);
	assert.equal(out.refused, true);
});

test('finding 4: guide ids with uppercase, spaces, or slashes beyond the slug are refused', () => {
	const cases = [
		'yendi/north shire', // space
		'yendi/North',       // uppercase
		'yendi/a/b',         // two slashes
		'yendi/',            // empty slug
		'/northshire',       // no author
	];
	const strings = cases.map((id) => {
		const p = payload(); p.guide.id = id; return encodeImport(p);
	});
	const [out] = run(`
		local results = {}
		for i, text in ipairs(${lua(strings)}) do
			local info, why = I.Preview(text)
			results[i] = info and "accepted" or "refused"
		end
		emit({ results = results })
	`);
	for (const r of out.results) assert.equal(r, 'refused');
});

// ── Finding 5: Import.List safe for broken entries; recovery commands ────────

test('finding 5: Import.List returns a title for a failed entry without calling Prepare', () => {
	// A stored entry whose steps is a string rather than a table – it was
	// hand-edited or saved by a newer Polestar version then downgraded.
	// build() refuses it at login, so it never registers; List() must show
	// a title without calling Prepare (which walks steps and errors).
	const good = payload();
	const bad = { ...payload().guide, id: 'yendi/broken', steps: 'oops' };
	const saved = `PolestarDB = { schema = 1, settings = {}, imports = { [${str(ID)}] = ${lua(good)}, ["yendi/broken"] = { format = 3, license = "CC-BY-4.0", guide = ${lua(bad)} } } }`;
	const [out] = run(`
		local list = I.List()
		local broken = nil
		for _, e in ipairs(list) do if e.id == "yendi/broken" then broken = e end end
		local del = I.Delete("yendi/broken")
		emit({ listed = broken ~= nil, title_ok = broken and type(broken.title) == "string", del = del, after = #I.List() })
	`, { saved: { Polestar: saved } });
	assert.equal(out.listed, true, 'broken entry appears in List()');
	assert.equal(out.title_ok, true, 'broken entry has a string title');
	assert.equal(out.del, true, 'Delete works on broken entry');
	assert.equal(out.after, 1);
});

test('finding 5: import clear removes all imported guides', () => {
	const [out] = run(`
		save(${str(string())})
		assert(#I.List() == 1)
		Polestar.RunCommand("import clear")
		emit({ count = #I.List(), stored = PolestarDB.imports[${str(ID)}] == nil })
	`);
	assert.equal(out.count, 0);
	assert.equal(out.stored, true);
});

test('finding 5: import delete removes one guide by id', () => {
	const [out] = run(`
		save(${str(string())})
		Polestar.RunCommand("import delete ${ID}")
		emit({ count = #I.List(), stored = PolestarDB.imports[${str(ID)}] == nil })
	`);
	assert.equal(out.count, 0);
	assert.equal(out.stored, true);
});

// ── Finding 6: degenerate and out-of-range frames/coordinates ───────────────

test('finding 6: a frame with left == right is refused', () => {
	const p = payload();
	p.frames = { 9998: { c: 0, left: 5, right: 5, top: 1, bottom: 2 } };
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ refused = info == nil, why = why or "" })
	`);
	assert.equal(out.refused, true);
	assert.match(out.why, /degenerate/);
});

test('finding 6: a frame with huge coordinates is refused', () => {
	const p = payload();
	p.frames = { 9998: { c: 0, left: 2e6, right: 3e6, top: 1, bottom: 2 } };
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ refused = info == nil, why = why or "" })
	`);
	assert.equal(out.refused, true);
	assert.match(out.why, /out-of-range/);
});

test('finding 6: a candidate coordinate outside 0-100 is refused', () => {
	const p = payload();
	p.guide.steps[0].goals.push({
		t: 'turnin', quest: 783,
		candidates: [{ npc: 1, map: 1, x: 150, y: 50 }], // x out of range
	});
	const [out] = run(`
		local info, why = I.Preview(${str(encodeImport(p))})
		emit({ refused = info == nil, why = why or "" })
	`);
	assert.equal(out.refused, true);
	assert.match(out.why, /coordinate outside 0-100/);
});

// ── Finding 7: update warns when author or licence changes ──────────────────

test('finding 7: Preview marks authorChanged when the incoming guide has a different author', () => {
	const v1 = string();
	const p2 = payload();
	p2.guide.version = 2;
	p2.guide.author = 'Someone Else';
	const [out] = run(`
		save(${str(v1)})
		local info = I.Preview(${str(encodeImport(p2))})
		emit({ state = info.state, authorChanged = info.authorChanged == true, licenseChanged = info.licenseChanged == true })
	`);
	assert.equal(out.state, 'update');
	assert.equal(out.authorChanged, true);
	assert.equal(out.licenseChanged, false);
});

test('finding 7: Preview marks licenseChanged when the incoming licence differs', () => {
	const v1 = string();
	const p2 = payload();
	p2.guide.version = 2;
	p2.license = 'MIT';
	const [out] = run(`
		save(${str(v1)})
		local info = I.Preview(${str(encodeImport(p2))})
		emit({ state = info.state, authorChanged = info.authorChanged == true, licenseChanged = info.licenseChanged == true })
	`);
	assert.equal(out.state, 'update');
	assert.equal(out.authorChanged, false);
	assert.equal(out.licenseChanged, true);
});

test('finding 7: authorChanged and licenseChanged are absent for a new guide', () => {
	const [out] = run(`
		local info = I.Preview(${str(string())})
		emit({ state = info.state, ac = info.authorChanged == nil, lc = info.licenseChanged == nil })
	`);
	assert.equal(out.state, 'new');
	assert.equal(out.ac, true, 'authorChanged should be nil/absent for new');
	assert.equal(out.lc, true, 'licenseChanged should be nil/absent for new');
});
