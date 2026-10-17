'use strict';
// Reporting a problem (addon/Polestar/UI/Report.lua): the guide window's bug
// button, its menu entry and /polestar report open a window that sets the
// player's words above the details a fix needs, as one report: in a link
// that opens a filled-in GitHub issue, or to copy for the Polestar Discord;
// the sidebars of the hub and the settings, and
// /polestar discord, give the invite with Discord's mark. Against the real
// Core, Theme and UI and the fakes of tests/lua/stub_ui.lua.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAddon } = require('./helpers/lua');

const FILES = ['Core/Core.xml', 'Theme/Theme.xml', 'UI/UI.xml'];
const INVITE = 'https://discord.gg/vMbee6F2e9';

function run(script, before = '') {
	return runAddon({
		stubs: ['stub_ui.lua'],
		before,
		addons: [{ name: 'Polestar', files: FILES }],
		script: `uistub.install()\nstub.login()\nlocal GF, UI = Polestar.UI.GuideFrame, Polestar.UI\n${script}`,
	}).emitted;
}

const lineWith = (text, needle) => text.split('\n').find((l) => l.includes(needle));

test('the bug in the navigator reports the step on screen: the player\'s words, then the guide, the step, each goal\'s state, ids and position, the arrow and the versions', () => {
	const [out] = run(`
		Polestar.Engine.SetGuide(nil)
		local noGuide = GF.parts.nav.Report:IsShown()
		uistub.setGuide(uistub.elwynn, 3)
		local nav = GF.parts.nav
		local shown = nav.Report:IsShown()
		nav.Report:Click()
		local F = PolestarReport
		local opened = { shown = F:IsShown(), typing = stub.focus == F.Desc, context = F.Context:GetText() }
		F.Desc:SetText("The vermin were all by the tents.")
		stub.RunScript(F.Desc, "OnTextChanged", true)
		local hidden = not F.Box:IsShown()
		local closedH = F:GetHeight()
		F.Copy:Click()
		local text = F.Box:GetText()
		local selected = F.Box:IsShown() and stub.focus == F.Box
		local boxH = F.Box:GetHeight()
		local grown = F:GetHeight() - closedH
		F.Invite:Click()
		emit({ noGuide = noGuide, shown = shown, opened = opened, text = text, hidden = hidden, selected = selected, grown = grown,
			invite = { shown = PolestarCopy:IsShown(), text = PolestarCopy.Box:GetText(), focus = stub.focus == PolestarCopy.Box }, boxH = boxH })`);
	assert.equal(out.noGuide, false, 'no guide, no step to report: the bug is not there');
	assert.equal(out.shown, true);
	assert.deepEqual(out.opened, { shown: true, typing: true, context: 'Step 3 of 8  \u00b7  Kobold Camp  \u00b7  Elwynn Forest' });
	const lines = out.text.split('\n');
	assert.equal(lines[0], '**What went wrong:** The vermin were all by the tents.', 'the player\'s words come first, as they typed them');
	assert.equal(lines[1], '```');
	assert.equal(lines[lines.length - 1], '```', 'the details sit in one code block');
	assert.ok(lines.includes('Guide: Elwynn Forest (forever/alliance/human/01-elwynn-forest)'), out.text);
	assert.ok(lines.includes('Step 3 of 8: Kobold Camp'), out.text);
	const kill = lineWith(out.text, 'Kobold Vermin');
	assert.ok(kill.startsWith('[>] Kill Kobold Vermin 7/10'), `the arrow's goal, with its count: ${kill}`);
	for (const fact of ['quest 7', 'npc 6', 'map 1429 @47.60,35.10 live']) assert.ok(kill.includes(fact), `${fact} in ${kill}`);
	assert.ok(lineWith(out.text, 'Wolves Across the Border').startsWith('[x] Accept'), 'a done goal');
	const meat = lineWith(out.text, 'Tough Wolf Meat');
	assert.ok(meat.startsWith('[ ] Kill Young Wolf for Tough Wolf Meat 3/8') && meat.includes('item 750'), meat);
	assert.ok(lineWith(out.text, 'Arrow:').includes('42 yd'), out.text);
	assert.ok(lineWith(out.text, 'Where:').includes('Elwynn Forest'), out.text);
	const who = lineWith(out.text, 'Human Warrior');
	assert.ok(who.includes('level 4') && who.includes('Alliance'), who);
	const versions = lineWith(out.text, 'client ');
	assert.ok(versions.startsWith('Polestar ') && versions.includes('client 1.60.1 (70338)') && versions.endsWith('enUS'), versions);
	assert.ok(lines.includes('Errors: none'), out.text);
	assert.equal(out.hidden, true, 'the report is not shown until it is asked for');
	assert.equal(out.selected, true, 'Copy report shows the report in focus, selected for Ctrl+C');
	assert.ok(out.grown >= out.boxH, `the window grows to hold it (${out.grown}px for a ${out.boxH}px box)`);
	assert.deepEqual(out.invite, { shown: true, text: INVITE, focus: true }, 'Get the invite opens the invite on its own, selected');
	assert.ok(out.boxH >= lines.length * 11, `the box holds every line (${out.boxH}px for ${lines.length})`);
});

test('at its longest the report still fits one Discord message', () => {
	const [out] = run(`
		local long = string.rep("Overlook of the Brightwater Lake ", 6)
		local goals = {}
		for i = 1, 9 do
			goals[i] = { t = "kill", verb = "Kill", subject = long, subjectKind = "npc", npc = 1000000 + i, quest = 2000000 + i, item = 3000000 + i,
				progress = { cur = 99, max = 100 }, map = 1429, x = 47.123, y = 35.456, status = "active" }
		end
		local id = "test/" .. string.rep("long-", 20)
		uistub.guides[id] = { id = id, pack = "guides", title = long, faction = "Alliance", minLevel = 1, maxLevel = 60, steps = { { title = long, goals = goals } } }
		for i = 1, 6 do Polestar.NoteError("Interface/AddOns/Polestar/UI/" .. string.rep("Long", 12) .. i .. ".lua:1: " .. long) end
		uistub.setGuide(id, 1)
		UI.ShowReport()
		local F = PolestarReport
		F.Desc:SetText(string.rep("w", UI.Report.DESC_MAX))
		stub.RunScript(F.Desc, "OnTextChanged", true)
		F.Copy:Click()
		emit({ text = F.Box:GetText() })`);
	assert.ok(out.text.length <= 2000, `${out.text.length} characters`);
	assert.ok(out.text.startsWith(`**What went wrong:** ${'w'.repeat(250)}\n`), 'the description is kept whole');
	assert.match(out.text, /^Step 1 of 1: Overlook/m);
	assert.match(out.text, /^\.\.\. 3 more goals$/m, 'goals past the sixth are counted, not listed');
	assert.equal((out.text.match(/^ {2}1x /gm) || []).length, 3, 'the newest three errors');
});

test('errors Polestar caught come with the report, counted, by their path from the AddOns folder; !BugGrabber adds the session\'s errors in Polestar\'s files', () => {
	const [out] = run(`
		Polestar.On("TEST_FAIL", function() error("Interface/AddOns/Polestar/UI/GuideFrame.lua:12: attempt to index a nil value", 0) end)
		pcall(Polestar.Fire, "TEST_FAIL")
		pcall(Polestar.Fire, "TEST_FAIL")
		BugGrabber = {
			GetSessionId = function() return 7 end,
			GetDB = function() return {
				{ message = "Interface/AddOns/Polestar/Nav/Arrow.lua:40: bad argument", counter = 3, session = 7 },
				{ message = "Interface/AddOns/OtherAddon/Main.lua:1: not ours", counter = 1, session = 7 },
				{ message = "Interface/AddOns/Polestar/Old.lua:1: an earlier session", counter = 1, session = 6 },
				{ message = "Interface/AddOns/Polestar/UI/GuideFrame.lua:12: attempt to index a nil value", counter = 2, session = 7 },
			} end,
		}
		uistub.setGuide(uistub.elwynn, 3)
		UI.ShowReport()
		emit({ text = PolestarReport.Box:GetText() })`);
	const errors = out.text.split('\n').filter((l) => l.startsWith('  '));
	assert.deepEqual(errors, [
		'  2x Polestar/UI/GuideFrame.lua:12: attempt to index a nil value',
		'  3x Polestar/Nav/Arrow.lua:40: bad argument',
	]);
});

test('what the player typed stays while it is the same step; a report on another step starts empty', () => {
	const [out] = run(`
		uistub.setGuide(uistub.elwynn, 3)
		UI.ShowReport()
		local F = PolestarReport
		F.Desc:SetText("Half typed")
		stub.RunScript(F.Desc, "OnTextChanged", true)
		F:Hide()
		UI.ShowReport()
		local same = { text = F.Desc:GetText(), placeholder = F.Desc.Placeholder:IsShown() }
		uistub.setStep(4)
		UI.ShowReport()
		local other = { text = F.Desc:GetText(), placeholder = F.Desc.Placeholder:IsShown(), report = F.Box:GetText():match("^[^\\n]*") }
		emit({ same = same, other = other })`);
	assert.deepEqual(out.same, { text: 'Half typed', placeholder: false });
	assert.deepEqual(out.other, { text: '', placeholder: true, report: '**What went wrong:** (not described)' });
});

test('the guide window\'s menu and /polestar report open it too; Escape closes it', () => {
	const [out] = run(`
		uistub.setGuide(uistub.elwynn, 3)
		GF.menuButton:Click()
		for _, r in ipairs(PolestarMenu.rows) do if r:IsShown() and r.Text:GetText() == "Report a problem" then r:Click() end end
		local fromMenu = PolestarReport:IsShown()
		PolestarReport:Hide()
		SlashCmdList.POLESTAR("report")
		local special = false
		for _, name in ipairs(UISpecialFrames) do if name == "PolestarReport" then special = true end end
		emit({ fromMenu = fromMenu, fromCommand = PolestarReport:IsShown(), special = special })`);
	assert.deepEqual(out, { fromMenu: true, fromCommand: true, special: true });
});

test('the hub and the settings carry the Polestar Discord at the foot of the sidebar: Discord\'s mark in its own colour, the invite selected on a click', () => {
	const [out] = run(`
		local T = Polestar.Theme
		local function mark(f)
			local b = f.Discord
			stub.RunScript(b, "OnEnter")
			stub.RunScript(b, "OnLeave")
			local r, g, bl = b.Icon:GetVertexColor()
			return { texture = b.Icon:GetTexture():match("([%w-]+)$"), color = { r, g, bl }, shown = b:IsShown() }
		end
		local function invite()
			return { shown = PolestarCopy:IsShown(), text = PolestarCopy.Box:GetText(), focus = stub.focus == PolestarCopy.Box,
				icon = PolestarCopy.Icon:IsShown() and PolestarCopy.Icon:GetTexture():match("([%w-]+)$") or false }
		end
		UI.ShowPicker()
		local hub = mark(PolestarPicker)
		PolestarPicker.Discord:Click()
		local fromHub = invite()
		PolestarCopy:Hide()
		UI.ShowOptions()
		local settings = mark(PolestarOptions)
		PolestarCopy:Hide()
		SlashCmdList.POLESTAR("discord")
		local fromCommand = invite()
		UI.ShowCopy("Your position", "zone map 1429")
		local r, g, b = T.Color("discord")
		emit({ hub = hub, settings = settings, fromHub = fromHub, fromCommand = fromCommand, discord = { r, g, b },
			after = { icon = PolestarCopy.Icon:IsShown(), text = PolestarCopy.Box:GetText() } })`);
	const mark = { texture: 'discord', color: out.discord, shown: true };
	assert.deepEqual(out.hub, mark, 'the mark keeps Discord\'s colour, under the cursor too');
	assert.deepEqual(out.settings, mark);
	const invite = { shown: true, text: INVITE, focus: true, icon: 'discord' };
	assert.deepEqual(out.fromHub, invite);
	assert.deepEqual(out.fromCommand, invite);
	assert.deepEqual(out.after, { icon: false, text: 'zone map 1429' }, 'the next text to copy comes without the mark');
});

test('the report names the other addons that are loaded; "Report bug" gives a link that opens a new GitHub issue with the report, its title, the version and those addons filled in', () => {
	const [out] = run(`
		stub.addons[#stub.addons + 1] = { name = "Details", loaded = true }
		stub.addons[#stub.addons + 1] = { name = "TomTom", loaded = true }
		stub.addons[#stub.addons + 1] = { name = "Bagnon", loaded = true }
		stub.addons[#stub.addons + 1] = { name = "Questie", loaded = true }
		stub.addons[#stub.addons + 1] = { name = "NotLoaded", loaded = false }
		stub.addonMeta.Questie = { Version = "9.1.0" }
		uistub.setGuide(uistub.elwynn, 3)
		UI.ShowReport()
		local F = PolestarReport
		F.Desc:SetText("The vermin were all by the tents.")
		stub.RunScript(F.Desc, "OnTextChanged", true)
		local report = F.Box:GetText()
		F.Report:Click()
		local step = { shown = PolestarCopy:IsShown(), url = PolestarCopy.Box:GetText(), focus = stub.focus == PolestarCopy.Box }
		Polestar.Engine.SetGuide(nil)
		emit({ report = report, step = step, noGuide = UI.Report.IssueURL("Lua error on login", UI.Report.Details()) })`);
	assert.ok(out.report.split('\n').includes('Addons: Questie, TomTom, Bagnon, Details'), `quest and map addons first, then A to Z: ${out.report}`);
	assert.equal(out.step.shown, true);
	assert.equal(out.step.focus, true, 'the link is selected for Ctrl+C');
	const url = new URL(out.step.url);
	assert.equal(url.origin + url.pathname, 'https://github.com/fitzforge/polestar/issues/new');
	const q = Object.fromEntries(url.searchParams);
	assert.equal(q.template, 'wrong-step.yml');
	assert.equal(q.title, 'Wrong step: Elwynn Forest, step 3');
	assert.equal(q.guide, 'Elwynn Forest');
	assert.equal(q.step, '3: Kobold Camp');
	assert.equal(q.wrong, out.report, 'the whole report, as the window shows it');
	assert.match(q.character, /^Human Warrior · level 4/);
	assert.match(q.version, /^(\d+\.\d+\.\d+|dev)/);
	assert.equal(q.addons, 'Questie 9.1.0\nTomTom 0.1.0-test\nBagnon 0.1.0-test\nDetails 0.1.0-test');
	const bug = Object.fromEntries(new URL(out.noGuide).searchParams);
	assert.equal(bug.template, 'bug-report.yml', 'no step on screen: a bug report');
	assert.equal(bug.title, 'Bug: Lua error on login');
	assert.match(bug.steps, /^\*\*What went wrong:\*\* Lua error on login\n```\n/);
	assert.equal(bug.guide, undefined);
});

test('with more addons than the link holds, the issue counts them all and lists the ones that fit, quest, map and guide addons first; the link stays short of GitHub\'s limit', () => {
	const [out] = run(`
		for i = 1, 400 do stub.addons[#stub.addons + 1] = { name = ("Addon%03d"):format(i), loaded = true } end
		stub.addons[#stub.addons + 1] = { name = "Questie", loaded = true }
		uistub.setGuide(uistub.elwynn, 3)
		UI.ShowReport()
		emit({ url = UI.Report.IssueURL("The vermin were all by the tents.", PolestarReport.details), max = UI.Report.LINK_MAX })`);
	assert.ok(out.url.length <= out.max, `${out.url.length} characters`);
	const lines = new URL(out.url).searchParams.get('addons').split('\n');
	assert.equal(lines[0], 'The player has 401 other addons on. The ones that fit in the link, quest, map and guide addons first:');
	assert.equal(lines[1], 'Questie 0.1.0-test');
	assert.equal(lines[2], 'Addon001 0.1.0-test');
	assert.ok(lines.length > 50 && lines.length < 402, `${lines.length - 1} of 401 listed`);
});

test('"Mark the right spot" steps the window aside while the player walks; "Mark here" brings it back with the spot in the report and in the issue\'s right spot field, the rest of the report as it was', () => {
	const [out] = run(`
		uistub.setGuide(uistub.elwynn, 3)
		UI.ShowReport()
		local F = PolestarReport
		F.Desc:SetText("The vermin were all by the tents.")
		stub.RunScript(F.Desc, "OnTextChanged", true)
		local before = F.Box:GetText()
		F.Mark:Click()
		local walking = { report = F:IsShown(), bar = PolestarMark:IsShown() }
		Polestar.Compat.GetPlayerMapPosition = function() return nil end
		PolestarMark.Here:Click()
		local nowhere = { bar = PolestarMark:IsShown(), report = F:IsShown() }
		Polestar.Compat.GetPlayerMapPosition = function() return 1429, 51.234, 40.5 end
		PolestarMark.Here:Click()
		local back = { report = F:IsShown(), bar = PolestarMark:IsShown(), note = F.SpotNote:GetText(), button = F.Mark.Label:GetText() }
		local after = F.Box:GetText()
		local url = UI.Report.IssueURL(F.Desc:GetText(), nil, F.spot)
		F:Hide()
		UI.ShowReport()
		local reopened = F.SpotNote:GetText()
		uistub.setStep(4)
		UI.ShowReport()
		emit({ walking = walking, nowhere = nowhere, back = back, before = before, after = after, url = url, reopened = reopened,
			otherStep = F.SpotNote:GetText(), otherReport = F.Box:GetText() })`);
	assert.deepEqual(out.walking, { report: false, bar: true });
	assert.deepEqual(out.nowhere, { bar: true, report: false }, 'no position: the bar stays for another try');
	assert.deepEqual(out.back, { report: true, bar: false, note: 'Right spot marked: zone map 1429 · goto 51.23,40.50 live', button: 'Mark again' });
	const added = out.after.split('\n').filter((l) => !out.before.split('\n').includes(l));
	assert.deepEqual(added, ['Right spot: zone map 1429 · goto 51.23,40.50 live'], 'the spot is the one line added: the report taken at the open is kept');
	assert.equal(new URL(out.url).searchParams.get('where'), 'zone map 1429\ngoto 51.23,40.50 live', 'the right spot field holds what /polestar where prints');
	assert.equal(out.reopened, out.back.note, 'the spot stays while it is the same step');
	assert.match(out.otherStep, /^Optional:/, 'another step starts unmarked');
	assert.doesNotMatch(out.otherReport, /Right spot/);
});
