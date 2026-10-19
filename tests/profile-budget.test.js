'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withinBudget } = require('./helpers/profile');

test('performance budgets account for one measured clock step, capped at one millisecond', () => {
	assert.equal(withinBudget(1, 1, 1, 1), true, 'a sub-ms frame can be reported as one whole ms');
	assert.equal(withinBudget(1.001, 1, 1, 0.001), false, 'a precise clock does not get millisecond slack');
	assert.equal(withinBudget(2, 1, 1, 1), false, 'two clock steps still exceed the frame budget');
	assert.equal(withinBudget(3, 1, 1, 100), false, 'a coarse clock cannot grant unbounded slack');
	assert.equal(withinBudget(8, 8, 1, 0), false, 'the exact budget remains a strict boundary');
	assert.equal(withinBudget(14, 8, 1.455, 1), false, 'the previous full-suite step failure is not waived');
});

test('performance budgets retain load calibration and reject invalid timing readings', () => {
	assert.equal(withinBudget(11, 8, 1.5, 0.001), true);
	assert.equal(withinBudget(12.001, 8, 1.5, 0.001), false);
	for (const bad of [NaN, Infinity, -1]) {
		assert.equal(withinBudget(bad, 1, 1, 0.001), false);
		assert.equal(withinBudget(0.1, 1, bad, 0.001), false);
		assert.equal(withinBudget(0.1, 1, 1, bad), false);
	}
	assert.equal(withinBudget(0.5, 1, 0, 0), false, 'a missing reference must not pass');
});
