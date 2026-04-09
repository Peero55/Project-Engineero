---
inclusion: manual
---

# Three.js Animation Guide

## AnimationMixer Setup

Every animated model needs its own `AnimationMixer`. Create it immediately after loading.

```typescript
import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

interface AnimatedCharacter {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentAction: string | null;
}

function setupAnimatedCharacter(
  gltf: GLTF,
  modelName: string,
  assetsIndex: any,
): AnimatedCharacter {
  const model = gltf.scene;
  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map<string, THREE.AnimationAction>();
  const modelDef = assetsIndex.models[modelName];

  if (!modelDef) {
    throw new Error(`Model "${modelName}" not found in assets.json`);
  }

  for (const [stateName, animDef] of Object.entries(modelDef.animations)) {
    const clip = gltf.animations.find((c) => c.name === animDef.clipName);
    if (clip) {
      const action = mixer.clipAction(clip);
      action.loop = animDef.loop ? THREE.LoopRepeat : THREE.LoopOnce;
      if (!animDef.loop) action.clampWhenFinished = true;
      actions.set(stateName, action);
    } else {
      console.warn(
        `Clip "${animDef.clipName}" not found for "${stateName}" in "${modelName}". Update assets.json.`,
      );
    }
  }

  return { model, mixer, actions, currentAction: null };
}
```

## Animation State Machine

Use a simple state machine to manage transitions. Always crossfade between states.

```typescript
function transitionTo(
  character: AnimatedCharacter,
  stateName: string,
  fadeDuration = 0.3,
): void {
  const newAction = character.actions.get(stateName);
  if (!newAction) {
    console.warn(`No action for state "${stateName}". Check assets.json.`);
    return;
  }
  if (character.currentAction === stateName) return;

  const oldAction = character.currentAction
    ? character.actions.get(character.currentAction)
    : null;

  if (oldAction) oldAction.fadeOut(fadeDuration);
  newAction.reset().fadeIn(fadeDuration).play();
  character.currentAction = stateName;
}
```

## Standard Animation States

| State    | Use            | Loop  |
| -------- | -------------- | ----- |
| idle     | Standing still | true  |
| walk     | Slow movement  | true  |
| run      | Fast movement  | true  |
| attack   | Combat action  | false |
| hurt     | Taking damage  | false |
| defeated | Death/KO       | false |

## Game Loop Update

The mixer must be updated every frame with delta time from `THREE.Clock`.

```typescript
const clock = new THREE.Clock();

function gameLoop() {
  requestAnimationFrame(gameLoop);
  const delta = clock.getDelta();
  for (const character of activeCharacters) {
    character.mixer.update(delta);
  }
  renderer.render(scene, camera);
}
```

## Animation Blending

For smooth walk-to-run transitions:

```typescript
function blendMovement(character: AnimatedCharacter, speed: number): void {
  const walkAction = character.actions.get("walk");
  const runAction = character.actions.get("run");
  if (!walkAction || !runAction) return;

  const blend = THREE.MathUtils.clamp((speed - 1.0) / 3.0, 0, 1);
  walkAction.setEffectiveWeight(1 - blend);
  runAction.setEffectiveWeight(blend);
  if (!walkAction.isRunning()) walkAction.play();
  if (!runAction.isRunning()) runAction.play();
}
```

## Rules

- ALWAYS reference `assets.json` for clip names and frame data
- NEVER hardcode animation clip names
- If animation plays wrong frames, update `assets.json` first
- Dispose mixers when removing characters: `mixer.stopAllAction(); mixer.uncacheRoot(model)`
- Use `action.clampWhenFinished = true` for one-shot animations
