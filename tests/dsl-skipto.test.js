'use strict';
// `skipto <label> when <predicate>` step lines and the `done <label>`
// predicate (docs/GUIDE_FORMAT.md, "Jumps"): parsed (parse.js, when.js),
// checked against the guide's labels (resolve.js), emitted into Guides.lua
// (emit.js), and a pack using either is written in format 5
// (pack/format.js). Fixture data: tests/fixtures/dsl/data.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compile, guideText, lineOf, plain, fixtureData } = require('./helpers/dsl');
const { formatFor, WHEN_FORMAT, MONEY_TASK_FORMAT } = require('../tools/lib/pack/format');
const { readManifest } = require('../tools/lib/pack/manifest');
const { buildPackFiles } = require('../tools/lib/dsl/project');
const { parseWhen } = require('../tools/lib/dsl/when');
const path = require('node:path');

const MINI = path.join(__dirname, 'fixtures', 'packs', 'mini');

function stepsOf(lines) {
	const r = compile(guideText(lines));
	assert.deepEqual(r.errors, [], r.text);
	return plain(r.guides[0].steps);
}

const errorsOf = (lines) => compile(guideText(lines)).errors.join('\n');

test('`done <label>` is a `when` predicate, `!` turns it around', () => {
	assert.deepEqual(parseWhen('done camp').value, { k: 'done', label: 'camp' });
	assert.deepEqual(parseWhen('!done Camp_2').value, { k: 'done', neg: true, label: 'Camp_2' });
	for (const bad of ['done', 'done a.b', 'done "camp"', 'done two words']) assert.match(parseWhen(bad).error, /`done` needs a step label/, bad);
});

test('`skipto` lines collect on their step in order, each with its label and one predicate', () => {
	const steps = stepsOf([
		'step A', '  accept 783', '  skipto end when turnedin 783', '  SKIPTO mid WHEN has 750 x2',
		'step B', '  kill 6',
		'step C', '  label mid', '  accept 7',
		'step D', '  label end', '  kill 6',
	]);
	assert.deepEqual(steps[0].skipto, [
		{ to: 'end', when: { k: 'turnedin', q: 783 } },
		{ to: 'mid', when: { k: 'has', item: 750, n: 2 } },
	]);
	assert.equal(steps[1].skipto, undefined);
});

test('a `done` label may name any step of the guide, earlier or later', () => {
	const steps = stepsOf([
		'step A', '  label camp', '  accept 783',
		'step B', '  when done camp', '  turnin 783',
		'step C', '  when !done later', '  skipto later when done camp', '  kill 6',
		'step D', '  label later', '  accept 7',
	]);
	assert.deepEqual(steps[1].when, [{ k: 'done', label: 'camp' }]);
	assert.deepEqual(steps[2].when, [{ k: 'done', neg: true, label: 'later' }]);
	assert.deepEqual(steps[2].skipto, [{ to: 'later', when: { k: 'done', label: 'camp' } }]);
});

test('malformed `skipto` lines and unknown or earlier labels are errors at their line', () => {
	const usage = /`skipto` needs a label and a predicate: skipto <label> when <predicate>/;
	assert.match(errorsOf(['step A', '  skipto', '  accept 783']), usage);
	assert.match(errorsOf(['step A', '  skipto end', '  accept 783', 'step B', '  label end', '  kill 6']), usage);
	assert.match(errorsOf(['step A', '  skipto end if level>2', '  accept 783', 'step B', '  label end', '  kill 6']), usage);
	assert.match(errorsOf(['step A', '  skipto end when', '  accept 783', 'step B', '  label end', '  kill 6']), usage);
	assert.match(errorsOf(['step A', '  skipto "end" when level>2', '  accept 783', 'step B', '  label end', '  kill 6']), usage);
	assert.match(errorsOf(['step A', '  skipto a.b when level>2', '  accept 783']), /malformed label "a\.b"/);
	assert.match(errorsOf(['step A', '  skipto end when sometimes', '  accept 783', 'step B', '  label end', '  kill 6']), /`skipto`: unknown `when` predicate "sometimes"/);
	assert.match(errorsOf(['step A', '  skipto end when level>2 -- go', '  accept 783', 'step B', '  label end', '  kill 6']), /notes .* only allowed on goal lines/);

	const unknown = guideText(['step A', '  skipto nowhere when level>2', '  accept 783']);
	assert.match(compile(unknown).errors.join('\n'), new RegExp(`:${lineOf(unknown, 'skipto nowhere when level>2')}: unknown label "nowhere"`));
	assert.match(errorsOf(['step A', '  label here', '  accept 783', 'step B', '  skipto here when level>2', '  kill 6']), /`skipto here` must name a later step/);
	assert.match(errorsOf(['step A', '  label here', '  skipto here when level>2', '  kill 6']), /`skipto here` must name a later step/);

	const done = guideText(['step A', '  when done nowhere', '  accept 783']);
	assert.match(compile(done).errors.join('\n'), new RegExp(`:${lineOf(done, 'when done nowhere')}: unknown label "nowhere"`));
	assert.match(errorsOf(['step A', '  skipto b when done nowhere', '  accept 783', 'step B', '  label b', '  kill 6']), /unknown label "nowhere"/);
});

test('`done` cannot decide a `next` option: the options are listed from other guides too', () => {
	const text = ['guide t/one', 'title One', 'faction Alliance', 'levels 1-10', 'zone Elwynn Forest', 'next t/two when done camp', '', 'step A', '  label camp', '  accept 783'].join('\n');
	assert.match(compile(text).errors.join('\n'), /`done` checks a step of the guide being played: it cannot decide a `next` option/);
});

const HDR = ['guide mini/a', 'title A', 'faction Alliance', 'levels 1-10', 'zone Elwynn Forest', ''];

function pack(lines) {
	const { manifest } = readManifest(MINI);
	const data = fixtureData();
	const r = compile(guideText([...HDR, ...lines]), data, { pack: 'mini' });
	assert.deepEqual(r.errors, [], r.text);
	return { guides: r.guides, files: buildPackFiles({ guides: r.guides, manifest, data }) };
}

test('Guides.lua carries `skipto` after `along`, and `done` predicates with their label', () => {
	const lua = pack(['step One', '  when !done end', '  skipto end when turnedin 783', '  skipto end when done end', '  kill 6', 'step Two', '  label end', '  accept 783']).files['Guides.lua'];
	assert.match(lua, /when = \{ \{ k = "done", neg = true, label = "end" \} \},\n\t+skipto = \{ \{ to = "end", when = \{ k = "turnedin", q = 783 \} \}, \{ to = "end", when = \{ k = "done", label = "end" \} \} \},\n\t+goals = \{/);
});

test('a pack using `skipto` or `done` is written in format 5; a label alone stays in format 4', () => {
	assert.equal(formatFor(pack(['step One', '  skipto b when level>2', '  kill 6', 'step Two', '  label b', '  accept 783']).guides), MONEY_TASK_FORMAT);
	assert.equal(formatFor(pack(['step One', '  label b', '  accept 783', 'step Two', '  when done b', '  kill 6']).guides), MONEY_TASK_FORMAT);
	assert.equal(formatFor(pack(['step One', '  label b', '  accept 783']).guides), WHEN_FORMAT);
});
