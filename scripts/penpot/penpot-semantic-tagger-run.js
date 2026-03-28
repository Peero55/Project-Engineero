/**
 * Legendary Hunts — semantic tagging for Penpot (penpot-semantic-tagger)
 *
 * Run via Penpot MCP execute_code (paste body) or load in a Penpot plugin.
 * Does NOT change layout, colors, or geometry — only metadata on shapes/components.
 *
 * Namespace: penpot-semantic-tagger
 * Key: semantic (JSON string per shape)
 *
 * Contract: each tag includes role, semanticComponent, reactComponent, and variant/state when applicable.
 * Penpot asset names may differ from semantic names; semanticComponent is the normalized name.
 */

var NS = 'penpot-semantic-tagger';

/** Penpot MCP: penpotUtils is a function — call it to get getPages/getPageById helpers */
var util = typeof penpotUtils === 'function' ? penpotUtils() : penpotUtils;

/** Source paths for tooling (not required for strict contract) */
var SOURCE = {
  Panel: 'components/fantasy/ui/Panel.tsx',
  HealthBar: 'components/fantasy/ui/HealthBar.tsx',
  XPBar: 'components/fantasy/ui/XPBar.tsx',
  PlayerInfoBar: 'components/fantasy/layout/PlayerInfoBar.tsx',
  EnemyEncounterPanel: 'components/fantasy/game/EnemyEncounterPanel.tsx',
  PlayerBattleVitals: 'components/fantasy/game/PlayerBattleVitals.tsx',
  QuestionPanel: 'components/fantasy/game/QuestionPanel.tsx',
  AnswerOption: 'components/fantasy/game/QuestionPanel.tsx',
  StrikeButton: 'components/fantasy/ui/Button.tsx',
  AttackBar: 'components/fantasy/game/AttackBar.tsx',
  EncounterScreen: 'components/fantasy/game/EncounterScreen.tsx',
  ScreenShell: 'components/fantasy/layout/ScreenShell.tsx',
};

function tagEntity(entity, obj) {
  try {
    entity.setSharedPluginData(NS, 'semantic', JSON.stringify(obj));
  } catch (e) {
    return String(e.message || e);
  }
  return null;
}

function walk(root, fn, depth) {
  depth = depth || 0;
  fn(root, depth);
  var ch = root.children;
  if (!ch) return;
  for (var i = 0; i < ch.length; i++) walk(ch[i], fn, depth + 1);
}

/**
 * Maps Penpot library component name → logical kind for Phase 1 + tagging.
 * Supports legacy names until assets are renamed.
 */
function componentByPenpotName(name) {
  if (name.indexOf('Panel') === 0 || name.indexOf('Panel —') === 0 || name.indexOf('Panel /') === 0) return 'Panel';
  if (name.indexOf('HealthBar') === 0 || name.indexOf('HealthBar /') === 0) return 'HealthBar';
  if (name === 'StrikeButton') return 'StrikeButton';
  if (name === 'PlayerInfoBar' || name === 'BattleHeader') return 'PlayerInfoBar';
  if (name === 'EnemyEncounterPanel' || name === 'EnemyCard') return 'EnemyEncounterPanel';
  if (name === 'PlayerBattleVitals' || name === 'PlayerVitals') return 'PlayerBattleVitals';
  if (name === 'XPBar') return 'XPBar';
  if (name === 'QuestionPanel') return 'QuestionPanel';
  if (name === 'AnswerOption') return 'AnswerOption';
  if (name === 'StoneFrame') return 'StoneFrame';
  return null;
}

function panelVariantFromName(name) {
  if (name.indexOf('stoneFrame') >= 0 || name.indexOf('stone') >= 0) return 'stoneFrame';
  if (name.indexOf('default') >= 0) return 'default';
  if (name.indexOf('battle') >= 0) return 'battle';
  if (name.indexOf('glow') >= 0) return 'glow';
  return 'default';
}

function healthContextFromName(name) {
  if (name.indexOf('player') >= 0) return 'player';
  if (name.indexOf('enemy') >= 0) return 'enemy';
  return 'unknown';
}

// --- Phase 1: library component path/name alignment (normalized semantic names) ---
var report = { renamed: [], tagErrors: [], screenTags: [], instanceTags: 0 };

var lib = penpot.library.local;
for (var ci = 0; ci < lib.components.length; ci++) {
  var comp = lib.components[ci];
  var logical = componentByPenpotName(comp.name);
  if (!logical) continue;

  if (logical === 'Panel') {
    comp.path = 'Layout';
    comp.name = 'Panel / ' + panelVariantFromName(comp.name);
    report.renamed.push({ id: comp.id, to: comp.path + ' / ' + comp.name });
  } else if (logical === 'HealthBar') {
    comp.path = 'Data';
    comp.name = 'HealthBar / ' + healthContextFromName(comp.name);
    report.renamed.push({ id: comp.id, to: comp.path + ' / ' + comp.name });
  } else if (logical === 'StrikeButton') {
    comp.path = 'Battle';
    comp.name = 'StrikeButton';
    report.renamed.push({ id: comp.id, note: 'variant group; tiers in semantic tags' });
  } else if (logical === 'AnswerOption') {
    comp.path = 'Input';
    comp.name = 'AnswerOption';
    report.renamed.push({ id: comp.id, note: 'variant group; states in semantic tags' });
  } else if (logical === 'PlayerInfoBar') {
    comp.path = 'Battle';
    comp.name = 'PlayerInfoBar';
  } else if (logical === 'EnemyEncounterPanel') {
    comp.path = 'Battle';
    comp.name = 'EnemyEncounterPanel';
  } else if (logical === 'PlayerBattleVitals') {
    comp.path = 'Battle';
    comp.name = 'PlayerBattleVitals';
  } else if (logical === 'XPBar') {
    comp.path = 'Data';
    comp.name = 'XPBar';
  } else if (logical === 'QuestionPanel') {
    comp.path = 'Input';
    comp.name = 'QuestionPanel';
  } else if (logical === 'StoneFrame') {
    comp.path = 'Layout';
    comp.name = 'Panel / stoneFrame';
    report.renamed.push({ id: comp.id, to: 'Layout / Panel / stoneFrame', note: 'semantic maps to Panel' });
  }
}

for (var vk = 0; vk < lib.components.length; vk++) {
  var vcand = lib.components[vk];
  if (typeof vcand.isVariant !== 'function' || !vcand.isVariant() || !vcand.variants) continue;
  if (vcand.name === 'StrikeButton') {
    var vlistS = vcand.variants.variantComponents();
    var tOrder = ['light', 'medium', 'heavy', 'ultimate', 'disabled'];
    for (var ti = 0; ti < vlistS.length; ti++) {
      var tier =
        (vlistS[ti].variantProps && vlistS[ti].variantProps.state) || tOrder[ti] || 'light';
      vlistS[ti].path = 'Battle';
      vlistS[ti].name = 'StrikeButton / ' + tier;
      report.renamed.push({ id: vlistS[ti].id, to: 'Battle / StrikeButton / ' + tier });
    }
  }
  if (vcand.name === 'AnswerOption') {
    var vlistA = vcand.variants.variantComponents();
    var sOrder = ['default', 'selected', 'correct', 'incorrect', 'disabled'];
    for (var sj = 0; sj < vlistA.length; sj++) {
      var stt =
        (vlistA[sj].variantProps && vlistA[sj].variantProps.state) || sOrder[sj] || 'default';
      vlistA[sj].path = 'Input';
      vlistA[sj].name = 'AnswerOption / ' + stt;
      report.renamed.push({ id: vlistA[sj].id, to: 'Input / AnswerOption / ' + stt });
    }
  }
}

function tagComponentMain(comp, base) {
  var main = comp.mainInstance();
  if (!main) return;
  var err = tagEntity(main, base);
  if (err) report.tagErrors.push({ where: 'main ' + comp.name, err: err });
}

for (var cj = 0; cj < lib.components.length; cj++) {
  var c = lib.components[cj];
  var logic = componentByPenpotName(c.name.replace(/^Panel \/ /, 'Panel — ').replace(/^HealthBar \/ /, 'HealthBar — '));
  var pn = c.name;

  if (pn.indexOf('Panel') === 0 || pn.indexOf('Panel /') === 0) {
    var pv = panelVariantFromName(pn);
    tagComponentMain(c, {
      role: 'container',
      semanticComponent: 'Panel',
      reactComponent: 'Panel',
      variant: pv,
      reactSource: SOURCE.Panel,
    });
  } else if (pn.indexOf('HealthBar') === 0 || pn.indexOf('HealthBar /') === 0) {
    var ctx = healthContextFromName(pn);
    tagComponentMain(c, {
      role: 'meter',
      semanticComponent: 'HealthBar',
      reactComponent: 'HealthBar',
      variant: ctx,
      meterType: 'hp',
      entityType: ctx === 'enemy' ? 'enemy' : 'player',
      data: 'currentHP',
      reactSource: SOURCE.HealthBar,
      implementationNote: 'HP meter used inside EnemyEncounterPanel and PlayerBattleVitals',
    });
  } else if (pn === 'StrikeButton' && typeof c.isVariant === 'function' && c.isVariant()) {
    var vc = c.variants ? c.variants.variantComponents() : [];
    for (var vi = 0; vi < vc.length; vi++) {
      var tier = (vc[vi].variantProps && vc[vi].variantProps.state) || ['light', 'medium', 'heavy', 'ultimate', 'disabled'][vi];
      var m = vc[vi].mainInstance();
      if (!m) continue;
      var e = tagEntity(m, {
        role: 'action',
        semanticComponent: 'StrikeButton',
        reactComponent: 'StoneButton',
        semanticParent: 'AttackBar',
        reactParent: 'AttackBar',
        variant: tier,
        actionType: 'attack',
        tier: tier,
        reactSource: SOURCE.StrikeButton,
        reactParentSource: SOURCE.AttackBar,
        event: 'submitAttack',
        affects: 'enemyHP',
      });
      if (e) report.tagErrors.push({ where: 'StrikeButton ' + tier, err: e });
    }
  } else if (pn === 'AnswerOption' && typeof c.isVariant === 'function' && c.isVariant()) {
    var avc = c.variants ? c.variants.variantComponents() : [];
    var states = ['default', 'selected', 'correct', 'incorrect', 'disabled'];
    for (var ai = 0; ai < avc.length; ai++) {
      var st = (avc[ai].variantProps && avc[ai].variantProps.state) || states[ai];
      var am = avc[ai].mainInstance();
      if (!am) continue;
      var e2 = tagEntity(am, {
        role: 'input',
        semanticComponent: 'AnswerOption',
        reactComponent: 'QuestionPanel',
        state: st,
        inputType: 'choice',
        variant: st,
        reactSource: SOURCE.AnswerOption,
        implementationNote: 'Answer choices are rendered inside QuestionPanel in current implementation',
        event: 'selectAnswer',
        affects: 'battleState',
        data: 'answer',
      });
      if (e2) report.tagErrors.push({ where: 'AnswerOption ' + st, err: e2 });
    }
  } else if (pn.indexOf('PlayerInfoBar') >= 0 || pn.indexOf('BattleHeader') >= 0) {
    tagComponentMain(c, {
      role: 'header',
      semanticComponent: 'PlayerInfoBar',
      reactComponent: 'PlayerInfoBar',
      reactSource: SOURCE.PlayerInfoBar,
    });
  } else if (pn.indexOf('EnemyEncounterPanel') >= 0 || pn.indexOf('EnemyCard') >= 0) {
    tagComponentMain(c, {
      role: 'entity',
      semanticComponent: 'EnemyEncounterPanel',
      reactComponent: 'EnemyEncounterPanel',
      entityType: 'enemy',
      data: 'enemy',
      reactSource: SOURCE.EnemyEncounterPanel,
    });
  } else if (pn.indexOf('PlayerBattleVitals') >= 0 || pn.indexOf('PlayerVitals') >= 0) {
    tagComponentMain(c, {
      role: 'entity',
      semanticComponent: 'PlayerBattleVitals',
      reactComponent: 'PlayerBattleVitals',
      entityType: 'player',
      data: 'player',
      reactSource: SOURCE.PlayerBattleVitals,
    });
  } else if (pn.indexOf('XPBar') >= 0) {
    tagComponentMain(c, {
      role: 'meter',
      semanticComponent: 'XPBar',
      reactComponent: 'XPBar',
      meterType: 'xp',
      data: 'currentXP',
      reactSource: SOURCE.XPBar,
    });
  } else if (pn.indexOf('QuestionPanel') >= 0) {
    tagComponentMain(c, {
      role: 'content',
      semanticComponent: 'QuestionPanel',
      reactComponent: 'QuestionPanel',
      data: 'question',
      reactSource: SOURCE.QuestionPanel,
    });
  } else if (pn.indexOf('StrikeButton /') === 0) {
    var tierPart = (pn.split(' / ')[1] || 'light').toLowerCase();
    tagComponentMain(c, {
      role: 'action',
      semanticComponent: 'StrikeButton',
      reactComponent: 'StoneButton',
      semanticParent: 'AttackBar',
      reactParent: 'AttackBar',
      variant: tierPart,
      tier: tierPart,
      actionType: 'attack',
      reactSource: SOURCE.StrikeButton,
      reactParentSource: SOURCE.AttackBar,
      event: 'submitAttack',
      affects: 'enemyHP',
    });
  } else if (pn.indexOf('AnswerOption /') === 0) {
    var stPart = (pn.split(' / ')[1] || 'default').toLowerCase();
    tagComponentMain(c, {
      role: 'input',
      semanticComponent: 'AnswerOption',
      reactComponent: 'QuestionPanel',
      state: stPart,
      variant: stPart,
      inputType: 'choice',
      reactSource: SOURCE.AnswerOption,
      implementationNote: 'Answer choices are rendered inside QuestionPanel in current implementation',
      event: 'selectAnswer',
      affects: 'battleState',
      data: 'answer',
    });
  } else if (pn.indexOf('StoneFrame') >= 0) {
    tagComponentMain(c, {
      role: 'container',
      semanticComponent: 'Panel',
      reactComponent: 'Panel',
      variant: 'stoneFrame',
      penpotAsset: 'StoneFrame',
      reactSource: SOURCE.Panel,
      implementationNote: 'Design asset StoneFrame; semantic Panel variant stoneFrame',
    });
  }
}

// --- Screens: standardized semantic names ---
var screenMap = [
  { re: /^Screen — Encounter Gate$/i, semanticComponent: 'EncounterGate', kind: 'battle' },
  { re: /^Screen — Battle Idle$/i, semanticComponent: 'BattleIdle', kind: 'battle' },
  { re: /^Screen — Battle Correct$/i, semanticComponent: 'BattleCorrect', kind: 'battle' },
  { re: /^Screen — Battle Wrong$/i, semanticComponent: 'BattleIncorrect', kind: 'battle', stateType: 'failure' },
  { re: /^Screen — Victory$/i, semanticComponent: 'BattleVictory', kind: 'battle', stateType: 'victory' },
  { re: /^Screen — Dashboard$/i, semanticComponent: 'Dashboard', kind: 'dashboard' },
  { re: /^Screen — Codex topic$/i, semanticComponent: 'CodexTopic', kind: 'codex' },
  { re: /^Screen — Explanation$/i, semanticComponent: 'Explanation', kind: 'codex' },
  { re: /^Screen — Hunt detail$/i, semanticComponent: 'HuntDetail', kind: 'hunts' },
];

var pages = util.getPages();
for (var pi = 0; pi < pages.length; pi++) {
  var page = util.getPageById(pages[pi].id);
  if (!page || !page.root) continue;
  walk(page.root, function (shape, depth) {
    if (shape.type !== 'board') return;
    for (var si = 0; si < screenMap.length; si++) {
      var sm = screenMap[si];
      if (!sm.re.test(shape.name || '')) continue;
      var payload = {
        role: 'screen',
        semanticComponent: sm.semanticComponent,
        reactComponent: sm.kind === 'battle' ? 'EncounterScreen' : 'ScreenShell',
        reactSource: sm.kind === 'battle' ? SOURCE.EncounterScreen : SOURCE.ScreenShell,
        screenKind: sm.kind,
        implementationNote:
          sm.kind === 'battle'
            ? 'Primary surface: EncounterScreen; layout wrapper in app: ScreenShell'
            : 'Primary surface: ScreenShell',
      };
      if (sm.stateType) {
        payload.state = sm.stateType;
      }
      var er = tagEntity(shape, payload);
      if (er) report.tagErrors.push({ where: shape.name, err: er });
      else report.screenTags.push(shape.name);
      break;
    }
  });
}

// --- Instance tags ---
for (var pi2 = 0; pi2 < pages.length; pi2++) {
  var pg = util.getPageById(pages[pi2].id);
  if (!pg || !pg.root) continue;
  walk(pg.root, function (shape) {
    if (!shape.isComponentRoot || !shape.isComponentRoot()) return;
    var lc = shape.component ? shape.component() : null;
    if (!lc) return;
    var baseName = lc.name || '';
    var sem = null;

    if (baseName.indexOf('Panel') === 0 || baseName.indexOf('Panel /') === 0) {
      sem = {
        role: 'container',
        semanticComponent: 'Panel',
        reactComponent: 'Panel',
        variant: panelVariantFromName(baseName),
        reactSource: SOURCE.Panel,
      };
      if (baseName.indexOf('stone') >= 0 || baseName.indexOf('stoneFrame') >= 0) {
        sem.penpotAsset = 'StoneFrame';
        sem.implementationNote = 'Design asset StoneFrame; semantic Panel variant stoneFrame';
      }
    } else if (baseName.indexOf('HealthBar') === 0 || baseName.indexOf('HealthBar /') === 0) {
      var hctx = healthContextFromName(baseName);
      sem = {
        role: 'meter',
        semanticComponent: 'HealthBar',
        reactComponent: 'HealthBar',
        variant: hctx,
        meterType: 'hp',
        entityType: hctx === 'enemy' ? 'enemy' : 'player',
        data: 'currentHP',
        reactSource: SOURCE.HealthBar,
      };
    } else if (baseName.indexOf('StrikeButton') >= 0) {
      var vp = shape.variantProps || {};
      var tierFromName =
        baseName.indexOf('StrikeButton /') === 0 ? (baseName.split(' / ')[1] || '').toLowerCase() : null;
      var tierVal = vp.state || tierFromName;
      sem = {
        role: 'action',
        semanticComponent: 'StrikeButton',
        reactComponent: 'StoneButton',
        semanticParent: 'AttackBar',
        reactParent: 'AttackBar',
        variant: tierVal,
        tier: tierVal,
        actionType: 'attack',
        reactSource: SOURCE.StrikeButton,
        reactParentSource: SOURCE.AttackBar,
        event: 'submitAttack',
        affects: 'enemyHP',
      };
    } else if (baseName.indexOf('AnswerOption') >= 0) {
      var avp = shape.variantProps || {};
      var stateFromName =
        baseName.indexOf('AnswerOption /') === 0 ? (baseName.split(' / ')[1] || '').toLowerCase() : null;
      var stVal = avp.state || stateFromName;
      sem = {
        role: 'input',
        semanticComponent: 'AnswerOption',
        reactComponent: 'QuestionPanel',
        state: stVal,
        variant: stVal,
        inputType: 'choice',
        reactSource: SOURCE.AnswerOption,
        implementationNote: 'Answer choices are rendered inside QuestionPanel in current implementation',
        event: 'selectAnswer',
        affects: 'battleState',
        data: 'answer',
      };
    } else if (baseName.indexOf('PlayerInfoBar') >= 0 || baseName.indexOf('BattleHeader') >= 0) {
      sem = {
        role: 'header',
        semanticComponent: 'PlayerInfoBar',
        reactComponent: 'PlayerInfoBar',
        reactSource: SOURCE.PlayerInfoBar,
      };
    } else if (baseName.indexOf('EnemyEncounterPanel') >= 0 || baseName.indexOf('EnemyCard') >= 0) {
      sem = {
        role: 'entity',
        semanticComponent: 'EnemyEncounterPanel',
        reactComponent: 'EnemyEncounterPanel',
        entityType: 'enemy',
        data: 'enemy',
        reactSource: SOURCE.EnemyEncounterPanel,
      };
    } else if (baseName.indexOf('PlayerBattleVitals') >= 0 || baseName.indexOf('PlayerVitals') >= 0) {
      sem = {
        role: 'entity',
        semanticComponent: 'PlayerBattleVitals',
        reactComponent: 'PlayerBattleVitals',
        entityType: 'player',
        data: 'player',
        reactSource: SOURCE.PlayerBattleVitals,
      };
    } else if (baseName.indexOf('XPBar') >= 0) {
      sem = {
        role: 'meter',
        semanticComponent: 'XPBar',
        reactComponent: 'XPBar',
        meterType: 'xp',
        data: 'currentXP',
        reactSource: SOURCE.XPBar,
      };
    } else if (baseName.indexOf('QuestionPanel') >= 0) {
      sem = {
        role: 'content',
        semanticComponent: 'QuestionPanel',
        reactComponent: 'QuestionPanel',
        data: 'question',
        reactSource: SOURCE.QuestionPanel,
      };
    } else if (baseName.indexOf('StoneFrame') >= 0) {
      sem = {
        role: 'container',
        semanticComponent: 'Panel',
        reactComponent: 'Panel',
        variant: 'stoneFrame',
        penpotAsset: 'StoneFrame',
        reactSource: SOURCE.Panel,
        implementationNote: 'Design asset StoneFrame; semantic Panel variant stoneFrame',
      };
    }

    if (sem) {
      var er2 = tagEntity(shape, sem);
      if (!er2) report.instanceTags++;
      else report.tagErrors.push({ where: 'instance ' + baseName, err: er2 });
    }
  });
}

return report;
