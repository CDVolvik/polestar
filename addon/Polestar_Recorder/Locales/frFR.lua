-- French (frFR): Polestar Recorder's interface strings.
-- Keys are the English strings exactly as the code writes them; a key
-- missing here, or commented out, shows in English. Grouped by the file that
-- first uses each key. docs/TRANSLATING.md explains the rest.

local _, ns = ...
if not (GetLocale and GetLocale() == "frFR") then return end
local L = ns.L

-- Commands.lua
-- L["this client exposes no talent tree API"] = ""
-- L["no active talent configuration (too low level?)"] = ""
-- L["the talent configuration has no trees"] = ""
-- L["the talent trees returned no nodes"] = ""
-- L["recording %s"] = ""
-- L["on"] = ""
-- L["off"] = ""
-- L["session %s: %d events (%d breadcrumbs), %d min"] = ""
-- L["%d events dropped by the per-session caps"] = ""
-- L["no session yet"] = ""
-- L["%d sessions stored, %d maps dumped"] = ""
-- L[", talents dumped"] = ""
-- L["this session: %s"] = ""
-- L["commands: /psrec on | off | mark <text> | maps | talents | legacy | factions | skills | clear"] = ""
-- L["usage: /psrec mark <text>"] = ""
-- L["recording is off; /psrec on first"] = ""
-- L["marked: %s"] = ""
-- L["mark not recorded (session cap reached)"] = ""
-- L["recorded %d maps"] = ""
-- L["no maps found (C_Map unavailable)"] = ""
-- L["talents not recorded: %s"] = ""
-- L["recorded %d talent nodes in %d tree(s) for %s"] = ""
-- L["recorded %d achievements in %d categories, %d major factions (Legacy renown %s), %d Legacy tree nodes"] = ""
-- L["factions not recorded: this client exposes no C_Reputation list"] = ""
-- L["recorded %d factions"] = ""
-- L["skills not recorded: this client exposes no C_SkillInfo list"] = ""
-- L["recorded %d skill lines"] = ""
-- L["all recordings cleared; new session %s"] = ""
-- L["this deletes every recorded session. Type |cffffd100/psrec clear confirm|r within %d seconds to proceed."] = ""
-- L["unknown command: %s"] = ""
