'use strict';
// A step's picture (docs/GUIDE_FORMAT.md, `image`): the compiler writes its
// path in the pack's addon folder and its size, the pack's addon folder
// carries the file, and lint refuses a path outside the pack folder or of a
// kind the game does not draw, and warns about a file it cannot find or use.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { compile, guideText, DATA_DIR } = require('./helpers/dsl');
const { tmpdir } = require('./helpers/tmp');
const { readManifest } = require('../tools/lib/pack/manifest');
const { compileProject, buildPackFiles, writePackDir } = require('../tools/lib/dsl/project');

// A TGA's or BLP2's header for a w x h picture (the pixels do not matter).
function tga(w, h) {
	const b = Buffer.alloc(18 + 16);
	b[2] = 2;
	b.writeUInt16LE(w, 12);
	b.writeUInt16LE(h, 14);
	b[16] = 32;
	return b;
}
function blp(w, h) {
	const b = Buffer.alloc(32);
	b.write('BLP2', 0, 'latin1');
	b.writeUInt32LE(1, 4);
	b.writeUInt32LE(w, 12);
	b.writeUInt32LE(h, 16);
	return b;
}

// A pack folder holding `files` ({ rel: Buffer | string }) beside pack.json.
function packDir(files) {
	const dir = tmpdir();
	const all = { 'pack.json': JSON.stringify({ id: 'pix', title: 'Pix', author: 'Ann', version: '1.0.0', license: 'CC0-1.0' }), ...files };
	for (const [rel, content] of Object.entries(all)) {
		fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
		fs.writeFileSync(path.join(dir, rel), content);
	}
	return dir;
}

const GUIDE = [
	'guide pix/a',
	'title Pix A',
	'faction Alliance',
	'levels 1-6',
	'zone Elwynn Forest',
	'',
	'step Deputy Willem',
	'  tip The mine mouth is behind the farm.',
	'  image media/fargodeep-mine',
	'  accept 783',
	'',
	'step Marshal McBride',
	'  image media/shots/gate.blp 1024x512',
	'  turnin 783',
	'',
	'step No picture',
	'  tip Nothing to see.',
	'  level 2',
	'',
].join('\n');

function build(dir) {
	const { manifest, diags } = readManifest(dir);
	assert.deepEqual(diags, []);
	const { guides, diag, data } = compileProject({ packDir: dir, manifest, dataDir: DATA_DIR });
	assert.deepEqual(diag.errors, []);
	return { manifest, diag, files: buildPackFiles({ guides, manifest, data }) };
}

test('a step picture compiles to its path in the addon folder and its size, read from the file when the guide gives none', () => {
	const cave = tga(512, 256);
	const gate = blp(256, 128);
	const dir = packDir({ 'guides/a.guide': GUIDE, 'media/fargodeep-mine.tga': cave, 'media/shots/gate.blp': gate });
	const { manifest, diag, files } = build(dir);
	assert.deepEqual(diag.warnings.map((w) => w.message), []);
	const lua = files['Guides.lua'];
	assert.match(lua, /note = "The mine mouth is behind the farm\.",\n\t+image = \{ file = "media\\\\fargodeep-mine", w = 512, h = 256 \},\n/);
	// The size the guide gives wins over the file's (the shown aspect).
	assert.match(lua, /image = \{ file = "media\\\\shots\\\\gate", w = 1024, h = 512 \},/);
	assert.equal(lua.match(/image = /g).length, 2, 'a step without a picture has no image key');
	// The addon folder carries each file at its path in the pack folder.
	assert.deepEqual(files['media/fargodeep-mine.tga'], cave);
	assert.deepEqual(files['media/shots/gate.blp'], gate);
	const out = path.join(tmpdir(), manifest.folder);
	writePackDir(out, files);
	assert.deepEqual(fs.readFileSync(path.join(out, 'media', 'fargodeep-mine.tga')), cave);
	assert.deepEqual(fs.readFileSync(path.join(out, 'media', 'shots', 'gate.blp')), gate);
	assert.ok(fs.existsSync(path.join(out, 'Guides.lua')));
});

test('without the extension the picture is the .tga, else the .blp, whatever the extension\'s case', () => {
	const dir = packDir({ 'guides/a.guide': GUIDE.replace('media/shots/gate.blp 1024x512', 'media/shots/gate'), 'media/fargodeep-mine.TGA': tga(512, 512), 'media/shots/gate.blp': blp(128, 64) });
	const { files } = build(dir);
	assert.match(files['Guides.lua'], /image = \{ file = "media\\\\fargodeep-mine", w = 512, h = 512 \},/);
	assert.match(files['Guides.lua'], /image = \{ file = "media\\\\shots\\\\gate", w = 128, h = 64 \},/);
	assert.deepEqual(Object.keys(files).filter((f) => f.startsWith('media/')).sort(), ['media/fargodeep-mine.TGA', 'media/shots/gate.blp']);
});

test('lint warns about a picture the pack folder lacks, one of a size that is no power of two and a file it cannot read', () => {
	const dir = packDir({ 'media/odd.tga': tga(600, 400), 'media/junk.tga': 'not a picture' });
	const text = guideText(['step A', '  image media/missing', '  level 2', 'step B', '  image media/odd.tga', '  level 3', 'step C', '  image media/junk', '  level 4']);
	const r = compile(text, undefined, { packDir: dir });
	assert.deepEqual(r.errors, []);
	const at = (needle) => `test.guide:${text.split('\n').findIndex((l) => l.trim() === needle) + 1}`;
	assert.deepEqual(r.warnings, [
		`${at('image media/missing')}: image media/missing: the pack folder has no media/missing.tga or media/missing.blp, so the step shows no picture`,
		`${at('image media/odd.tga')}: image media/odd.tga is 600x400: the game may not draw a texture whose sides are not powers of two`,
		`${at('image media/junk')}: image media/junk.tga is not a TGA or BLP picture Polestar can read the size of`,
	]);
	// A missing file is shown as nothing: the step keeps its path, the addon folder no file.
	assert.deepEqual(JSON.parse(JSON.stringify(r.guides[0].steps[0].image)), { file: 'media\\missing' });
	assert.deepEqual(JSON.parse(JSON.stringify(r.guides[0].steps[1].image)), { file: 'media\\odd', w: 600, h: 400 });
});

test('lint refuses a picture outside the pack folder, of a kind the game does not draw, or written wrong', () => {
	const bad = [
		['image /media/cave.tga', /image path "\/media\/cave\.tga" is absolute/],
		['image C:/shots/cave.tga', /image path "C:\/shots\/cave\.tga" is absolute/],
		['image ../shared/cave.tga', /image path "\.\.\/shared\/cave\.tga" leaves the pack folder/],
		['image media/../../cave.tga', /leaves the pack folder/],
		['image media\\cave.tga', /has a \\/],
		['image media/cave.png', /the game draws \.tga and \.blp pictures, not \.png/],
		['image media/cave.jpg 512x256', /not \.jpg/],
		['image "media/my cave.tga"', /has a character the game's paths do not take/],
		['image media/cave.tga 512', /malformed picture size "512"/],
		['image media/cave.tga 0x256', /malformed picture size "0x256"/],
		['image media/cave.tga 512x256 big', /unexpected "big" after the picture's size/],
		['image', /`image` needs the picture's path in the pack folder/],
		['image media/cave.tga -- the mine', /notes \(` -- `\) are only allowed on goal lines/],
	];
	for (const [line, message] of bad) {
		const r = compile(guideText(['step A', `  ${line}`, '  level 2']));
		assert.ok(r.errors.some((e) => message.test(e)), `${line}: ${JSON.stringify(r.errors)}`);
	}
	const twice = compile(guideText(['step A', '  image media/a.tga', '  image media/b.tga', '  level 2']));
	assert.deepEqual(twice.errors, ['test.guide:9: duplicate `image` in step (first on line 8): a step shows one picture']);
});

test('a guide compiled without its pack folder keeps the size it gives and checks no file', () => {
	const r = compile(guideText(['step A', '  image media/cave.tga 512x256', '  level 2', 'step B', '  image media/other', '  level 3']));
	assert.deepEqual([r.errors, r.warnings], [[], []]);
	assert.deepEqual(JSON.parse(JSON.stringify(r.guides[0].steps.map((s) => s.image))), [{ file: 'media\\cave', w: 512, h: 256 }, { file: 'media\\other' }]);
});
