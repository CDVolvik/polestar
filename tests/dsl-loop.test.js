'use strict';
// `loop` steps (docs/GUIDE_FORMAT.md, "Spawn areas"): in a step with a `loop`
// line, the `goto` points (in order) are the places to search. Each kill,
// collect or interact goal of the step without its own `@x,y` gets them as
// its spawn areas (`spots`, searched one after another: `spread`), its point
// at the first; the gotos leave the step. The runtime keys are ones every
// Polestar reads, so a loop changes no pack format.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compile, guideText, plain } = require('./helpers/dsl');
const { runAddon } = require('./helpers/lua');
const { luaValue } = require('../tools/lib/playtest');
const { formatFor, FORMAT } = require('../tools/lib/pack/format');

const LOOP = [
	'step Kobold circuit',
	'  loop',
	'  goto 47.6,35.1 "North camp"',
	'  goto 49.0,32.4 r 20',
	'  goto 52.3,26.8',
	'  kill 6 x10 quest 7.1',
	'  collect 750 x2',
	'  interact 1617',
	'  note Pull one at a time.',
];
const SPOTS = [
	{ x: 47.6, y: 35.1, r: 30 },
	{ x: 49, y: 32.4, r: 20 },
	{ x: 52.3, y: 26.8, r: 30 },
];

const compiled = (lines) => compile(guideText(['step Accept', '  accept 7', ...lines, 'step Hand in', '  turnin 7']));
const errors = (lines) => compiled(lines).errors.join('\n');

test('a loop step turns its gotos into the spawn areas of its kill, collect and interact goals', () => {
	const r = compiled(LOOP);
	assert.deepEqual(r.errors, [], r.text);
	const goals = plain(r.guides[0].steps[1].goals);
	assert.deepEqual(goals.map((g) => g.t), ['kill', 'collect', 'interact', 'note'], 'the gotos are gone');
	for (const g of goals.slice(0, 3)) {
		assert.deepEqual([g.map, g.x, g.y, g.f], [1429, 47.6, 35.1, 'e'], `${g.t}: placed at the first point, in its frame`);
		assert.deepEqual(g.spots, SPOTS, `${g.t}: every point, in order, its goto's r or 30 yd`);
		assert.equal(g.spread, true, `${g.t}: searched one after another`);
	}
	assert.equal(goals[0].quest, 7);
	assert.equal(goals[0].count, 10);
	assert.equal(r.guides[0].steps[1].loop, undefined, 'loop is a compile-time line');
	assert.equal(formatFor(r.guides), FORMAT, 'no pack format change');
});

test('a goal placed with @x,y keeps its point and its own spawn areas', () => {
	const r = compiled(['step Loop', '  loop', '  goto 47.6,35.1', '  goto 52.3,26.8', '  kill 6 x10 quest 7.1', '  collect 750 x2 @40,60']);
	assert.deepEqual(r.errors, [], r.text);
	const own = plain(compiled(['step Own', '  collect 750 x2 @40,60']).guides[0].steps[1].goals[0]);
	const [kill, collect] = plain(r.guides[0].steps[1].goals);
	assert.equal(kill.spots.length, 2);
	assert.deepEqual(collect, own);
});

test('a loop target the data has no spawns for is placed by the loop, without the no-coordinates warning', () => {
	const has = (r) => r.warnings.some((w) => /`kill` has no coordinates/.test(w));
	assert.ok(has(compiled(['step Ghost', '  kill "Wandering Ghost"'])), 'the warning without a loop');
	const r = compiled(['step Ghost', '  loop', '  goto 47.6,35.1', '  goto 52.3,26.8', '  kill "Wandering Ghost"']);
	assert.deepEqual(r.errors, [], r.text);
	assert.ok(!has(r), r.text);
	const [ghost] = plain(r.guides[0].steps[1].goals);
	assert.deepEqual([ghost.map, ghost.x, ghost.y, ghost.spots.length, ghost.spread], [1429, 47.6, 35.1, 2, true]);
});

test('a loop needs two points on one map and frame, a goal to search them, and nothing else on its line', () => {
	assert.match(errors(['step L', '  loop', '  goto 47.6,35.1', '  kill 6']), /`loop` needs at least two `goto` points/);
	assert.match(errors(['step L', '  loop', '  goto 47.6,35.1', '  goto 52.3,26.8', '  talk 197']), /`loop` needs a kill, collect or interact goal without its own `@x,y`/);
	assert.match(errors(['step L', '  loop', '  goto 47.6,35.1', '  goto 52.3,26.8', '  kill 6 @50,30']), /`loop` needs a kill, collect or interact goal/);
	assert.match(errors(['step L', '  loop', '  loop', '  goto 47.6,35.1', '  goto 52.3,26.8', '  kill 6']), /duplicate `loop` in step/);
	assert.match(errors(['step L', '  loop now', '  goto 47.6,35.1', '  goto 52.3,26.8', '  kill 6']), /`loop` takes nothing/);
	assert.match(errors(['step L', '  loop', '  goto 47.6,35.1', '  goto 50,50 map 1411', '  kill 6']), /`loop` points must all be on one map/);
	assert.match(errors(['step L', '  loop', '  goto 47.6,35.1', '  goto 50,50 live', '  kill 6']), /`loop` points must all be in one map frame/);
	assert.match(errors(['step L', '  loop', '  goto 47.6,35.1', '  goto 50,50 optional', '  kill 6']), /a `loop` point cannot be `optional` or have `only`/);
});

test('without `loop` the gotos stay a path to walk', () => {
	const r = compiled(LOOP.filter((l) => l !== '  loop'));
	const goals = plain(r.guides[0].steps[1].goals);
	assert.deepEqual(goals.map((g) => g.t), ['goto', 'goto', 'goto', 'kill', 'collect', 'interact', 'note']);
	assert.notDeepEqual(goals[3].spots, SPOTS);
});

test('the addon accepts a compiled loop step (Guides.Validate)', () => {
	const r = compiled(LOOP);
	assert.deepEqual(r.errors, [], r.text);
	const guide = plain(r.guides[0]);
	const [out] = runAddon({
		stubs: ['stub_world.lua'],
		before: 'stub.world.addMap(1429, { name = "Elwynn Forest", c = 0, left = 1500, right = -1500, top = 500, bottom = -1500 })',
		addons: [{ name: 'Polestar', files: ['Core/Core.xml'] }],
		script: `emit({ err = Polestar.Guides.Validate(${luaValue(guide)}) or false })`,
	}).emitted;
	assert.deepEqual(out, { err: false });
});
