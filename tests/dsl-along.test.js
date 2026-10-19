'use strict';
// `label` and `along [until <label>]` step lines (docs/GUIDE_FORMAT.md, "Along
// the way"): parsed (parse.js), checked across the guide (resolve.js), emitted
// into Guides.lua (emit.js), and a pack using either is written in format 4
// (pack/format.js). Fixture data: tests/fixtures/dsl/data.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compile, guideText, lineOf, plain, fixtureData } = require('./helpers/dsl');
const { formatFor, FORMAT, WHEN_FORMAT, NEEDS } = require('../tools/lib/pack/format');
const { readManifest } = require('../tools/lib/pack/manifest');
const { buildPackFiles } = require('../tools/lib/dsl/project');
const path = require('node:path');

const MINI = path.join(__dirname, 'fixtures', 'packs', 'mini');

function stepsOf(lines) {
	const r = compile(guideText(lines));
	assert.deepEqual(r.errors, [], r.text);
	return plain(r.guides[0].steps);
}

const errorsOf = (lines) => compile(guideText(lines)).errors.join('\n');

test('`label` names a step; `along` marks one along the way, with or without `until`', () => {
	const steps = stepsOf([
		'step Kill kobolds on the way', '  along until back', '  kill 6 x5',
		'step Look for candles', '  along', '  collect 750 x2',
		'step Travel', '  goto 47.6,35.1',
		'step Hand in', '  label back', '  accept 783',
	]);
	assert.equal(steps[0].along, 'back');
	assert.equal(steps[1].along, true);
	assert.equal(steps[2].along, undefined);
	assert.equal(steps[3].label, 'back');
	assert.equal(steps[0].label, undefined);
});

test('labels take letters, digits, - and _ and keep their case; keywords are case-insensitive', () => {
	const steps = stepsOf(['step A', '  ALONG UNTIL Camp_2', '  kill 6', 'step B', '  Label Camp_2', '  accept 783']);
	assert.equal(steps[0].along, 'Camp_2');
	assert.equal(steps[1].label, 'Camp_2');
	assert.match(errorsOf(['step A', '  along until camp_2', '  kill 6', 'step B', '  label Camp_2', '  accept 783']), /unknown label "camp_2"/);
});

test('malformed and repeated lines are errors', () => {
	assert.match(errorsOf(['step A', '  label', '  accept 783']), /`label` needs a name/);
	assert.match(errorsOf(['step A', '  label two words', '  accept 783']), /`label` needs a name/);
	assert.match(errorsOf(['step A', '  label "camp"', '  accept 783']), /`label` needs a name/);
	assert.match(errorsOf(['step A', '  label a.b', '  accept 783']), /malformed label "a\.b"/);
	assert.match(errorsOf(['step A', '  label x', '  label y', '  accept 783']), /duplicate `label` in step/);
	assert.match(errorsOf(['step A', '  along', '  along', '  kill 6']), /duplicate `along` in step/);
	assert.match(errorsOf(['step A', '  along later', '  kill 6']), /`along` takes nothing or `until <label>`/);
	assert.match(errorsOf(['step A', '  along until', '  kill 6']), /`along` takes nothing or `until <label>`/);
	assert.match(errorsOf(['step A', '  along -- on the way', '  kill 6']), /notes .* only allowed on goal lines/);
});

test('labels are guide-wide: a duplicate, an unknown or an earlier `until` target is an error at its line', () => {
	const dup = guideText(['step A', '  label x', '  accept 783', 'step B', '  kill 6', '  label x']);
	const first = lineOf(dup, 'label x');
	const second = dup.split('\n').findIndex((l, i) => i + 1 > first && l.trim() === 'label x') + 1;
	assert.match(compile(dup).errors.join('\n'), new RegExp(`:${second}: duplicate label "x" \\(first at line ${first}\\)`));

	const unknown = guideText(['step A', '  along until nowhere', '  kill 6']);
	assert.match(compile(unknown).errors.join('\n'), new RegExp(`:${lineOf(unknown, 'along until nowhere')}: unknown label "nowhere"`));

	assert.match(errorsOf(['step A', '  label here', '  accept 783', 'step B', '  along until here', '  kill 6']), /`along until here` must name a later step/);
	assert.match(errorsOf(['step A', '  label here', '  along until here', '  kill 6']), /`along until here` must name a later step/);
});

test('a goal Polestar checks off only on the route\'s own step warns in an along step', () => {
	const text = guideText([
		'step McBride', '  accept 7', 'step On the way', '  along until back',
		'  kill 6 x10 quest 7.1', '  collect 750 x2', '  goto 47.6,35.1', '  talk 197', '  kill 6 x3',
		'step Back', '  label back', '  accept 783',
	]);
	const r = compile(text);
	assert.deepEqual(r.errors, []);
	const warned = r.warnings.filter((w) => /in an `along` step never checks off/.test(w));
	assert.deepEqual(warned.map((w) => Number(/:(\d+): /.exec(w)[1])), [lineOf(text, 'goto 47.6,35.1'), lineOf(text, 'talk 197'), lineOf(text, 'kill 6 x3')]);
	assert.match(warned[2], /`kill` without `quest`.*until the step labelled back/);
});

const HDR = ['guide mini/a', 'title A', 'faction Alliance', 'levels 1-10', 'zone Elwynn Forest', ''];

function pack(lines) {
	const { manifest } = readManifest(MINI);
	const data = fixtureData();
	const r = compile(guideText([...HDR, ...lines]), data, { pack: 'mini' });
	assert.deepEqual(r.errors, [], r.text);
	return { guides: r.guides, files: buildPackFiles({ guides: r.guides, manifest, data }) };
}

test('Guides.lua carries them in order: title, note, label, only, when, along, goals', () => {
	const { files } = pack(['step One', '  along until end', '  only Warrior', '  when level<5', '  tip Go', '  kill 6', 'step Two', '  label end', '  accept 783']);
	const lua = files['Guides.lua'];
	assert.match(lua, /title = "One",\n\t+note = "Go",\n\t+only = \{ classes = \{ "WARRIOR" \} \},\n\t+when = \{ \{ k = "level", op = "<", n = 5 \} \},\n\t+along = "end",\n\t+goals = \{/);
	assert.match(lua, /title = "Two",\n\t+label = "end",\n\t+goals = \{/);
	assert.match(pack(['step One', '  along', '  kill 6', 'step Two', '  accept 783']).files['Guides.lua'], /\n\t+along = true,\n/);
});

test('a pack using `label` or `along` is written in format 4; one without stays in format 3', () => {
	assert.equal(formatFor(pack(['step One', '  label a', '  accept 783']).guides), WHEN_FORMAT);
	assert.equal(formatFor(pack(['step One', '  along', '  kill 6', 'step Two', '  accept 783']).guides), WHEN_FORMAT);
	assert.equal(formatFor(pack(['step One', '  accept 783']).guides), FORMAT);
	const files = pack(['step One', '  along', '  kill 6', 'step Two', '  accept 783']).files;
	assert.match(files['Pack.lua'], /format = 4,/);
	assert.ok(Object.entries(files).find(([k]) => k.endsWith('.toc'))[1].includes(`## X-Polestar-Format: 4\n## X-Polestar-Needs: ${NEEDS[WHEN_FORMAT]}\n`));
});
