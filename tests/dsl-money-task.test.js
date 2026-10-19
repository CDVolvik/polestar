'use strict';
// The `money` and `task` goals and the `when money` predicate
// (docs/GUIDE_FORMAT.md): parsing and errors (parse.js, when.js, money.js),
// what the resolver writes and warns about (resolve.js), the emitted goals
// and the pack format they need (emit.js, pack/format.js).
// Fixture data: tests/fixtures/dsl/data (Elwynn Forest, uiMapID 1429).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { parseGuide } = require('../tools/lib/dsl/parse');
const { parseWhen } = require('../tools/lib/dsl/when');
const { readMoney } = require('../tools/lib/dsl/money');
const { Diagnostics } = require('../tools/lib/dsl/diag');
const { emitGuides } = require('../tools/lib/dsl/emit');
const { formatFor, FORMAT, WHEN_FORMAT } = require('../tools/lib/pack/format');
const { readManifest } = require('../tools/lib/pack/manifest');
const { compileProject } = require('../tools/lib/dsl/project');
const { compile, guideText, lineOf, plain, DATA_DIR } = require('./helpers/dsl');

function parse(text) {
	const diag = new Diagnostics();
	const ast = parseGuide(text, 'x.guide', diag);
	return { ast, errors: diag.sorted().filter((d) => d.severity === 'error').map((d) => `${d.line}: ${d.message}`) };
}

test('amounts read as copper: 1g50s, 7s, 25c, a plain number', () => {
	assert.deepEqual(['1g50s', '7s', '25c', '350', '2g', '1s5c', 'x', '', '1.5g'].map(readMoney), [15000, 700, 25, 350, 20000, 105, null, null, null]);
});

test('`when money` compares the character\'s money; it takes no `!`', () => {
	assert.deepEqual(parseWhen('money>=1s').value, { k: 'money', op: '>=', n: 100 });
	assert.deepEqual(parseWhen('money < 1g50s').value, { k: 'money', op: '<', n: 15000 });
	assert.match(parseWhen('!money<1s').error, /takes no `!`/);
	assert.match(parseWhen('money<lots').error, /malformed amount "lots"/);
	assert.match(parseWhen('money=1s').error, /malformed `money` predicate/);
});

test('`money <amount>` and `task "<text>"` parse into goals; a task can have a place and be optional', () => {
	const text = guideText([
		'step One',
		'  money 1s50c',
		'  task "Logout skip on the ledge" @45,60 optional',
		'  task Kill Gru\'ark when he becomes hostile',
		'  accept 783',
	]);
	const { ast, errors } = parse(text);
	assert.deepEqual(errors, []);
	const [money, ledge, bare] = ast.steps[0].goals;
	assert.deepEqual([money.verb, money.money], ['money', 150]);
	assert.deepEqual([ledge.verb, ledge.text, ledge.x, ledge.y, ledge.optional], ['task', 'Logout skip on the ledge', 45, 60, true]);
	assert.deepEqual([bare.verb, bare.text], ['task', 'Kill Gru\'ark when he becomes hostile']);
});

test('a malformed money or task goal is an error at its line', () => {
	const bad = {
		'  money': 'malformed amount "" (expected copper or 1g50s / 7s / 25c)',
		'  money lots': 'malformed amount "lots" (expected copper or 1g50s / 7s / 25c)',
		'  money 0': 'malformed amount "0" (expected copper or 1g50s / 7s / 25c)',
		'  task': '`task` needs text: task "<what to do>"',
	};
	for (const [line, message] of Object.entries(bad)) {
		const text = guideText(['step One', line, '  accept 783']);
		assert.deepEqual(parse(text).errors, [`${lineOf(text, line)}: ${message}`], line);
	}
});

test('the resolver writes the goals and the predicate for the engine, and the emitter in a fixed key order', () => {
	const r = compile(guideText(['step One', '  when money>=1s', '  money 2s', '  task "Tame a Venomtail Scorpid"', '  accept 783']));
	assert.deepEqual(r.errors, [], r.text);
	const step = plain(r.guides[0].steps[0]);
	assert.deepEqual(step.when, [{ k: 'money', op: '>=', n: 100 }]);
	assert.deepEqual(step.goals.slice(0, 2), [{ t: 'money', money: 200 }, { t: 'task', text: 'Tame a Venomtail Scorpid' }]);
	const lua = emitGuides([{ guide: r.guides[0], source: null }]);
	assert.match(lua, /when = \{ \{ k = "money", op = ">=", n = 100 \} \},/);
	assert.match(lua, /\{ t = "money", money = 200 \},/);
	assert.match(lua, /\{ t = "task", text = "Tame a Venomtail Scorpid" \},/);
});

test('a task in an along step warns: Polestar checks it off only on the step the route is on', () => {
	const text = guideText(['step Along', '  along', '  task "Pick up any Tough Wolf Meat"', '  money 1s', 'step Two', '  accept 783']);
	const r = compile(text);
	assert.deepEqual(r.errors, [], r.text);
	const at = `test.guide:${lineOf(text, 'task "Pick up any Tough Wolf Meat"')}: `;
	assert.deepEqual(r.warnings.filter((w) => w.includes('along')), [
		`${at}\`task\` in an \`along\` step never checks off: Polestar checks it only on the step the route is on, so it stays listed`,
	]);
});

test('the planner writes money and task goals back as the parser reads them', () => {
	const { parseGoalLine, goalFields, formatGoal } = require('../tools/lib/planner/goalfmt');
	const line = (text) => formatGoal(goalFields(parseGoalLine(text).goal));
	assert.equal(line('money 1s50c'), 'money 1s50c');
	assert.equal(line('money 350 optional'), 'money 3s50c optional');
	assert.equal(line('task Kill Gru\'ark when he becomes hostile'), 'task Kill Gru\'ark when he becomes hostile');
	assert.equal(line('task "Tame a Venomtail Scorpid" @45,60 optional'), 'task "Tame a Venomtail Scorpid" @45.0,60.0 optional');
	assert.equal(line('task "Logout skip" only Hunter'), 'task "Logout skip" only Hunter');
});

test('a pack with a money or task goal is written in format 4', () => {
	const mini = path.join(__dirname, 'fixtures', 'packs', 'mini');
	const { manifest } = readManifest(mini);
	const { guides } = compileProject({ packDir: mini, manifest, dataDir: DATA_DIR });
	assert.equal(formatFor(guides), FORMAT);
	for (const goal of [{ t: 'money', money: 100 }, { t: 'task', text: 'Do it' }]) {
		const copy = guides.map((g) => ({ ...g, steps: g.steps.map((s, i) => (i === 0 ? { ...s, goals: [...s.goals, goal] } : s)) }));
		assert.equal(formatFor(copy), WHEN_FORMAT, goal.t);
	}
});
