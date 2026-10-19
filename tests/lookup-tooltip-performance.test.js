'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runAddon } = require('./helpers/lua');
const { writeCodexPack } = require('./helpers/codex');

const FIXTURE = path.join(__dirname, 'fixtures', 'codex', 'lookup.json');
const codex = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const MAPS = Object.entries(codex.frames)
	.map(([id, f]) => `w.addMap(${id}, { name = ${JSON.stringify(codex.zones[id].name)}, c = ${f.c}, left = ${f.left}, right = ${f.right}, top = ${f.top}, bottom = ${f.bottom} })`)
	.join('\n');
const ADDON = { name: 'Polestar', files: ['Core/Core.xml', 'Lookup/Lookup.xml'] };

function run() {
	const pack = writeCodexPack(codex);
	try {
		return runAddon({
			stubs: ['stub_world.lua', 'stub_lookup_runtime.lua'],
			before: `${pack.stubLua}
local w = stub.world
${MAPS}
w.level, w.race, w.raceName, w.faction = 20, "Human", "Human", "Alliance"
w.class, w.className = "WARRIOR", "WARRIOR"
w.moveTo(9001, 50, 50)`,
			addons: [ADDON],
			login: true,
			script: `
local calls = 0
Polestar.Nav = Polestar.Nav or {}
Polestar.Nav.EstimateTravel = function(a, b)
	calls = calls + 1
	local mapGap = math.abs((a.map or 0) - (b.map or 0)) * 1000
	return mapGap + math.abs((a.x or 0) - (b.x or 0)) + math.abs((a.y or 0) - (b.y or 0))
end

local function showItem(id)
	GameTooltip:SetOwner(UIParent)
	lookuprt.showItem(GameTooltip, id, "|cffffffff|Hitem:" .. id .. "::::::::20:::::|h[x]|h|r")
	return GameTooltip.lines
end

local before = calls
local itemLines = showItem(8000)
local itemTooltipCalls = calls - before

before = calls
Polestar.Lookup.Sources("mount", 8000)
local itemLookupCalls = calls - before

lookuprt.units.target = { guid = "Player-1-0000BEEF", player = true }
lookuprt.auras.target = { { spellId = 9502, name = "Ember Wolf", icon = 132226 } }
GameTooltip:SetOwner(UIParent)
before = calls
Polestar.Lookup.UnitTooltip(GameTooltip, "target")
local unitTooltipCalls = calls - before
local unitLines = GameTooltip.lines

before = calls
Polestar.Lookup.Sources("mount", 8012)
local unitLookupCalls = calls - before

emit({
	itemTooltipCalls = itemTooltipCalls,
	itemLookupCalls = itemLookupCalls,
	unitTooltipCalls = unitTooltipCalls,
	unitLookupCalls = unitLookupCalls,
	itemLines = itemLines,
	unitLines = unitLines,
})`,
		}).emitted[0];
	} finally {
		pack.cleanup();
	}
}

test('source tooltips never invoke route planning and do not fill the routed cache', () => {
	const out = run();
	assert.equal(out.itemTooltipCalls, 0, 'item tooltip must not invoke Nav.EstimateTravel');
	assert.equal(out.unitTooltipCalls, 0, 'unit mount tooltip must not invoke Nav.EstimateTravel');
	assert.ok(out.itemLookupCalls > 0, 'normal item lookup must still route after the tooltip');
	assert.ok(out.unitLookupCalls > 0, 'normal mount lookup must still route after the unit tooltip');
	assert.deepEqual(out.itemLines, [
		'From Mira Saddler | Vendor · Amber Vale',
		'Alt-click: guide me',
	]);
	assert.deepEqual(out.unitLines, [
		'Mount: Ember Wolf | Horde only',
		'/pole mount: how to get it',
	]);
});
