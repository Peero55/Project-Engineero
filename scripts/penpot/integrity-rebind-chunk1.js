/* Run inside Penpot plugin via MCP execute_code — Phase 1–2: token rebind + hex cleanup */
function norm(hex) {
  if (!hex || hex[0] !== '#') return null;
  let x = hex.slice(1).toLowerCase();
  if (x.length === 3) x = x.split('').map(function (c) { return c + c; }).join('');
  return '#' + x;
}
function walk(root, fn, d) {
  d = d || 0;
  fn(root, d);
  var ch = root.children;
  if (!ch) return;
  for (var i = 0; i < ch.length; i++) walk(ch[i], fn, d + 1);
}
var cat = penpot.library.local.tokens;
var hexToToken = {};
for (var si = 0; si < cat.sets.length; si++) {
  var set = cat.sets[si];
  if (!set.active) set.toggleActive();
  var toks = set.tokens;
  for (var ti = 0; ti < toks.length; ti++) {
    var t = toks[ti];
    if (t.type === 'color' && t.resolvedValue) hexToToken[norm(t.resolvedValue)] = t;
  }
}
var extraHex = {
  '#b6483e': 'feedback.damage',
  '#a63a32': 'accent.crimson',
  '#ff0000': 'accent.crimson',
  '#ffffff': '__WHITE__',
};
for (var eh in extraHex) {
  if (extraHex[eh] === '__WHITE__') continue;
  var tn = extraHex[eh];
  var tok = penpotUtils.findTokenByName(tn);
  if (tok) hexToToken[eh] = tok;
}
var stats = { fills: 0, strokes: 0, whiteKeep: 0, skipped: 0, missingHex: {}, errors: [] };
function allowWhite(shape, depth) {
  return shape.name === 'Root Frame' && depth <= 2;
}
function bindFill(shape, hex, depth) {
  var h = norm(hex);
  if (!h) return;
  if (h === '#ffffff' && allowWhite(shape, depth)) {
    stats.whiteKeep++;
    return;
  }
  if (h === '#ffffff') {
    h = '#f5ede0';
  }
  var tok = hexToToken[h];
  if (!tok) {
    stats.missingHex[h] = (stats.missingHex[h] || 0) + 1;
    return;
  }
  try {
    tok.applyToShapes([shape], ['fill']);
    stats.fills++;
  } catch (e) {
    stats.errors.push({ k: 'fill', h: h, msg: String(e.message || e) });
  }
}
function bindStroke(shape, hex, depth) {
  var h = norm(hex);
  if (!h) return;
  if (h === '#ffffff' && allowWhite(shape, depth)) {
    stats.whiteKeep++;
    return;
  }
  if (h === '#ffffff') {
    h = '#f5ede0';
  }
  var tok = hexToToken[h];
  if (!tok) {
    stats.missingHex[h] = (stats.missingHex[h] || 0) + 1;
    return;
  }
  try {
    tok.applyToShapes([shape], ['strokeColor']);
    stats.strokes++;
  } catch (e) {
    stats.errors.push({ k: 'stroke', h: h, msg: String(e.message || e) });
  }
}
var pages = penpotUtils.getPages();
for (var pi = 0; pi < pages.length; pi++) {
  var page = penpotUtils.getPageById(pages[pi].id);
  if (!page || !page.root) continue;
  walk(page.root, function (s, depth) {
    var fills = s.fills;
    if (fills && fills.length) {
      for (var fi = 0; fi < fills.length; fi++) {
        if (fills[fi].fillColor) bindFill(s, fills[fi].fillColor, depth);
      }
    }
    var sts = s.strokes;
    if (sts && sts.length) {
      for (var si = 0; si < sts.length; si++) {
        if (sts[si].strokeColor) bindStroke(s, sts[si].strokeColor, depth);
      }
    }
  });
}
return { stats: stats, hexMapSize: Object.keys(hexToToken).length };
