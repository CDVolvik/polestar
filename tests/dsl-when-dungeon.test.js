'use strict';
// `when dungeon "<Name>"` on a step (docs/GUIDE_FORMAT.md, "Conditions
// checked during play"): the step is for characters who chose to run that
// dungeon (Options, Discovery, Dungeons). The parser's predicate and errors
// (tools/lib/dsl/when.js), the resolver's map id from the instance tables
// "Group content" reads (group.js dungeonNamed) and its warnings, the emitted
// table and the pack format.
// Fixture data: tests/fixtures/dsl/data, plus instance tables made here.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseGuide } = require('../tools/lib/dsl/parse');
const { Diagnostics } = require('../tools/lib/dsl/diag');
const { Data } = require('../tools/lib/dsl/data');
const { emitGuides } = require('../tools/lib/dsl/emit');
const { formatFor, MONEY_TASK_FORMAT } = require('../tools/lib/pack/format');
const { compile, fixtureData, guideText, lineOf, plain } = require('./helpers/dsl');

function parse(text) {
	const diag = new Diagnostics();
	const ast = parseGuide(text, 'x.guide', diag);
	return { ast, errors: diag.sorted().filter((d) => d.severity === 'error').map((d) => `${d.line}: ${d.message}`) };
}

// The fixture data with the client's instance tables (solo.js loadInstances)
// and AreaTable names (data/areas.js loadAreas): Ragefire Chasm and the
// Deadmines (Map.csv names it "Deadmines"; its area is "The Deadmines") are
// dungeons, Molten Core a raid. Area ids 7101-7103 are made up for the test.
function dungeonData() {
	const base = fixtureData();
	const instances = {
		areas: {
			7101: { kind: 'dungeon', name: 'Ragefire Chasm', map: 389 },
			7102: { kind: 'dungeon', name: 'Deadmines', map: 36 },
			7103: { kind: 'raid', name: 'Molten Core', map: 409 },
		},
		maps: {},
	};
	const area = (id, name, c) => ({ id, name, c, parent: 0 });
	const list = [area(7101, 'Ragefire Chasm', 389), area(7102, 'The Deadmines', 36), area(7103, 'Molten Core', 409)];
	const areas = { build: 'test', byId: new Map(list.map((a) => [a.id, a])), byName: new Map(list.map((a) => [a.name.toLowerCase(), [a]])) };
	return new Data({ quests: base.quests, npcs: base.npcs, objects: base.objects, items: base.items, zones: base.zones, 'map-frames': base.mapFrames, meta: base.meta, instances, areas }, { dir: base.dir });
}

test('`when dungeon` and `when !dungeon` parse with the name quoted or bare', () => {
	const text = guideText(['step With', '  when dungeon "Ragefire Chasm"', '  accept 783', 'step Without', '  when !dungeon The Deadmines', '  accept 7']);
	const { ast, errors } = parse(text);
	assert.deepEqual(errors, []);
	assert.deepEqual(ast.steps[0].when, [{ k: 'dungeon', name: 'Ragefire Chasm', line: lineOf(text, 'when dungeon "Ragefire Chasm"') }]);
	assert.deepEqual(ast.steps[1].when, [{ k: 'dungeon', neg: true, name: 'The Deadmines', line: lineOf(text, 'when !dungeon The Deadmines') }]);
});

test('`when dungeon` without a name is an error at its line', () => {
	for (const line of ['  when dungeon', '  when !dungeon']) {
		const text = guideText(['step One', line, '  accept 783']);
		const { ast, errors } = parse(text);
		assert.deepEqual(errors, [`${lineOf(text, line)}: \`dungeon\` needs a name: dungeon "<Name>"`], line);
		assert.equal(ast.steps[0].goals.length, 1);
	}
});

test('the resolver gives the dungeon its map id: by its Map.csv name or an area of that name on its map, case aside', () => {
	const r = compile(guideText([
		'step One',
		'  when dungeon "Ragefire Chasm"',
		'  accept 783',
		'step Two',
		'  when !dungeon "The Deadmines"',
		'  when dungeon deadmines',
		'  turnin 783',
	]), dungeonData());
	assert.deepEqual(r.errors, [], r.text);
	const steps = plain(r.guides[0].steps);
	assert.deepEqual(steps[0].when, [{ k: 'dungeon', name: 'Ragefire Chasm', map: 389 }]);
	assert.deepEqual(steps[1].when, [{ k: 'dungeon', neg: true, name: 'The Deadmines', map: 36 }, { k: 'dungeon', name: 'deadmines', map: 36 }]);
});

test('a name that is no dungeon (unknown, or a raid) warns and keeps the name; without the instance tables nothing warns', () => {
	const text = guideText(['step One', '  when dungeon "Ragefire Chasmm"', '  when !dungeon "Molten Core"', '  accept 783']);
	const message = (name) => `dungeon "${name}" is not a dungeon in the client's instance tables: no character can choose it, so \`when dungeon\` never holds and \`when !dungeon\` always does`;
	const r = compile(text, dungeonData());
	assert.deepEqual(r.errors, [], r.text);
	const at = (s) => `test.guide:${lineOf(text, s)}: `;
	assert.deepEqual(r.warnings.filter((w) => w.includes('instance tables')), [
		`${at('when dungeon "Ragefire Chasmm"')}${message('Ragefire Chasmm')}`,
		`${at('when !dungeon "Molten Core"')}${message('Molten Core')}`,
	]);
	assert.deepEqual(plain(r.guides[0].steps)[0].when, [{ k: 'dungeon', name: 'Ragefire Chasmm' }, { k: 'dungeon', neg: true, name: 'Molten Core' }]);

	// The fixture data has no sources folder: no instance tables, so no warning and no map id.
	const bare = compile(guideText(['step One', '  when dungeon "Ragefire Chasm"', '  accept 783']));
	assert.deepEqual(bare.warnings.filter((w) => w.includes('dungeon')), []);
	assert.deepEqual(plain(bare.guides[0].steps)[0].when, [{ k: 'dungeon', name: 'Ragefire Chasm' }]);
});

test('a step that asks for a dungeon and its `!` warns that no character sees it', () => {
	const text = guideText(['step One', '  when dungeon "Ragefire Chasm"', '  when !dungeon "Ragefire Chasm"', '  accept 783']);
	const r = compile(text, dungeonData());
	assert.ok(r.warnings.includes(`test.guide:${lineOf(text, 'when dungeon "Ragefire Chasm"')}: the step asks for \`dungeon\` and \`!dungeon\` of the same dungeon: no character sees it`), r.text);
});

test('the emitted predicate carries the map id after the name, and the pack is written in format 5', () => {
	const r = compile(guideText(['step One', '  when !dungeon "Ragefire Chasm"', '  accept 783']), dungeonData());
	assert.deepEqual(r.errors, [], r.text);
	const lua = emitGuides([{ guide: r.guides[0], source: null }]);
	assert.match(lua, /\n\t\t\t\t\twhen = \{ \{ k = "dungeon", neg = true, name = "Ragefire Chasm", map = 389 \} \},\n/);
	assert.equal(formatFor(r.guides), MONEY_TASK_FORMAT);
});

test('`next <id> when dungeon` resolves the same way', () => {
	const follower = ['guide t/rfc', 'title RFC', 'faction Horde', 'levels 10-20', 'zone Elwynn Forest', 'pitch With Ragefire Chasm.', '', 'step Start', '  note Go on.', ''].join('\n');
	const main = ['guide t/main', 'title Main', 'faction Horde', 'levels 1-10', 'zone Elwynn Forest', 'next t/rfc when dungeon "Ragefire Chasm"', '', 'step Start', '  note Go on.', ''].join('\n');
	const r = compile({ 'main.guide': main, 'rfc.guide': follower }, dungeonData());
	assert.deepEqual(r.errors, [], r.text);
	const g = r.guides.find((x) => x.id === 't/main');
	assert.deepEqual(plain(g.nextWhen), { 't/rfc': [{ k: 'dungeon', name: 'Ragefire Chasm', map: 389 }] });
	// On a `next` line too, `dungeon` needs format 5 (0.2.6 refuses an unknown `when` kind).
	assert.equal(formatFor(r.guides), MONEY_TASK_FORMAT);
});
