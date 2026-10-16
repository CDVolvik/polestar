-- Polestar.Theme, the game's own skins (docs/ARCHITECTURE.md, "Skins"):
-- Polestar drawn in the client's art, the three looks EllesmereUI offers on
-- the Forever client (only their visual spec is followed; nothing of that
-- addon is used):
--   "forever"   WoW Forever: Forever's own art. A slim bronze line round the
--               guide window, the heavy bronze metal frame round the big
--               windows, a black body, the quest tracker's header rods,
--               bronze-edged plates, gold #FFD100 and tan #AE9D81.
--   "blizzard"  Blizzard Style: the retail art that still ships with the
--               client (ns.GameArt, by file and coordinates: SetAtlas draws
--               Forever's there). No frame round the guide window, a black
--               body under a 20-unit fade, the damage meter's header bar; the
--               retail metal frame round the big windows.
--   "classic"   Classic WoW UI: the vanilla files. The tooltip tile under the
--               chat tab's 5-unit rim round the guide window, the dialog box
--               and its header plate round the big windows, the panel
--               buttons, check boxes, slider and option tabs.
-- Every piece drawn here lives in frame.psSkin.kit, so Theme's clearSkin
-- hides it when another skin paints the frame.

local _, ns = ...
local Theme = ns.Theme
local P = Theme.Paint

local pairs, ipairs, type = pairs, ipairs, type

local CLASSIC = {
	-- [name] = { file, w, h, left, right, top, bottom } (sizes at 1x)
	tile = { "Interface\\Tooltips\\UI-Tooltip-Background", 64, 64, 0, 1, 0, 1 },
	rim = { "Interface\\ChatFrame\\ChatFrameTab", 64, 32, 0, 1, 0, 1 },
	header = { "Interface\\DialogFrame\\UI-DialogBox-Header", 276, 78, 118 / 512, 394 / 512, 2 / 128, 80 / 128 },
	field = { "Interface\\Glues\\CharacterCreate\\CharacterCreate-LabelFrame", 107, 38, 10 / 128, 117 / 128, 13 / 64, 51 / 64 },
	tab = { "Interface\\OptionsFrame\\UI-OptionsFrame-InActiveTab", 111, 25, 9 / 128, 120 / 128, 7 / 32, 1 },
	tabActive = { "Interface\\OptionsFrame\\UI-OptionsFrame-ActiveTab", 114, 31, 7 / 128, 121 / 128, 0, 31 / 32 },
	check = { "Interface\\Buttons\\UI-CheckBox-Up", 32, 32, 0, 1, 0, 1 },
	checkOn = { "Interface\\Buttons\\UI-CheckBox-Check", 32, 32, 0, 1, 0, 1 },
	slThumb = { "Interface\\Buttons\\UI-SliderBar-Button-Horizontal", 32, 32, 0, 1, 0, 1 },
	ddArrow = { "Interface\\Buttons\\UI-ScrollBar-ScrollDownButton-Up", 32, 32, 0, 1, 0, 1 },
	close = { "Interface\\Buttons\\UI-Panel-MinimizeButton-Up", 32, 32, 0, 1, 0, 1 },
	closeDown = { "Interface\\Buttons\\UI-Panel-MinimizeButton-Down", 32, 32, 0, 1, 0, 1 },
	prev = { "Interface\\Buttons\\UI-SpellbookIcon-PrevPage-Up", 32, 32, 0, 1, 0, 1 },
	next = { "Interface\\Buttons\\UI-SpellbookIcon-NextPage-Up", 32, 32, 0, 1, 0, 1 },
	rowLit = { "Interface\\QuestFrame\\UI-QuestTitleHighlight", 128, 16, 0, 1, 0, 1 },
	selected = { "Interface\\Buttons\\UI-Listbox-Highlight2", 128, 16, 0, 1, 0, 1 },
	statusFill = { "Interface\\TargetingFrame\\UI-StatusBar", 64, 8, 0, 1, 0, 1 },
	-- The cast bar's frame, cut at columns 16 | 48 | 208 | 240 and rows
	-- 16 | 28 | 37 | 48 of its 256 x 64 sheet: caps 32 wide, the top band 12
	-- high, the window band 9, the bottom band 11.
	castbar = { "Interface\\CastingBar\\UI-CastingBar-Border", 224, 32, 16 / 256, 240 / 256, 16 / 64, 48 / 64 },
}

-- The parts each skin draws, by role. Forever names atlas elements (the
-- client draws its own art for them); Blizzard names them too, read from
-- ns.GameArt; Classic names CLASSIC above.
local KITS = {
	forever = {
		source = "atlas",
		metal = { "UI-Frame-Metal-CornerTopLeft", "_UI-Frame-Metal-EdgeTop", "UI-Frame-Metal-CornerTopRight",
			"!UI-Frame-Metal-EdgeLeft", false, "!UI-Frame-Metal-EdgeRight",
			"UI-Frame-Metal-CornerBottomLeft", "_UI-Frame-Metal-EdgeBottom", "UI-Frame-Metal-CornerBottomRight" },
		-- Where the metal's rails run inside its pieces: the window's edges
		-- sit there (left, top, right, bottom), the title bar above the top;
		-- titleY: the bar's middle above the window's top edge.
		metalOut = { 18, 41, 18, 14 }, titleY = 15,
		-- The Forever metal's pieces at 1x (its art is 2x only).
		metalSize = { { 95, 95 }, { 128, 95 }, { 95, 95 }, { 95, 128 }, false, { 95, 128 }, { 95, 100 }, { 128, 100 }, { 95, 100 } },
		bigBg = "heavybronze-frame-background",
		tooltip = { "Tooltip-NineSlice-CornerTopLeft", "_Tooltip-NineSlice-EdgeTop", "Tooltip-NineSlice-CornerTopRight",
			"!Tooltip-NineSlice-EdgeLeft", "Tooltip-NineSlice-Center", "!Tooltip-NineSlice-EdgeRight",
			"Tooltip-NineSlice-CornerBottomLeft", "_Tooltip-NineSlice-EdgeBottom", "Tooltip-NineSlice-CornerBottomRight" },
		slim = "UI-HUD-ActionBar-Frame",
		tab = { "Options_Tab_Left", "Options_Tab_Middle", "Options_Tab_Right" },
		tabActive = { "Options_Tab_Active_Left", "Options_Tab_Active_Middle", "Options_Tab_Active_Right" },
		divider = "Options_HorizontalDivider",
		check = "checkbox-minimal", checkOn = "checkmark-minimal",
		slider = { "Minimal_SliderBar_Left", "_Minimal_SliderBar_Middle", "Minimal_SliderBar_Right" }, slThumb = "Minimal_SliderBar_Button",
		ddArrow = "common-dropdown-a-button",
		field = { "common-search-border-left", "common-search-border-middle", "common-search-border-right" },
		button = { "128-RedButton-Left", "_128-RedButton-Center", "128-RedButton-Right" },
		buttonDown = { "128-RedButton-Left-Pressed", "_128-RedButton-Center-Pressed", "128-RedButton-Right-Pressed" },
		buttonOff = { "128-RedButton-Left-Disabled", "_128-RedButton-Center-Disabled", "128-RedButton-Right-Disabled" },
		buttonLit = "128-RedButton-Highlight",
		close = "RedButton-Exit", closeDown = "RedButton-exit-pressed",
		plate = "common-button-tertiary-square-normal", plateHover = "common-button-tertiary-square-hover",
		card = "common-button-list-small", cardHover = "common-button-list-small-hover", cardSelected = "common-button-list-small-selected",
		header = "UI-QuestTracker-Primary-Objective-Header",
		status = { bg = "Legacy-Progressbar-BG", fill = "Legacy-Progressbar-Fill", frame = "Legacy-Progressbar-Frame" },
		rowLit = "common-button-list-small-selected",
	},
	blizzard = {
		source = "retail",
		metal = { "UI-Frame-Metal-CornerTopLeft", "_UI-Frame-Metal-EdgeTop", "UI-Frame-Metal-CornerTopRight",
			"!UI-Frame-Metal-EdgeLeft", false, "!UI-Frame-Metal-EdgeRight",
			"UI-Frame-Metal-CornerBottomLeft", "_UI-Frame-Metal-EdgeBottom", "UI-Frame-Metal-CornerBottomRight" },
		metalOut = { 15, 38, 15, 8 }, titleY = 10,
		bigBg = "rock",
		tooltip = { "Tooltip-NineSlice-CornerTopLeft", "_Tooltip-NineSlice-EdgeTop", "Tooltip-NineSlice-CornerTopRight",
			"!Tooltip-NineSlice-EdgeLeft", "Tooltip-NineSlice-Center", "!Tooltip-NineSlice-EdgeRight",
			"Tooltip-NineSlice-CornerBottomLeft", "_Tooltip-NineSlice-EdgeBottom", "Tooltip-NineSlice-CornerBottomRight" },
		tab = { "Options_Tab_Left", "Options_Tab_Middle", "Options_Tab_Right" },
		tabActive = { "Options_Tab_Active_Left", "Options_Tab_Active_Middle", "Options_Tab_Active_Right" },
		divider = "Options_HorizontalDivider",
		check = "checkbox-minimal", checkOn = "checkmark-minimal",
		slider = { "Minimal_SliderBar_Left", "_Minimal_SliderBar_Middle", "Minimal_SliderBar_Right" }, slThumb = "Minimal_SliderBar_Button",
		ddArrow = "common-dropdown-a-button",
		field = { "common-search-border-left", "common-search-border-middle", "common-search-border-right" },
		button = { "128-RedButton-Left", "_128-RedButton-Center", "128-RedButton-Right" },
		buttonDown = { "128-RedButton-Left-Pressed", "_128-RedButton-Center-Pressed", "128-RedButton-Right-Pressed" },
		buttonOff = { "128-RedButton-Left-Disabled", "_128-RedButton-Center-Disabled", "128-RedButton-Right-Disabled" },
		buttonLit = "128-RedButton-Highlight",
		close = "RedButton-Exit", closeDown = "RedButton-exit-pressed",
		plate = "common-button-tertiary-square-normal", plateHover = "common-button-tertiary-square-hover",
		header = "UI-QuestTracker-Primary-Objective-Header",
		headerBar = "ui-damagemeters-header-bar",
		status = { bg = "ui-damagemeters-bar-shadowbg", edge = "ui-damagemeters-bar-shadowedge" },
	},
	classic = {
		source = "file",
		tab = { "tab" }, tabActive = { "tabActive" },
		check = "check", checkOn = "checkOn",
		slThumb = "slThumb",
		ddArrow = "ddArrow",
		field = "field",
		close = "close", closeDown = "closeDown",
		prev = "prev", next = "next",
		rowLit = "rowLit", selected = "selected",
		header = false,
	},
}
Theme.KITS = KITS

-- The kit of the skin in use, or nil (the house style, Halo, Hearth).
function Theme.Kit()
	return KITS[Theme.SkinKey()]
end

---------------------------------------------------------------------------
-- Art: one named piece of a kit -> file, coordinates and size
---------------------------------------------------------------------------

local function region(kit, name)
	if not name then return nil end
	if name == "rock" then return "Interface\\FrameGeneral\\UI-Background-Rock", 0, 1, 0, 1, 256, 256 end
	if kit.source == "file" then
		local a = CLASSIC[name]
		if a then return a[1], a[4], a[5], a[6], a[7], a[2], a[3] end
	elseif kit.source == "retail" then
		local a = ns.GameArt and ns.GameArt[name]
		if a then return a[1], a[4], a[5], a[6], a[7], a[2], a[3] end
	else
		local info = C_Texture and C_Texture.GetAtlasInfo and C_Texture.GetAtlasInfo(name)
		if info then
			return info.file or info.filename, info.leftTexCoord, info.rightTexCoord, info.topTexCoord, info.bottomTexCoord, info.width, info.height
		end
	end
end
Theme.KitRegion = region

-- Draw `name` on texture t, or the part of it between fractions u0..u1,
-- v0..v1 of its box. -> width, height of the whole piece (nil: not there).
local function draw(t, kit, name, u0, u1, v0, v1)
	local file, l, r, tp, b, w, h = region(kit, name)
	if not file then
		t:Hide()
		return nil
	end
	t:SetTexture(file)
	u0, u1, v0, v1 = u0 or 0, u1 or 1, v0 or 0, v1 or 1
	local du, dv = r - l, b - tp
	t:SetTexCoord(l + du * u0, l + du * u1, tp + dv * v0, tp + dv * v1)
	t:SetVertexColor(1, 1, 1, 1)
	t:Show()
	return w, h
end
Theme.KitDraw = draw

-- frame.psSkin.kit[key]: textures (and frames) a kit painted on a frame,
-- made once and kept for every later paint.
local function store(f)
	f.psSkin = f.psSkin or {}
	local k = f.psSkin.kit
	if not k then
		k = {}
		f.psSkin.kit = k
	end
	return k
end

local function tex(f, key, layer, sub, host)
	local k = store(f)
	local t = k[key]
	if not t then
		t = (host or f):CreateTexture(nil, layer or "BACKGROUND", nil, sub or -6)
		k[key] = t
	end
	return t
end

-- A child frame over (or under) f for art that must cover the frame's own
-- children: a window's metal, the guide window's bronze line.
local function overlay(f, key, levelUp)
	local k = store(f)
	local o = k[key]
	if not o then
		o = CreateFrame("Frame", nil, f)
		o:EnableMouse(false)
		k[key] = o
	end
	o:SetFrameLevel(math.max(0, f:GetFrameLevel() + (levelUp or 6)))
	o:Show()
	return o
end

-- Nine pieces round a box: corners at their own size (times scale), edges
-- between them, the centre (when named) inside. out = { l, t, r, b }: how
-- far the art reaches past host's edges. sizes[i] = { w, h }, when given,
-- stands for piece i's own size (art whose atlas reports its 2x size).
local function nine(f, key, kit, names, host, out, scale, layer, sub, sizes)
	scale = scale or 1
	out = out or { 0, 0, 0, 0 }
	local k = store(f)
	local parts = k[key]
	if not parts then
		parts = {}
		for i = 1, 9 do parts[i] = (host or f):CreateTexture(nil, layer or "BORDER", nil, sub or 0) end
		k[key] = parts
	end
	local sz = {}
	for i = 1, 9 do
		local w, h
		if names[i] then w, h = draw(parts[i], kit, names[i]) else parts[i]:Hide() end
		if sizes and sizes[i] then w, h = sizes[i][1], sizes[i][2] end
		sz[i] = { (w or 0) * scale, (h or 0) * scale }
	end
	local anchor = host or f
	local p = parts
	for i = 1, 9 do p[i]:ClearAllPoints() end
	p[1]:SetPoint("TOPLEFT", anchor, "TOPLEFT", -out[1], out[2]); p[1]:SetSize(sz[1][1], sz[1][2])
	p[3]:SetPoint("TOPRIGHT", anchor, "TOPRIGHT", out[3], out[2]); p[3]:SetSize(sz[3][1], sz[3][2])
	p[7]:SetPoint("BOTTOMLEFT", anchor, "BOTTOMLEFT", -out[1], -out[4]); p[7]:SetSize(sz[7][1], sz[7][2])
	p[9]:SetPoint("BOTTOMRIGHT", anchor, "BOTTOMRIGHT", out[3], -out[4]); p[9]:SetSize(sz[9][1], sz[9][2])
	p[2]:SetPoint("TOPLEFT", p[1], "TOPRIGHT"); p[2]:SetPoint("TOPRIGHT", p[3], "TOPLEFT"); p[2]:SetHeight(sz[2][2])
	p[8]:SetPoint("BOTTOMLEFT", p[7], "BOTTOMRIGHT"); p[8]:SetPoint("BOTTOMRIGHT", p[9], "BOTTOMLEFT"); p[8]:SetHeight(sz[8][2])
	p[4]:SetPoint("TOPLEFT", p[1], "BOTTOMLEFT"); p[4]:SetPoint("BOTTOMLEFT", p[7], "TOPLEFT"); p[4]:SetWidth(sz[4][1])
	p[6]:SetPoint("TOPRIGHT", p[3], "BOTTOMRIGHT"); p[6]:SetPoint("BOTTOMRIGHT", p[9], "TOPRIGHT"); p[6]:SetWidth(sz[6][1])
	p[5]:SetPoint("TOPLEFT", p[1], "BOTTOMRIGHT"); p[5]:SetPoint("BOTTOMRIGHT", p[9], "TOPLEFT")
	return parts
end

-- One piece of art cut into nine: corners `cu` x `cv` of its box (fractions),
-- drawn `cw` x `ch` units.
local function nineOf(f, key, kit, name, cu, cv, cw, ch, host, out, layer, sub, noCentre)
	out = out or { 0, 0, 0, 0 }
	local k = store(f)
	local parts = k[key]
	if not parts then
		parts = {}
		for i = 1, 9 do parts[i] = (host or f):CreateTexture(nil, layer or "BORDER", nil, sub or 0) end
		k[key] = parts
	end
	local us = { { 0, cu }, { cu, 1 - cu }, { 1 - cu, 1 } }
	local vs = { { 0, cv }, { cv, 1 - cv }, { 1 - cv, 1 } }
	for row = 1, 3 do
		for col = 1, 3 do
			local i = (row - 1) * 3 + col
			draw(parts[i], kit, name, us[col][1], us[col][2], vs[row][1], vs[row][2])
		end
	end
	if noCentre then parts[5]:Hide() end
	local anchor = host or f
	local p = parts
	for i = 1, 9 do p[i]:ClearAllPoints() end
	p[1]:SetPoint("TOPLEFT", anchor, "TOPLEFT", -out[1], out[2]); p[1]:SetSize(cw, ch)
	p[3]:SetPoint("TOPRIGHT", anchor, "TOPRIGHT", out[3], out[2]); p[3]:SetSize(cw, ch)
	p[7]:SetPoint("BOTTOMLEFT", anchor, "BOTTOMLEFT", -out[1], -out[4]); p[7]:SetSize(cw, ch)
	p[9]:SetPoint("BOTTOMRIGHT", anchor, "BOTTOMRIGHT", out[3], -out[4]); p[9]:SetSize(cw, ch)
	p[2]:SetPoint("TOPLEFT", p[1], "TOPRIGHT"); p[2]:SetPoint("BOTTOMRIGHT", p[3], "BOTTOMLEFT")
	p[8]:SetPoint("TOPLEFT", p[7], "TOPRIGHT"); p[8]:SetPoint("BOTTOMRIGHT", p[9], "BOTTOMLEFT")
	p[4]:SetPoint("TOPLEFT", p[1], "BOTTOMLEFT"); p[4]:SetPoint("BOTTOMRIGHT", p[7], "TOPRIGHT")
	p[6]:SetPoint("TOPLEFT", p[3], "BOTTOMLEFT"); p[6]:SetPoint("BOTTOMRIGHT", p[9], "TOPRIGHT")
	p[5]:SetPoint("TOPLEFT", p[1], "BOTTOMRIGHT"); p[5]:SetPoint("BOTTOMRIGHT", p[9], "TOPLEFT")
	return parts
end
Theme.KitNineOf = nineOf

-- Three pieces across a box (left, middle, right): the ends `capW` units
-- wide (their art's aspect kept when capW is nil), the middle stretched.
-- names: { left, middle, right } names, or one name cut at `cut` (fraction).
local function three(f, key, kit, names, host, capW, cut, layer, sub)
	local k = store(f)
	local parts = k[key]
	if not parts then
		parts = {}
		for i = 1, 3 do parts[i] = (host or f):CreateTexture(nil, layer or "BACKGROUND", nil, sub or -5) end
		k[key] = parts
	end
	local anchor = host or f
	local h = anchor:GetHeight()
	local wl, hl
	if type(names) == "string" or #names == 1 then
		local name = type(names) == "string" and names or names[1]
		cut = cut or 0.15
		wl, hl = draw(parts[1], kit, name, 0, cut, 0, 1)
		draw(parts[2], kit, name, cut, 1 - cut, 0, 1)
		draw(parts[3], kit, name, 1 - cut, 1, 0, 1)
		if wl then wl = wl * cut end
	else
		wl, hl = draw(parts[1], kit, names[1])
		draw(parts[2], kit, names[2])
		local wr, hr = draw(parts[3], kit, names[3])
		-- The 128 button's right end is its long run of red: keep only the
		-- end as wide as the left cap.
		if wr and wl and wr > wl * 1.5 then
			draw(parts[3], kit, names[3], 1 - wl / wr, 1, 0, 1)
		end
	end
	local cw = capW or ((wl and hl and hl > 0 and h > 0) and wl * h / hl) or 8
	local p = parts
	for i = 1, 3 do p[i]:ClearAllPoints() end
	p[1]:SetPoint("TOPLEFT", anchor, "TOPLEFT"); p[1]:SetPoint("BOTTOMLEFT", anchor, "BOTTOMLEFT"); p[1]:SetWidth(cw)
	p[3]:SetPoint("TOPRIGHT", anchor, "TOPRIGHT"); p[3]:SetPoint("BOTTOMRIGHT", anchor, "BOTTOMRIGHT"); p[3]:SetWidth(cw)
	p[2]:SetPoint("TOPLEFT", p[1], "TOPRIGHT"); p[2]:SetPoint("BOTTOMRIGHT", p[3], "BOTTOMLEFT")
	return parts
end
Theme.KitThree = three

local function hideKey(f, key)
	local k = f.psSkin and f.psSkin.kit
	local v = k and k[key]
	if not v then return end
	if v.Hide then v:Hide() else for _, t in pairs(v) do if t and t.Hide then t:Hide() end end end
end
Theme.KitHide = hideKey

-- A backdrop of the classic files (BackdropTemplate), under f's content.
local function backdrop(f, key, spec, r, g, b, a, out, levelUp)
	local k = store(f)
	local o = k[key]
	if not o then
		o = CreateFrame("Frame", nil, f, BackdropTemplateMixin and "BackdropTemplate" or nil)
		o:EnableMouse(false)
		k[key] = o
	end
	out = out or 0
	o:ClearAllPoints()
	o:SetPoint("TOPLEFT", f, "TOPLEFT", -out, out)
	o:SetPoint("BOTTOMRIGHT", f, "BOTTOMRIGHT", out, -out)
	o:SetFrameLevel(math.max(0, f:GetFrameLevel() + (levelUp or 0)))
	if o.SetBackdrop then
		o:SetBackdrop(spec)
		o:SetBackdropColor(r or 0, g or 0, b or 0, a or 1)
		if o.SetBackdropBorderColor then o:SetBackdropBorderColor(1, 1, 1, 1) end
	end
	o:Show()
	return o
end

local DIALOG = { bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background", edgeFile = "Interface\\DialogFrame\\UI-DialogBox-Border",
	tile = true, tileSize = 32, edgeSize = 32, insets = { left = 11, right = 12, top = 12, bottom = 11 } }
local TOOLTIP = { bgFile = "Interface\\Tooltips\\UI-Tooltip-Background", edgeFile = "Interface\\Tooltips\\UI-Tooltip-Border",
	tile = true, tileSize = 16, edgeSize = 16, insets = { left = 4, right = 4, top = 4, bottom = 4 } }
local SLIDER = { bgFile = "Interface\\Buttons\\UI-SliderBar-Background", edgeFile = "Interface\\Buttons\\UI-SliderBar-Border",
	tile = true, tileSize = 8, edgeSize = 8, insets = { left = 3, right = 3, top = 6, bottom = 6 } }
Theme.CLASSIC_SLIDER = SLIDER
Theme.CLASSIC_TOOLTIP = TOOLTIP

-- The chat tab's 5-unit rim (corners 5 x 5, the bottom ones the top ones
-- flipped; edges stretched between them), cut from its 64 x 32 sheet.
local RIM = {
	{ "TOPLEFT", 0.03125, 0.109375, 0.28125, 0.4375 }, { "TOPRIGHT", 0.890625, 0.96875, 0.28125, 0.4375 },
	{ "BOTTOMLEFT", 0.03125, 0.109375, 0.4375, 0.28125 }, { "BOTTOMRIGHT", 0.890625, 0.96875, 0.4375, 0.28125 },
	{ "TOP", 0.375, 0.5, 0.28125, 0.4375 }, { "BOTTOM", 0.375, 0.5, 0.4375, 0.28125 },
	{ "LEFT", 0.03125, 0.109375, 0.625, 0.75 }, { "RIGHT", 0.890625, 0.96875, 0.625, 0.75 },
}
local function rim(f, host)
	local k = store(f)
	local parts = k.rim
	if not parts then
		parts = {}
		for i = 1, 8 do
			local t = host:CreateTexture(nil, "BORDER", nil, 1)
			t:SetTexture(CLASSIC.rim[1])
			t:SetTexCoord(RIM[i][2], RIM[i][3], RIM[i][4], RIM[i][5])
			parts[i] = t
		end
		local E = 5
		for i = 1, 4 do parts[i]:SetSize(E, E); parts[i]:SetPoint(RIM[i][1], host, RIM[i][1]) end
		parts[5]:SetPoint("TOPLEFT", parts[1], "TOPRIGHT"); parts[5]:SetPoint("BOTTOMRIGHT", parts[2], "BOTTOMLEFT")
		parts[6]:SetPoint("TOPLEFT", parts[3], "TOPRIGHT"); parts[6]:SetPoint("BOTTOMRIGHT", parts[4], "BOTTOMLEFT")
		parts[7]:SetPoint("TOPLEFT", parts[1], "BOTTOMLEFT"); parts[7]:SetPoint("BOTTOMRIGHT", parts[3], "TOPRIGHT")
		parts[8]:SetPoint("TOPLEFT", parts[2], "BOTTOMLEFT"); parts[8]:SetPoint("BOTTOMRIGHT", parts[4], "TOPRIGHT")
		k.rim = parts
	end
	for i = 1, 8 do parts[i]:Show() end
end

---------------------------------------------------------------------------
-- Paints
---------------------------------------------------------------------------

-- The window title on a big window's metal bar or classic header plate.
local function windowTitle(f, host, kit, y)
	local k = store(f)
	local fs = k.title
	if not fs then
		fs = host:CreateFontString(nil, "OVERLAY")
		Theme.Font(fs, "label")
		k.title = fs
	end
	fs:SetParent(host)
	fs:ClearAllPoints()
	fs:SetPoint("CENTER", f, "TOP", 0, y)
	fs:SetText(f.psTitle or "Polestar")
	fs:SetTextColor(Theme.Color("title"))
	fs:Show()
end

-- A body fill inside the frame's rect: the house fill's texture on f.
local function body(f, r, g, b, a, inset)
	local t = P.fill(f)
	f.psSkin.kitFill = true
	t:ClearAllPoints()
	inset = inset or 0
	t:SetPoint("TOPLEFT", f, "TOPLEFT", inset, -inset)
	t:SetPoint("BOTTOMRIGHT", f, "BOTTOMRIGHT", -inset, inset)
	t:SetVertexColor(r, g, b, a)
	return t
end

local function opacity(f)
	return math.min(1, (f.psBgAlpha or Theme.GroundAlpha()) / 0.94)
end

-- The guide window.
local GUIDE = {
	forever = function(f, kit)
		local a = opacity(f)
		body(f, 0, 0, 0, 0.96 * a, 3)
		-- The micro menu box's bronze line (55 units, its chamfered corners
		-- 12), its line 3 units in from the art's edge: laid 3 out so the
		-- line runs on the window's edge.
		local o = overlay(f, "edge", 6)
		o:SetAllPoints(f)
		nineOf(f, "slim", kit, kit.slim, 24 / 110, 24 / 110, 12, 12, o, { 3, 3, 3, 3 }, "BORDER", 0)
	end,
	blizzard = function(f, kit)
		local a = opacity(f)
		local t = body(f, 0, 0, 0, 0.96 * a)
		t:SetPoint("TOPLEFT", f, "TOPLEFT", 0, -20)
		local band = tex(f, "band", "BACKGROUND", -7)
		band:ClearAllPoints()
		band:SetPoint("TOPLEFT", f, "TOPLEFT")
		band:SetPoint("TOPRIGHT", f, "TOPRIGHT")
		band:SetHeight(20)
		band:SetTexture(Theme.Media("white"))
		band:SetVertexColor(1, 1, 1, 1)
		if band.SetGradient and CreateColor then
			band:SetGradient("VERTICAL", CreateColor(0, 0, 0, 0.96 * a), CreateColor(0, 0, 0, 0.48 * a))
		else
			band:SetVertexColor(0, 0, 0, 0.8 * a)
		end
		band:Show()
	end,
	classic = function(f, kit)
		local a = opacity(f)
		local t = body(f, 0.063, 0.063, 0.063, 0.85 * a, 3)
		t:SetTexture(CLASSIC.tile[1], "REPEAT", "REPEAT")
		if t.SetHorizTile then t:SetHorizTile(true); t:SetVertTile(true) end
		local o = overlay(f, "edge", 6)
		o:SetAllPoints(f)
		rim(f, o)
	end,
}

-- The big windows (the Shell's: options, the picker, the hub; and the
-- dialogs).
local BIG = {
	forever = function(f, kit)
		local a = opacity(f)
		local t = body(f, 1, 1, 1, a)
		local file, l, r, tp, b = region(kit, kit.bigBg)
		if file then
			t:SetTexture(file)
			t:SetTexCoord(l, r, tp, b)
			t:SetVertexColor(0.85, 0.85, 0.85, a)
		else
			t:SetTexture(Theme.Media("white"))
			t:SetVertexColor(0.04, 0.03, 0.02, 0.97 * a)
		end
		local o = overlay(f, "edge", 8)
		o:SetAllPoints(f)
		nine(f, "metal", kit, kit.metal, o, kit.metalOut, 1, "BORDER", 0, kit.metalSize)
		windowTitle(f, o, kit, kit.titleY)
	end,
	blizzard = function(f, kit)
		local a = opacity(f)
		local t = body(f, 1, 1, 1, a)
		local file = region(kit, "rock")
		t:SetTexture(file, "REPEAT", "REPEAT")
		if t.SetHorizTile then t:SetHorizTile(true); t:SetVertTile(true) end
		t:SetTexCoord(0, 1, 0, 1)
		t:SetVertexColor(0.55, 0.55, 0.55, a)
		local o = overlay(f, "edge", 8)
		o:SetAllPoints(f)
		nine(f, "metal", kit, kit.metal, o, kit.metalOut, 1, "BORDER", 0, kit.metalSize)
		windowTitle(f, o, kit, kit.titleY)
	end,
	classic = function(f, kit)
		local a = opacity(f)
		P.fill(f):Hide()
		backdrop(f, "dialog", DIALOG, 1, 1, 1, a, 8, 0)
		local o = overlay(f, "edge", 8)
		o:SetAllPoints(f)
		local k = store(f)
		local plate = k.plate
		if not plate then
			plate = CreateFrame("Frame", nil, o)
			k.plate = plate
		end
		plate:SetParent(o)
		plate:SetSize(220, 40)
		plate:ClearAllPoints()
		plate:SetPoint("CENTER", f, "TOP", 0, 6)
		plate:Show()
		three(f, "plateArt", kit, "header", plate, 30, 36 / 276, "ARTWORK", 0)
		windowTitle(f, o, kit, 6)
	end,
}

-- Menus, popups and the other panels: the game's tooltip.
local function panel(f, kit)
	if f.psBare then return P.bare(f) end
	if kit.source == "file" then
		P.fill(f):Hide()
		backdrop(f, "tipBd", TOOLTIP, 0, 0, 0, 0.92, 0, 0)
		return
	end
	body(f, 0, 0, 0, 0.92, 3)
	local o = overlay(f, "edge", 1)
	o:SetAllPoints(f)
	local parts = nine(f, "tip", kit, kit.tooltip, o, nil, 1, "BACKGROUND", 0)
	parts[5]:SetVertexColor(0, 0, 0, 0)
end

-- A text button: the game's red one.
local function redButton(f, kit)
	if kit.source == "file" then return P.redButton(f) end
	local enabled = not (f.IsEnabled and not f:IsEnabled())
	local set = enabled and (f.psPressed and kit.buttonDown or kit.button) or kit.buttonOff
	local parts = three(f, "red", kit, set, f, nil, nil, "BACKGROUND", -6)
	local hl = tex(f, "redLit", "HIGHLIGHT")
	draw(hl, kit, kit.buttonLit)
	hl:SetAllPoints(f)
	hl:SetBlendMode("ADD")
	hl:SetAlpha(0.5)
	return parts
end

local function card(f, kit, selected)
	if kit.card then
		local t = tex(f, "card", "BACKGROUND", -6)
		draw(t, kit, selected and kit.cardSelected or kit.card)
		t:SetAllPoints(f)
		local hl = tex(f, "cardLit", "HIGHLIGHT")
		draw(hl, kit, kit.cardHover)
		hl:SetAllPoints(f)
		return
	end
	if kit.source == "file" then
		P.fill(f):Hide()
		backdrop(f, "tipBd", TOOLTIP, 0, 0, 0, 0.5, 0, 0)
		P.hoverWash(f)
		return
	end
	body(f, 0, 0, 0, 0.45)
	Theme.Border(f, 1, 1, 1, 0.12)
	P.hoverWash(f)
end

local function field(f, kit)
	if kit.source == "file" then
		three(f, "field", kit, kit.field, f, 14, 16 / 107, "BACKGROUND", -6)
	else
		three(f, "field", kit, kit.field, f, 12, nil, "BACKGROUND", -6)
		local parts = store(f).field
		if kit.source == "retail" then for i = 1, 3 do parts[i]:SetDesaturated(true) end end
	end
	P.hoverWash(f)
end

local function checkbox(f, kit)
	P.house.checkbox(f)
	local d = f.psSkin
	d.box:Hide()
	local box = tex(f, "check", "ARTWORK", 0)
	local size = kit.source == "file" and 24 or 18
	draw(box, kit, kit.check)
	box:SetSize(size, size)
	box:ClearAllPoints()
	box:SetPoint("CENTER", f, "CENTER", 0, 0)
	if d.check then
		draw(d.check, kit, kit.checkOn)
		d.check:SetSize(size, size)
		d.check:SetVertexColor(1, 1, 1, 1)
	end
end

local function tab(f)
	Theme.KitTab(f, f.psSelected and true or false)
	local d = f.psSkin
	if d.bar then d.bar:Hide() end
	P.hoverWash(f):SetVertexColor(1, 1, 1, 0)
end

local function closeButton(f, kit)
	local t = tex(f, "close", "ARTWORK", 0)
	draw(t, kit, kit.close)
	t:SetAllPoints(f)
	if f.psSkin.glyph then f.psSkin.glyph:Hide() end
end

local function paints(name)
	local kit = KITS[name]
	return {
		window = function(f)
			if f.psBare then
				P.bare(f)
				for _, key in ipairs({ "edge", "band", "dialog" }) do hideKey(f, key) end
				return
			end
			P.hideBorder(f)
			if f.psShadow then f.psShadow:Hide() end
			if f.psGuide then GUIDE[name](f, kit) else BIG[name](f, kit) end
		end,
		panel = function(f) panel(f, kit) end,
		sidebar = function(f)
			P.fill(f):SetVertexColor(0, 0, 0, name == "classic" and 0 or 0.25)
		end,
		inset = function(f)
			P.fill(f):SetVertexColor(0, 0, 0, 0.45)
		end,
		button = function(f)
			if f.psTextButton then return redButton(f, kit) end
			card(f, kit)
		end,
		tile = function(f) card(f, kit) end,
		dropdown = function(f) field(f, kit) end,
		editbox = function(f)
			if kit.source == "file" then
				P.fill(f):Hide()
				backdrop(f, "tipBd", TOOLTIP, 0, 0, 0, 0.8, 0, 0)
			else
				three(f, "field", kit, kit.field, f, 12, nil, "BACKGROUND", -6)
			end
		end,
		checkbox = function(f) checkbox(f, kit) end,
		tab = function(f) tab(f, kit) end,
		close = function(f) closeButton(f, kit) end,
		scrollbar = function(f)
			local thumb = f.thumb or f.psThumb
			if thumb and thumb.SetVertexColor then thumb:SetVertexColor(0.85, 0.7, 0.35, 0.6) end
		end,
	}
end

for name in pairs(KITS) do Theme.SKIN_PAINT[name] = paints(name) end

---------------------------------------------------------------------------
-- Parts the widgets and the guide window ask for
---------------------------------------------------------------------------

-- An icon button in a kit: the close art, a plate under the glyph (or, in
-- Classic, the page arrows for ‹ ›). -> true when the kit drew it.
function Theme.KitIconButton(b)
	local kit = Theme.Kit()
	local framed = rawget(b, "psFramed")
	local isClose = rawget(b, "psIconName") == "close"
	if not kit or not (framed or isClose) then
		hideKey(b, "plate"); hideKey(b, "plateLit"); hideKey(b, "close")
		if b.Icon then b.Icon:SetAlpha(1) end
		return false
	end
	hideKey(b, "plate"); hideKey(b, "plateLit"); hideKey(b, "close")
	if isClose then
		local t = tex(b, "close", "ARTWORK", 1)
		draw(t, kit, kit.close)
		t:ClearAllPoints()
		t:SetPoint("CENTER", b, "CENTER", 0, 0)
		local s = kit.source == "file" and 30 or 22
		t:SetSize(s, s)
		b.Icon:SetAlpha(0)
		return true
	end
	if kit.source == "file" then
		if framed == "red" then
			local t = tex(b, "plate", "ARTWORK", 1)
			draw(t, kit, b.psIconName == "chevron-left" and kit.prev or kit.next)
			t:ClearAllPoints()
			t:SetPoint("CENTER", b, "CENTER", 0, 0)
			t:SetSize(b:GetWidth() + 4, b:GetHeight() + 4)
			b.Icon:SetAlpha(0)
		else
			b.Icon:SetAlpha(1)
		end
		return true
	end
	local t = tex(b, "plate", "BACKGROUND", -6)
	draw(t, kit, kit.plate)
	t:SetAllPoints(b)
	local hl = tex(b, "plateLit", "HIGHLIGHT")
	draw(hl, kit, kit.plateHover)
	hl:SetAllPoints(b)
	b.Icon:SetAlpha(1)
	return true
end

-- The check box in place of a toggle switch, on `host` round `anchor`.
-- -> the box texture (its .Check the tick)
function Theme.KitCheck(owner, host, anchor, on)
	local kit = Theme.Kit()
	local k = store(owner)
	local box = k.toggle
	if not box then
		box = host:CreateTexture(nil, "ARTWORK")
		box.Check = host:CreateTexture(nil, "OVERLAY")
		k.toggle, k.toggleCheck = box, box.Check
	end
	box:Show()
	local size = kit.source == "file" and 24 or 20
	draw(box, kit, kit.check)
	box:SetSize(size, size)
	box:ClearAllPoints()
	box:SetPoint("CENTER", anchor, "CENTER", 0, 0)
	draw(box.Check, kit, kit.checkOn)
	box.Check:SetAllPoints(box)
	box.Check:SetShown(on and true or false)
	return box
end

-- A slider's track and thumb. -> true when the kit drew them.
function Theme.KitSlider(owner, s, thumb)
	local kit = Theme.Kit()
	hideKey(owner, "trackBd")
	hideKey(owner, "trackHost")
	if not kit then return false end
	if kit.source == "file" then
		backdrop(owner, "trackBd", SLIDER, 1, 1, 1, 1, 0, 0)
		local o = store(owner).trackBd
		o:SetParent(s)
		o:ClearAllPoints()
		o:SetPoint("LEFT", s, "LEFT", 0, 0)
		o:SetPoint("RIGHT", s, "RIGHT", 0, 0)
		o:SetHeight(17)
		o:SetFrameLevel(s:GetFrameLevel())
		draw(thumb, kit, kit.slThumb)
		thumb:SetSize(32, 32)
		return true
	end
	local k = store(owner)
	local host = k.trackHost
	if not host then
		host = CreateFrame("Frame", nil, s)
		host:EnableMouse(false)
		k.trackHost = host
	end
	host:ClearAllPoints()
	host:SetPoint("LEFT", s, "LEFT", 0, 0)
	host:SetPoint("RIGHT", s, "RIGHT", 0, 0)
	host:SetHeight(17)
	host:SetFrameLevel(s:GetFrameLevel())
	host:Show()
	three(owner, "trackArt", kit, kit.slider, host, 11, nil, "BACKGROUND", 0)
	draw(thumb, kit, kit.slThumb)
	thumb:SetSize(20, 19)
	return true
end

-- A dropdown's arrow. -> true when the kit drew it.
function Theme.KitDropArrow(arrow)
	local kit = Theme.Kit()
	if not kit then return false end
	local size = kit.source == "file" and 26 or 20
	draw(arrow, kit, kit.ddArrow)
	arrow:SetSize(size, size)
	return true
end

-- The guide window's and the shell's tabs: the kit's tab art. -> true
function Theme.KitTab(b, active)
	local kit = Theme.Kit()
	if not kit then
		hideKey(b, "tab")
		return false
	end
	local file = kit.source == "file"
	local k = store(b)
	local host = k.tabHost
	if not host then
		host = CreateFrame("Frame", nil, b)
		host:EnableMouse(false)
		host:SetFrameLevel(math.max(0, b:GetFrameLevel() - 1))
		k.tabHost = host
	end
	host:ClearAllPoints()
	host:SetPoint("BOTTOMLEFT", b, "BOTTOMLEFT", 0, 0)
	host:SetPoint("BOTTOMRIGHT", b, "BOTTOMRIGHT", 0, 0)
	host:SetHeight(active and (file and 26 or 24) or (file and 21 or 21))
	host:Show()
	k.tab = host
	three(b, "tabArt", kit, active and kit.tabActive or kit.tab, host, file and 14 or 7, file and 16 / 112 or nil, "BACKGROUND", 0)
	return true
end

-- The highlight under the guide window's current goal (and a selected
-- navigation row): Forever's selected card, Blizzard's gold wash with its
-- edge, Classic's quest title highlight.
function Theme.KitRowLit(r, shown, key, inset)
	key = key or "rowLit"
	local kit = Theme.Kit()
	if not (kit and shown) then
		hideKey(r, key)
		hideKey(r, key .. "Edge")
		return false
	end
	local t = tex(r, key, "BACKGROUND", -4)
	t:ClearAllPoints()
	t:SetPoint("TOPLEFT", r, "TOPLEFT", inset or 4, 0)
	t:SetPoint("BOTTOMRIGHT", r, "BOTTOMRIGHT", -(inset or 4), 0)
	hideKey(r, key .. "Edge")
	if kit.source == "retail" then
		t:SetTexture(Theme.Media("white"))
		t:SetTexCoord(0, 1, 0, 1)
		t:SetVertexColor(1, 1, 1, 1)
		if t.SetGradient and CreateColor then
			t:SetGradient("HORIZONTAL", CreateColor(1, 0.82, 0, 0.2), CreateColor(1, 0.82, 0, 0))
		else
			t:SetVertexColor(1, 0.82, 0, 0.12)
		end
		t:Show()
		local e = tex(r, key .. "Edge", "BORDER", 0)
		e:SetTexture(Theme.Media("white"))
		e:SetVertexColor(1, 0.82, 0, 1)
		e:ClearAllPoints()
		e:SetPoint("TOPLEFT", t, "TOPLEFT")
		e:SetPoint("BOTTOMLEFT", t, "BOTTOMLEFT")
		e:SetWidth(2)
		e:Show()
		return true
	end
	draw(t, kit, (key == "navLit" and kit.selected) or kit.rowLit)
	if kit.source == "file" then t:SetBlendMode("ADD") end
	return true
end

-- The quest tracker's header behind the guide window's focus (Forever's
-- bronze rods, Blizzard's gold filigree). -> true when drawn
function Theme.KitHeader(f, shown)
	local kit = Theme.Kit()
	if not (kit and kit.header and shown) then
		hideKey(f, "header")
		return false
	end
	-- The band's own rows: 9..39 of its 40, its ends' rods 25 of its 300.
	local parts = three(f, "header", kit, kit.header, f, 12, 25 / 300, "BACKGROUND", -3)
	for i = 1, 3 do
		local t = parts[i]
		local _, l, r, tp, b = region(kit, kit.header)
		if l then
			local u0, u1 = ({ 0, 25 / 300, 1 - 25 / 300 })[i], ({ 25 / 300, 1 - 25 / 300, 1 })[i]
			local du, dv = r - l, b - tp
			t:SetTexCoord(l + du * u0, l + du * u1, tp + dv * 4 / 40, tp + dv * 39 / 40)
		end
	end
	return true
end

-- The guide window's tab strip ground: Blizzard's damage meter header bar.
function Theme.KitStrip(f, shown)
	local kit = Theme.Kit()
	if not (kit and kit.headerBar and shown) then
		hideKey(f, "strip")
		return false
	end
	local t = tex(f, "strip", "BACKGROUND", -6)
	draw(t, kit, kit.headerBar)
	t:SetAllPoints(f)
	return true
end

-- The guide window's progress bar in a kit, on StatusBar b (its Bg, a frame
-- piece). -> true when the kit drew it
function Theme.KitStatus(b)
	local kit = Theme.Kit()
	hideKey(b, "statusFrame")
	hideKey(b, "statusEdge")
	hideKey(b, "statusArt")
	hideKey(b, "statusNine")
	if not kit then return false end
	local fill = b:GetStatusBarTexture()
	if kit.source == "atlas" then
		local file, l, r, tp, bt = region(kit, kit.status.fill)
		if file then b:SetStatusBarTexture(file); fill = b:GetStatusBarTexture(); fill:SetTexCoord(l, r, tp, bt) end
		fill:SetVertexColor(1, 1, 1, 1)
		draw(b.Bg, kit, kit.status.bg)
		b.Bg:SetVertexColor(1, 1, 1, 1)
		local o = overlay(b, "statusFrame", 2)
		o:SetAllPoints(b)
		three(b, "statusArt", kit, kit.status.frame, o, 14, nil, "ARTWORK", 0)
		local parts = store(b).statusArt
		parts[1]:SetPoint("TOPLEFT", b, "TOPLEFT", -7, 6); parts[1]:SetPoint("BOTTOMLEFT", b, "BOTTOMLEFT", -7, -7)
		parts[3]:SetPoint("TOPRIGHT", b, "TOPRIGHT", 7, 6); parts[3]:SetPoint("BOTTOMRIGHT", b, "BOTTOMRIGHT", 7, -7)
	elseif kit.source == "retail" then
		b:SetStatusBarTexture("Interface\\TargetingFrame\\UI-StatusBar")
		fill = b:GetStatusBarTexture()
		fill:SetTexCoord(0, 1, 0, 1)
		fill:SetVertexColor(1, 0.67, 0, 1)
		draw(b.Bg, kit, kit.status.bg)
		local e = tex(b, "statusEdge", "OVERLAY", 6)
		draw(e, kit, kit.status.edge)
		e:ClearAllPoints()
		e:SetPoint("TOPLEFT", b, "TOPLEFT", -2, 2)
		e:SetPoint("BOTTOMRIGHT", b, "BOTTOMRIGHT", 2, -2)
	else
		b:SetStatusBarTexture(CLASSIC.statusFill[1])
		fill = b:GetStatusBarTexture()
		fill:SetTexCoord(0, 1, 0, 1)
		fill:SetVertexColor(0, 0.8, 0, 1)
		b.Bg:SetTexture(Theme.Media("white"))
		b.Bg:SetVertexColor(0, 0, 0, 0.5)
		local o = overlay(b, "statusFrame", 2)
		o:SetAllPoints(b)
		-- The cast bar frame at 60 % of its sheet: caps 19 wide, the bands
		-- 7 over and under the bar.
		nineOf(b, "statusNine", kit, "castbar", 32 / 224, 12 / 32, 19, 7, o, { 10, 7, 10, 7 }, "ARTWORK", 0, false)
		local parts = store(b).statusNine
		parts[5]:SetVertexColor(0, 0, 0, 0)
	end
	if b.psBorder then for i = 1, 4 do b.psBorder[i]:Hide() end end
	return true
end
