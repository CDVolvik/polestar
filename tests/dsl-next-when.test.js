'use strict';
// `next <id> when <predicate>` (docs/GUIDE_FORMAT.md, "Conditional hand-offs"):
// the header line repeats, each line adding its guides in order; an option
// with `when` is offered only while its predicate holds at the hand-off. The
// parser (parse.js), the resolver's `nextChoices`/`nextWhen` (resolve.js),
// the checks on `next` (validate.js), the emitted table and import data
// (emit.js) and the pack format it needs (pack/format.js).
// Fixture data: tests/fixtures/dsl/data (Elwynn Forest, uiMapID 1429).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseGuide } = require('../tools/lib/dsl/parse');
const { Diagnostics } = require('../tools/lib/dsl/diag');
const { emitGuides, guideData } = require('../tools/lib/dsl/emit');
const { formatFor, FORMAT, WHEN_FORMAT } = require('../tools/lib/pack/format');
const { compile, lineOf, plain } = require('./helpers/dsl');

function parse(text) {
	const diag = new Diagnostics();
	const ast = parseGuide(text, 'x.guide', diag);
	return { ast, errors: diag.sorted().filter((d) => d.severity === 'error').map((d) => `${d.line}: ${d.message}`) };
}

// A guide `t/<id>` for Alliance, levels 1-10, with `head` lines after its header.
function guide(id, head = [], body = ['step One', '  accept 783', 'step Two', '  turnin 783']) {
	return [`guide t/${id}`, `title ${id}`, 'faction Alliance', 'levels 1-10', 'zone Elwynn Forest', ...head, '', ...body].join('\n') + '\n';
}

// The main guide with `head`, and guides b, c, d to go on to (each with a pitch).
function chain(head) {
	const other = (id) => guide(id, [`pitch Level in ${id}.`], ['step One', '  accept 7', 'step Two', '  turnin 7']);
	return { 'main.guide': guide('main', head), 'b.guide': other('b'), 'c.guide': other('c'), 'd.guide': other('d') };
}

test('`next` repeats: each line adds its guides in order, `next <id> when ...` with its predicate and line', () => {
	const text = guide('main', ['next t/b when level>=5', 'next t/c', 'next t/d, t/e when onquest 783', 'next t/f when !has 159 x2'], ['step One', '  accept 783']);
	const { ast, errors } = parse(text);
	// `when` on a line naming two guides is an error; the other lines stand.
	assert.deepEqual(errors, [`${lineOf(text, 'next t/d, t/e when onquest 783')}: \`next ... when\` names one guide: \`next <id> when <predicate>\`, one line per guide`]);
	assert.deepEqual(ast.header.next, ['t/b', 't/c', 't/f']);
	assert.deepEqual(ast.header.nextWhen, {
		't/b': { k: 'level', op: '>=', n: 5, line: lineOf(text, 'next t/b when level>=5') },
		't/f': { k: 'has', neg: true, item: 159, n: 2, line: lineOf(text, 'next t/f when !has 159 x2') },
	});
	assert.equal(ast.lines.next, lineOf(text, 'next t/b when level>=5'));
	assert.deepEqual(ast.lines.nextOf, { 't/b': lineOf(text, 'next t/b when level>=5'), 't/c': lineOf(text, 'next t/c'), 't/f': lineOf(text, 'next t/f when !has 159 x2') });
});

test('a malformed conditional `next` is an error at its line', () => {
	const bad = {
		'next t/b when': '`when` needs a predicate',
		'next t/b when money<1': 'unknown `when` predicate "money<1"',
		'next t/b when level<70': 'level 70 is out of range (1-60)',
		'next "t/b" when level<5': 'malformed guide id ""t/b"" in `next`',
		'next T/B when level<5': 'malformed guide id "T/B" in `next`',
	};
	for (const [line, message] of Object.entries(bad)) {
		const text = guide('main', [line], ['step One', '  accept 783']);
		const { errors } = parse(text);
		assert.deepEqual(errors, [`${lineOf(text, line)}: ${message}`], line);
	}
	// One condition per guide: naming it again, with or without `when`, is an error.
	for (const again of ['next t/b', 'next t/b when level<3', 'next t/c, t/b']) {
		const text = guide('main', ['next t/b when level>=5', again], ['step One', '  accept 783']);
		const { ast, errors } = parse(text);
		assert.deepEqual(errors, [`${lineOf(text, again)}: \`next\` names the same guide twice`], again);
		assert.deepEqual(ast.header.next, ['t/b'], again);
	}
});

test('the comma form and several plain `next` lines compile alike, with no `nextWhen`', () => {
	const one = compile(chain(['next t/b, t/c']));
	const two = compile(chain(['next t/b', 'next t/c']));
	assert.deepEqual(one.errors, [], one.text);
	assert.deepEqual(two.errors, [], two.text);
	const main = (r) => plain(r.guides.find((g) => g.id === 't/main'));
	assert.deepEqual(main(two), main(one));
	assert.equal(main(one).next, 't/b');
	assert.deepEqual(main(one).nextChoices, ['t/b', 't/c']);
	assert.equal(main(one).nextWhen, undefined);
	// A single plain `next` stays a plain hand-off.
	const single = main(compile(chain(['next t/b'])));
	assert.equal(single.next, 't/b');
	assert.equal(single.nextChoices, undefined);
});

test('the resolver keeps each option\'s predicate for the engine, and lists the options even when there is one', () => {
	const r = compile(chain(['next t/b when zone "Elwynn Forest"', 'next t/c when available 7', 'next t/d']));
	assert.deepEqual(r.errors, [], r.text);
	const main = plain(r.guides.find((g) => g.id === 't/main'));
	assert.equal(main.next, 't/b');
	assert.deepEqual(main.nextChoices, ['t/b', 't/c', 't/d']);
	assert.deepEqual(main.nextWhen, {
		't/b': [{ k: 'zone', name: 'Elwynn Forest', area: 12 }],
		't/c': [{ k: 'available', q: 7, minLevel: 1, pre: [783] }],
	});
	const lone = plain(compile(chain(['next t/b when level<8'])).guides.find((g) => g.id === 't/main'));
	assert.equal(lone.next, 't/b');
	assert.deepEqual(lone.nextChoices, ['t/b']);
	assert.deepEqual(lone.nextWhen, { 't/b': [{ k: 'level', op: '<', n: 8 }] });
});

test('the checks on `next` point at the line naming the guide; one option is no route choice', () => {
	const sources = chain(['next t/b when level<8', 'next t/zz when level>=8']);
	const r = compile(sources);
	const text = sources['main.guide'];
	assert.deepEqual(r.errors, [`main.guide:${lineOf(text, 'next t/zz when level>=8')}: \`next\` points to unknown guide "t/zz"`]);
	// The predicate's own warnings come at its line too.
	const unknown = chain(['next t/b when onquest 424242']);
	const warned = compile(unknown).warnings;
	assert.ok(warned.includes(`main.guide:${lineOf(unknown['main.guide'], 'next t/b when onquest 424242')}: quest 424242 is not in data (new Forever content?)`), warned.join('\n'));
	// A pitch is asked of a route choice's options only when there are two or more.
	const pitchless = (head) => {
		const s = chain(head);
		s['b.guide'] = guide('b', [], ['step One', '  accept 7', 'step Two', '  turnin 7']);
		return compile(s).warnings.filter((w) => w.includes('has no `pitch`'));
	};
	assert.deepEqual(pitchless(['next t/b when level<8']), []);
	assert.equal(pitchless(['next t/b when level<8', 'next t/c']).length, 1);
});

test('the emitted guide carries `nextWhen` after `nextChoices`, in the options\' order and the predicates\' key order', () => {
	const r = compile(chain(['next t/c', 'next t/b when !onquest 783,7', 'next t/d when level>=5']));
	assert.deepEqual(r.errors, [], r.text);
	const main = r.guides.find((g) => g.id === 't/main');
	const lua = emitGuides([{ guide: main, source: null }]);
	assert.match(lua, /\n\t\t\tnextChoices = \{ "t\/c", "t\/b", "t\/d" \},\n\t\t\tnextWhen = \{ \["t\/b"\] = \{ \{ k = "onquest", neg = true, q = \{ 783, 7 \} \} \}, \["t\/d"\] = \{ \{ k = "level", op = ">=", n = 5 \} \} \},\n\t\t\tauthor = /);
	// An import string carries the same (Core/Import.lua reads it).
	assert.deepEqual(guideData(main).nextWhen, { 't/b': [{ k: 'onquest', neg: true, q: [783, 7] }], 't/d': [{ k: 'level', op: '>=', n: 5 }] });
});

test('a pack is written in format 4 when a `next` option has `when`', () => {
	const plainNext = compile(chain(['next t/b, t/c']));
	assert.equal(formatFor(plainNext.guides), FORMAT);
	const conditional = compile(chain(['next t/b when level<8', 'next t/c']));
	assert.equal(formatFor(conditional.guides), WHEN_FORMAT);
});
