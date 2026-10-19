'use strict';
// Amounts of money as guides write them: `1g50s`, `7s`, `25c` or plain
// copper (`350`). Read by a turn-in's `money` modifier, the `money` goal and
// the `when money` predicate (parse.js, when.js).

const INT_RE = /^\d+$/;

// `money 1g50s` / `money 7s` / `money 350` (copper) -> copper | null.
function readMoney(text) {
	if (INT_RE.test(text)) return Number(text);
	const m = /^(?:(\d+)g)?(?:(\d+)s)?(?:(\d+)c)?$/i.exec(text);
	if (!m || !(m[1] || m[2] || m[3])) return null;
	return Number(m[1] || 0) * 10000 + Number(m[2] || 0) * 100 + Number(m[3] || 0);
}

module.exports = { readMoney };
