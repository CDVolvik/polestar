'use strict';
// release notes: the notes written from CHANGELOG.md.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('./helpers/tmp');
const { polestar } = require('./helpers/cli');
const { joinLines, releaseSection, DISCORD_LIMIT, discordPosts } = require('../tools/lib/release/notes');

const CHANGELOG = `# Changelog

## Unreleased

### For players

- Unreleased entry.

## 1.0.1 (2026-10-16)

### For players

- A fix that wraps
  onto a second line (thanks Ann and Bo).
- A list with
  - a sub-item that
    wraps

A paragraph
over two lines.

### For guide authors

- An authors' entry
  (thanks Cy).

### For contributors

- A contributors' entry.

## 1.0.0 (2026-10-01)

### For players

- Old entry.
`;

test('notes: joinLines puts each item and paragraph on one line', () => {
	assert.strictEqual(joinLines('- a\n  b\n  - c\n    d\n\n\npara\ngraph\n'), '- a b\n  - c d\n\npara graph');
	assert.strictEqual(joinLines('```\nx\n  y\n```'), '```\nx\n  y\n```');
});

test('notes: writes the requested version only, lines joined', () => {
	const dir = tmpdir();
	fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), CHANGELOG);
	const out = path.join(dir, 'out');
	const r = polestar(['release', 'notes', '1.0.1', '--root', dir, '--out', out]);
	assert.strictEqual(r.status, 0, r.stderr);
	const gh = fs.readFileSync(path.join(out, 'notes-1.0.1.md'), 'utf8');
	assert.ok(gh.includes('- A fix that wraps onto a second line (thanks Ann and Bo).\n'));
	assert.ok(gh.includes('  - a sub-item that wraps\n'));
	assert.ok(gh.includes('A paragraph over two lines.'));
	assert.ok(gh.includes("- An authors' entry (thanks Cy)."));
	for (const absent of ['Unreleased entry', 'Old entry', "contributors' entry"]) assert.ok(!gh.includes(absent), absent);
	assert.ok(gh.includes('Ann, Bo, Cy'));
	const cf = fs.readFileSync(path.join(out, 'notes-curseforge-1.0.1.md'), 'utf8');
	assert.ok(cf.includes('- A fix that wraps onto a second line'));
	assert.ok(!cf.includes("authors' entry"));
	const discord = fs.readFileSync(path.join(out, 'notes-discord-1.0.1.txt'), 'utf8');
	assert.ok(discord.includes('- A fix that wraps onto a second line'));
	// Deterministic: a second run writes the same files.
	const again = path.join(dir, 'again');
	polestar(['release', 'notes', '1.0.1', '--root', dir, '--out', again]);
	for (const f of fs.readdirSync(out)) assert.strictEqual(fs.readFileSync(path.join(again, f), 'utf8'), fs.readFileSync(path.join(out, f), 'utf8'));
	assert.strictEqual(polestar(['release', 'notes', '9.9.9', '--root', dir, '--out', out]).status, 1);
});

test('notes: Discord posts stay under the limit', () => {
	const long = Array.from({ length: 60 }, (_, i) => `- Entry ${i} ${'word '.repeat(60)}`).join('\n') + `\n- One huge entry. ${'Sentence here. '.repeat(300)}`;
	const rel = releaseSection(`## 2.0.0 (2026-01-02)\n\n### For players\n\n${long}\n`, '2.0.0');
	const posts = discordPosts(rel);
	assert.ok(posts.length > 3);
	for (const p of posts) assert.ok([...p].length <= DISCORD_LIMIT, String([...p].length));
});
