---
inclusion: manual
---

# Three.js Model Loading Guide

## GLTF/GLB Loading

Always use `GLTFLoader` for loading `.glb` and `.gltf` files. For compressed models, add `DRACOLoader`.

```typescript
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
```

## Async Loading Pattern

Always load models asynchronously. Never block the render loop.

```typescript
async function loadModel(path: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        resolve(model);
      },
      (progress) => {
        console.log(
          `Loading: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`,
        );
      },
      (error) => {
        console.error(`Failed to load ${path}:`, error);
        reject(error);
      },
    );
  });
}
```

## Model Cache

Cache loaded models to avoid redundant network requests.

```typescript
const modelCache = new Map<string, THREE.Group>();

async function getModel(path: string): Promise<THREE.Group> {
  if (modelCache.has(path)) {
    return modelCache.get(path)!.clone();
  }
  const model = await loadModel(path);
  modelCache.set(path, model);
  return model.clone();
}
```

## Loading from assets.json

Always read `assets.json` to resolve model paths. Never hardcode file paths.

```typescript
import assetsIndex from "../../assets.json";

async function loadCharacter(name: string): Promise<THREE.Group> {
  const entry = assetsIndex.models[name];
  if (!entry)
    throw new Error(`Unknown model: ${name}. Update assets.json first.`);
  return getModel(entry.file);
}
```

## Rules

- ALWAYS check `assets.json` before loading any model
- NEVER guess file paths or animation clip names
- Use `.clone()` when reusing cached models to avoid shared state bugs
- Set `texture.flipY = false` for GLTF-sourced textures
- Dispose of unused models and textures to prevent memory leaks
