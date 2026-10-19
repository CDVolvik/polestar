'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { runAddon, ROOT } = require('./helpers/lua');

for (const [name, file] of [
	['relative Lua file', 'Core/Init.lua'],
	['absolute Lua file', path.join(ROOT, 'addon/Polestar/Core/Init.lua')],
	['absolute XML manifest', path.join(ROOT, 'addon/Polestar/Core/Core.xml')],
]) {
	test(`addon fixtures load ${name}`, () => {
		const { emitted } = runAddon({
			addons: [{ name: 'Polestar', files: [file] }],
			script: 'emit(Polestar.name)',
		});
		assert.deepEqual(emitted, ['Polestar']);
	});
}
