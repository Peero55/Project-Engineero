---
inclusion: manual
---

# Three.js Post-Processing Guide

## EffectComposer Setup

Post-processing uses `EffectComposer` to chain render passes.

```typescript
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

function setupPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): EffectComposer {
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5, // strength
    0.4, // radius
    0.85, // threshold
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return composer;
}
```

## Using the Composer in the Game Loop

Replace `renderer.render(scene, camera)` with `composer.render()`.

```typescript
const composer = setupPostProcessing(renderer, scene, camera);

function gameLoop() {
  requestAnimationFrame(gameLoop);
  const delta = clock.getDelta();
  composer.render();
}
```

## Bloom Configuration

| Mood      | Strength | Radius | Threshold |
| --------- | -------- | ------ | --------- |
| Subtle    | 0.3      | 0.3    | 0.9       |
| Cinematic | 0.5      | 0.4    | 0.85      |
| Intense   | 1.0      | 0.6    | 0.7       |
| Neon      | 1.5      | 0.8    | 0.5       |

Make objects glow via emissive material:

```typescript
const glowMaterial = new THREE.MeshStandardMaterial({
  color: 0x2244ff,
  emissive: 0x2244ff,
  emissiveIntensity: 2.0,
});
```

## Custom Shader Pass

```typescript
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const vignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 1.5 },
    offset: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float darkness;
    uniform float offset;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      gl_FragColor = vec4(mix(texel.rgb, vec3(0.0), dot(uv, uv) * darkness), texel.a);
    }
  `,
};

const vignettePass = new ShaderPass(vignetteShader);
composer.insertPass(vignettePass, composer.passes.length - 1);
```

## Performance Tips

- Bloom is expensive on mobile. Reduce resolution: `composer.setSize(w * 0.5, h * 0.5)`
- Limit active passes to 3-4 max on mobile
- Use `renderer.getPixelRatio()` when sizing the composer
- Profile with `renderer.info` to monitor draw calls

## Resize Handling

```typescript
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});
```

## Rules

- ALWAYS add `OutputPass` as the last pass
- ALWAYS add `RenderPass` as the first pass
- Insert custom passes between RenderPass and OutputPass
- On mobile, reduce composer resolution for performance
- Test bloom threshold carefully — too low makes everything glow
