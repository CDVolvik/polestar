'use strict';
// Regenerates the committed generated files that contributor PRs leave for the
// maintainer: compile (needs data/forever), i18n sync, preview and media.
// Run this after merging a contributor PR that touches guides/, the addon's
// Lua, or player-facing English strings, and before every feature release.

const path = require('node:path');

module.exports = {
	name: 'regen',
	summary: 'Regenerate committed files after merging contributor PRs (compile + i18n sync + preview + media)',
	usage: [
		'usage: node tools/polestar.js regen [--no-compile] [--no-i18n] [--no-preview] [--no-media]',
		'',
		'Regenerates the four sets of committed generated files that contributors',
		'do not commit themselves:',
		'',
		'  compile     addon/Polestar_Guides/Guides.lua from guides/ and data/forever',
		'  i18n sync   locale files from the addon\u2019s English strings',
		'  preview     docs/preview/*.svg from the addon\u2019s Lua (no reference data)',
		'  media       addon/Polestar/Media/*.tga from tools/media/ (no reference data)',
		'',
		'compile needs the reference data (data/forever); the rest do not.',
		'Pass --no-<step> to skip a step.',
		'',
		'Run this after merging contributor PRs that touch guides/ or the addon\u2019s',
		'Lua, and before every feature release.',
	].join('\n'),
	async run(argv) {
		const skip = new Set(
			argv
				.filter((a) => a.startsWith('--no-'))
				.map((a) => a.slice(5)),
		);

		const steps = [
			{ key: 'compile', file: 'compile', args: [] },
			{ key: 'i18n', file: 'i18n', args: ['sync'] },
			{ key: 'preview', file: 'preview', args: [] },
			{ key: 'media', file: 'media', args: [] },
		];

		let anyFailed = false;
		for (const step of steps) {
			if (skip.has(step.key)) {
				console.log(`regen: skipping ${step.key}`);
				continue;
			}
			console.log(`\nregen: ${[step.key, ...step.args].join(' ')}`);
			const cmd = require(path.join(__dirname, `${step.file}.js`));
			const code = await cmd.run(step.args);
			if (code) {
				console.error(`regen: ${step.key} exited with ${code}`);
				anyFailed = true;
			}
		}
		return anyFailed ? 1 : 0;
	},
};
