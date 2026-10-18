'use strict';
// `when` on a step (docs/GUIDE_FORMAT.md, "Conditions checked during play"):
// the parser's predicates and errors (tools/lib/dsl/when.js, parse.js), what
// the resolver fills in from the data and warns about (resolve.js), the
// emitted table and the pack format it needs (emit.js, pack/format.js).
// Fixture data: tests/fixtures/dsl/data (Elwynn Forest, uiMapID 1429).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { parseGuide } = require('../tools/lib/dsl/parse');
const { Diagnostics } = require('../tools/lib/dsl/diag');
const { emitGuides } = require('../tools/lib/dsl/emit');
const { formatFor, FORMAT, WHEN_FORMAT, NEEDS } = require('../tools/lib/pack/format');
const { readManifest } = require('../tools/lib/pack/manifest');
const { compileProject, buildPackFiles } = require('../tools/lib/dsl/project');
const { compile, guideText, lineOf, plain, DATA_DIR } = require('./helpers/dsl');

function parse(text) {
	const diag = new Diagnostics();
	const ast = parseGuide(text, 'x.guide', diag);
	return { ast, errors: diag.sorted().filter((d) => d.severity === 'error').map((d) => `${d.line}: ${d.message}`) };
}

test('every predicate parses, one per `when` line, each with its line; a step without `when` has none', () => {
	const text = guideText([
		'step Conditional',
		'  when level<6',
		'  when level >= 2',
		'  when onquest 783, 7',
		'  when !onquest 33',
		'  when complete 7',
		'  when !turnedin 783',
		'  when available 9200',
		'  when has 159 x5',
		'  when !has 750',
		'  when zone "Elwynn Forest"',
		'  when !subzone Goldshire',
		'  when bound "Goldshire"',
		'  turnin 783',
		'step Plain',
		'  accept 7',
	]);
	const { ast, errors } = parse(text);
	assert.deepEqual(errors, []);
	const line = (s) => lineOf(text, s);
	assert.deepEqual(ast.steps[0].when, [
		{ k: 'level', op: '<', n: 6, line: line('when level<6') },
		{ k: 'level', op: '>=', n: 2, line: line('when level >= 2') },
		{ k: 'onquest', q: [783, 7], line: line('when onquest 783, 7') },
		{ k: 'onquest', neg: true, q: [33], line: line('when !onquest 33') },
		{ k: 'complete', q: 7, line: line('when complete 7') },
		{ k: 'turnedin', neg: true, q: 783, line: line('when !turnedin 783') },
		{ k: 'available', q: 9200, line: line('when available 9200') },
		{ k: 'has', item: 159, n: 5, line: line('when has 159 x5') },
		{ k: 'has', neg: true, item: 750, n: 1, line: line('when !has 750') },
		{ k: 'zone', name: 'Elwynn Forest', line: line('when zone "Elwynn Forest"') },
		{ k: 'subzone', neg: true, name: 'Goldshire', line: line('when !subzone Goldshire') },
		{ k: 'bound', name: 'Goldshire', line: line('when bound "Goldshire"') },
	]);
	assert.equal(ast.steps[1].when, undefined);
});

test('a malformed `when` is an error at its line, and the step keeps its other lines', () => {
	const bad = {
		'  when': '`when` needs a predicate',
		'  when !level<5': '`level` takes no `!`: turn the comparison around (`level>=10` for "not below 10")',
		'  when level=5': 'malformed `level` predicate (expected level<N, level<=N, level>N or level>=N)',
		'  when level<70': 'level 70 is out of range (1-60)',
		'  when onquest': '`onquest` needs quest ids: onquest <quest>[,<quest>...]',
		'  when complete 7,8': '`complete` needs one quest id: complete <quest>',
		'  when has x5': '`has` needs an item id: has <item> [xN]',
		'  when has 159 x0': '`has` needs a count of 1 or more',
		'  when zone': '`zone` needs a name: zone "<Name>"',
		'  when money<1s': 'unknown `when` predicate "money<1s"',
	};
	for (const [line, message] of Object.entries(bad)) {
		const text = guideText(['step One', line, '  accept 783']);
		const { ast, errors } = parse(text);
		assert.deepEqual(errors, [`${lineOf(text, line)}: ${message}`], line);
		assert.equal(ast.steps[0].goals.length, 1);
	}
});

test('the resolver keeps the predicates for the engine: available with what an accept waits on, a zone with its area', () => {
	const r = compile(guideText([
		'step One',
		'  accept 783',
		'step Two',
		'  when onquest 783,7',
		'  when available 7',
		'  when !has 159 x2',
		'  when zone "Elwynn Forest"',
		'  when level<=5',
		'  turnin 783',
	]));
	assert.deepEqual(r.errors, [], r.text);
	const steps = plain(r.guides[0].steps);
	assert.equal(steps[0].when, undefined);
	assert.deepEqual(steps[1].when, [
		{ k: 'onquest', q: [783, 7] },
		{ k: 'available', q: 7, minLevel: 1, pre: [783] },
		{ k: 'has', neg: true, item: 159, n: 2 },
		{ k: 'zone', name: 'Elwynn Forest', area: 12 },
		{ k: 'level', op: '<=', n: 5 },
	]);
});

test('the resolver warns about ids the data lacks, a zone the game never names, and a step no character sees', () => {
	const text = guideText([
		'step One',
		'  when onquest 424242',
		'  when has 777777',
		'  when zone "Elwynnn Forest"',
		'  accept 783',
		'step Two',
		'  when level>=20',
		'  accept 7',
		'step Three',
		'  when onquest 7',
		'  when !onquest 7',
		'  accept 33',
	]);
	const r = compile(text);
	assert.deepEqual(r.errors, [], r.text);
	const at = (s) => `test.guide:${lineOf(text, s)}: `;
	// The accepts' own warnings (never turned in) are not this test's.
	const whenLines = text.split('\n').map((l, i) => (l.trim().startsWith('when ') ? `test.guide:${i + 1}: ` : null)).filter(Boolean);
	assert.deepEqual(r.warnings.filter((w) => whenLines.some((p) => w.startsWith(p))), [
		`${at('when onquest 424242')}quest 424242 is not in data (new Forever content?)`,
		`${at('when has 777777')}item 777777 is not in data (new Forever content?)`,
		`${at('when zone "Elwynnn Forest"')}zone "Elwynnn Forest" is not in zones.json: the game never reports that zone name, so the predicate never holds there`,
		`${at('when level>=20')}the step's \`when level\` never holds for this guide's levels (1-10): no character sees the step`,
		`${at('when onquest 7')}the step asks for \`onquest\` and \`!onquest\` of the same quest: no character sees it`,
	]);
});

test('the emitted step carries `when` before its goals, in a fixed key order', () => {
	const r = compile(guideText(['step Two', '  when !onquest 783,7', '  when has 159 x2', '  when level<6', '  accept 783']));
	assert.deepEqual(r.errors, [], r.text);
	const lua = emitGuides([{ guide: r.guides[0], source: null }]);
	assert.match(lua, /\n\t\t\t\t\twhen = \{ \{ k = "onquest", neg = true, q = \{ 783, 7 \} \}, \{ k = "has", n = 2, item = 159 \}, \{ k = "level", op = "<", n = 6 \} \},\n\t\t\t\t\tgoals = \{/);
});

test('a pack is written in format 4 only when a step of its guides has `when`', () => {
	const mini = path.join(__dirname, 'fixtures', 'packs', 'mini');
	const { manifest } = readManifest(mini);
	const { guides, data } = compileProject({ packDir: mini, manifest, dataDir: DATA_DIR });
	assert.equal(formatFor(guides), FORMAT);
	guides[0].steps[0].when = [{ k: 'level', op: '<', n: 6 }];
	assert.equal(formatFor(guides), WHEN_FORMAT);
	const files = buildPackFiles({ guides, manifest, data });
	assert.match(files[`${manifest.folder}.toc`], new RegExp(`^## X-Polestar-Format: ${WHEN_FORMAT}\n## X-Polestar-Needs: ${NEEDS[WHEN_FORMAT].replace(/\./g, '\\.')}$`, 'm'));
	assert.match(files['Pack.lua'], new RegExp(`format = ${WHEN_FORMAT},`));
});
