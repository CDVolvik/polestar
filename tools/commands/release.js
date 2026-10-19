'use strict';
// release: the maintainer's release tooling (docs/RELEASING.md). `notes`
// writes a version's release notes from CHANGELOG.md. They run from a `next`
// checkout.

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('../lib/cli');
const { ROOT } = require('../lib/paths');
const notes = require('../lib/release/notes');

const usage = `usage: node tools/polestar.js release <notes> [args]

release notes <x.y.z> [--root <dir>] [--out <dir>]
  Writes the version's CHANGELOG.md section as dist/notes-<v>.md (GitHub),
  dist/notes-curseforge-<v>.md and dist/notes-discord-<v>.txt. Each has a
  placeholder for the intro, marked ${notes.PLACEHOLDER}, to replace before
  publishing.
    --root <dir>    folder holding CHANGELOG.md (default the repository)
    --out <dir>     where to write (default <root>/dist/)`;

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function fail(message) {
	console.error(`${message}\n\n${usage}`);
	return 2;
}

function runNotes(argv) {
	const { opts, positional, error } = parseArgs(argv, { flags: [], options: ['--root', '--out'] });
	if (error || positional.length !== 1) return fail(error || 'one version');
	const version = positional[0];
	if (!SEMVER.test(version)) return fail(`"${version}" is not a version (x.y.z)`);
	const root = opts.root ? path.resolve(opts.root) : ROOT;
	const file = path.join(root, 'CHANGELOG.md');
	if (!fs.existsSync(file)) {
		console.error(`no ${file}`);
		return 1;
	}
	const rel = notes.releaseSection(fs.readFileSync(file, 'utf8'), version);
	if (!rel) {
		console.error(`CHANGELOG.md has no "## ${version} (<date>)" section`);
		return 1;
	}
	const out = opts.out ? path.resolve(opts.out) : path.join(root, 'dist');
	fs.mkdirSync(out, { recursive: true });
	const files = [
		[`notes-${version}.md`, notes.github(rel)],
		[`notes-curseforge-${version}.md`, notes.curseforge(rel)],
		[`notes-discord-${version}.txt`, notes.discord(rel)],
	];
	for (const [name, text] of files) {
		fs.writeFileSync(path.join(out, name), text);
		console.log(path.join(out, name));
	}
	console.log(`\nEach file holds a placeholder for the intro, marked ${notes.PLACEHOLDER}: replace it before publishing.`);
	return 0;
}

const SUBCOMMANDS = { notes: runNotes };

async function run(argv) {
	if (!argv.length || argv[0] === '--help' || argv[0] === '-h') {
		console.log(usage);
		return argv.length ? 0 : 2;
	}
	const sub = SUBCOMMANDS[argv[0]];
	if (!sub) return fail(`unknown subcommand ${argv[0]}`);
	if (argv.includes('--help') || argv.includes('-h')) {
		console.log(usage);
		return 0;
	}
	return sub(argv.slice(1));
}

module.exports = { name: 'release', summary: 'Release tooling: release notes', usage, run };
