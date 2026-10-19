'use strict';
// A point inside a level: `level 12.5` (halfway through 12) and `level
// 12+2500` (2500 XP into it), as a goal and in `when level` (docs/GUIDE_FORMAT.md):
// the parser's values and errors (tools/lib/game/xp.js levelPoint, parse.js,
// when.js), the compiled and emitted `frac`, always strictly inside (0, 1),
// the pack format it needs (pack/format.js), and the planner's goal line and
// playback (planner/goalfmt.js, planner/timeline.js via levelReached).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseGuide } = require('../tools/lib/dsl/parse');
const { Diagnostics } = require('../tools/lib/dsl/diag');
const { emitGuides } = require('../tools/lib/dsl/emit');
const { formatFor, FORMAT, WHEN_FORMAT } = require('../tools/lib/pack/format');
const { levelPoint, levelReached, LEVEL_XP } = require('../tools/lib/game/xp');
const { goalFields, formatGoal } = require('../tools/lib/planner/goalfmt');
const { compile, guideText, lineOf, plain } = require('./helpers/dsl');

const goalOf = (line) => {
	const diag = new Diagnostics();
	const ast = parseGuide(guideText(['step S', `  ${line}`]), 'x.guide', diag);
	return { goal: ast.steps[0].goals[0], errors: diag.sorted().filter((d) => d.severity === 'error').map((d) => d.message) };
};
const levelGoal = (line) => {
	const { goal, errors } = goalOf(line);
	assert.deepEqual(errors, [], line);
	const { line: _l, zone: _z, verb: _v, ...rest } = goal;
	return rest;
};
const errorOf = (line) => goalOf(line).errors.join('\n');

test('level N.fraction and N+XP parse to level and frac; N.0 and N+0 are plain level N', () => {
	assert.deepEqual(levelGoal('level 12'), { level: 12 });
	assert.deepEqual(levelGoal('level 12.5'), { level: 12, frac: 0.5 });
	assert.deepEqual(levelGoal('level 12.05'), { level: 12, frac: 0.05 });
	assert.deepEqual(levelGoal('level 12.333'), { level: 12, frac: 0.33 });
	assert.deepEqual(levelGoal('level 12.0'), { level: 12 });
	assert.deepEqual(levelGoal('level 12+0'), { level: 12 });
	// 2500 of level 12's 10100 XP: 24.8%, the XP kept as written for the planner.
	assert.equal(LEVEL_XP[12], 10100);
	assert.deepEqual(levelGoal('level 12+2500'), { level: 12, frac: 0.25, levelXp: 2500 });
	assert.deepEqual(levelGoal('level 12+5050'), { level: 12, frac: 0.5, levelXp: 5050 });
});

test('a point that rounds to the start or end of the level, XP past it, or a level outside 1-59 is an error', () => {
	// These two compiled to frac = 0 and frac = 1, which the addon refuses ("bad frac").
	assert.match(errorOf('level 12.004'), /level 12\.004 is less than 1% into level 12: write 12/);
	assert.match(errorOf('level 12.999'), /level 12\.999 rounds to the end of level 12: write 13/);
	assert.match(errorOf('level 12.995'), /rounds to the end of level 12/);
	assert.deepEqual(levelGoal('level 12.994'), { level: 12, frac: 0.99 });
	assert.deepEqual(levelGoal('level 12.005'), { level: 12, frac: 0.01 });
	assert.match(errorOf('level 12+50'), /less than 1% into level 12/);
	assert.match(errorOf('level 12+10099'), /rounds to the end of level 12: write 13/);
	assert.match(errorOf('level 12+10100'), /level 12\+10100: more XP than level 12 needs \(10100\)/);
	assert.match(errorOf('level 60.5'), /a point inside a level needs a level from 1 to 59/);
	assert.match(errorOf('level 0.5'), /a point inside a level needs a level from 1 to 59/);
	assert.match(errorOf('level 12.5x'), /malformed level "12\.5x"/);
	assert.match(errorOf('level 12+'), /malformed level "12\+"/);
	assert.match(errorOf('level 0'), /malformed level "0"/);
	assert.match(errorOf('level "12.5"'), /malformed level "12\.5"/);
});

test('every frac the parser accepts is emitted strictly inside (0, 1)', () => {
	for (let d = 0; d < 1000; d++) {
		const p = levelPoint(`12.${String(d).padStart(3, '0')}`);
		if (p.error || p.frac === undefined) continue;
		assert.ok(p.frac > 0 && p.frac < 1, `12.${d}`);
		assert.equal(Number(p.frac.toFixed(2)), p.frac, `12.${d}: two decimals`);
	}
	for (let xp = 1; xp < LEVEL_XP[1]; xp++) {
		const p = levelPoint(`1+${xp}`);
		if (!p.error) assert.ok(p.frac > 0 && p.frac < 1, `1+${xp}`);
	}
});

test('the compiled and emitted goal carries frac; the pack needs format 4 only then', () => {
	const r = compile(guideText(['step Half', '  level 3.5', 'step XP', '  level 4+700', 'step Plain', '  level 5']));
	assert.deepEqual(r.errors, [], r.text);
	const goals = plain(r.guides[0].steps.map((s) => s.goals[0]));
	assert.deepEqual(goals, [{ t: 'level', level: 3, frac: 0.5 }, { t: 'level', level: 4, frac: 0.33 }, { t: 'level', level: 5 }]);
	const lua = emitGuides([{ guide: r.guides[0], source: null }]);
	assert.match(lua, /\{ t = "level", level = 3, frac = 0\.5 \}/);
	assert.match(lua, /\{ t = "level", level = 4, frac = 0\.33 \}/);
	assert.match(lua, /\{ t = "level", level = 5 \}/);
	assert.equal(formatFor(r.guides), WHEN_FORMAT);
	const flat = compile(guideText(['step Plain', '  level 5', 'step Zero', '  level 6.0']));
	assert.deepEqual(flat.errors, [], flat.text);
	assert.equal(formatFor(flat.guides), FORMAT);
});

test('`when level` takes a point inside a level too, with the same errors', () => {
	const text = guideText(['step S', '  when level>=12.5', '  when level < 12+2500', '  when level<=3', '  accept 7']);
	const diag = new Diagnostics();
	const ast = parseGuide(text, 'x.guide', diag);
	assert.deepEqual(diag.sorted().filter((d) => d.severity === 'error'), []);
	assert.deepEqual(ast.steps[0].when, [
		{ k: 'level', op: '>=', n: 12, frac: 0.5, line: lineOf(text, 'when level>=12.5') },
		{ k: 'level', op: '<', n: 12, frac: 0.25, line: lineOf(text, 'when level < 12+2500') },
		{ k: 'level', op: '<=', n: 3, line: lineOf(text, 'when level<=3') },
	]);
	const err = (when) => {
		const d = new Diagnostics();
		parseGuide(guideText(['step S', `  when ${when}`, '  accept 7']), 'x.guide', d);
		return d.sorted().filter((x) => x.severity === 'error').map((x) => x.message).join('\n');
	};
	assert.match(err('level>=12.999'), /rounds to the end of level 12/);
	assert.match(err('level>=12.004'), /less than 1% into level 12/);
	assert.match(err('level<12+99999'), /more XP than level 12 needs/);
	assert.match(err('level>=60.5'), /needs a level from 1 to 59/);
	assert.match(err('level>70'), /level 70 is out of range \(1-60\)/);
	const r = compile(guideText(['step S', '  when level>=2.5', '  accept 7']));
	assert.deepEqual(r.errors, [], r.text);
	assert.deepEqual(plain(r.guides[0].steps[0].when), [{ k: 'level', op: '>=', n: 2, frac: 0.5 }]);
	assert.match(emitGuides([{ guide: r.guides[0], source: null }]), /when = \{ \{ k = "level", op = ">=", n = 2, frac = 0\.5 \} \}/);
});

test('a `when level` with frac splits its level: no "never holds" warning at the guide\'s edge', () => {
	// The guide is for levels 1-10.
	const never = (when) => {
		const r = compile(guideText(['step S', `  when ${when}`, '  accept 7']));
		assert.deepEqual(r.errors, [], when);
		return r.warnings.filter((w) => w.includes('never holds'));
	};
	assert.equal(never('level>10').length, 1);
	assert.deepEqual(never('level>10.5'), []);
	assert.deepEqual(never('level>=10.5'), []);
	assert.equal(never('level<1').length, 1);
	assert.deepEqual(never('level<1.5'), []);
});

test('the planner writes the goal line back as written and plays it to the XP', () => {
	const line = (text) => formatGoal(goalFields(goalOf(text).goal));
	assert.equal(line('level 12.5'), 'level 12.5');
	assert.equal(line('level 12.05'), 'level 12.05');
	assert.equal(line('level 12+2500'), 'level 12+2500');
	assert.equal(line('level 12'), 'level 12');
	assert.throws(() => formatGoal({ verb: 'level', level: 12, frac: 1.5 }), /between 0 and 1/);
	// Done past the level, or at it with the share of its XP.
	assert.equal(levelReached({ level: 12, xp: 5049 }, 12, 0.5), false);
	assert.equal(levelReached({ level: 12, xp: 5050 }, 12, 0.5), true);
	assert.equal(levelReached({ level: 13, xp: 0 }, 12, 0.5), true);
	assert.equal(levelReached({ level: 11, xp: 8000 }, 12, 0.5), false);
	assert.equal(levelReached({ level: 12, xp: 0 }, 12), true);
});
