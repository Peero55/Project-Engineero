# Implementation Plan: Fantasy Art System

## Overview

Build the visual asset infrastructure for Engineero's battle experience. The implementation follows the pipeline: shared types → asset registry → useAsset hook → scene compositor components → manifest generator CLI → starter asset pack. Each task builds incrementally so the system is wirable and testable at every step.

## Tasks

- [x] 1. Define shared domain types in `packages/types`
  - [x] 1.1 Create `packages/types/src/asset.ts` with `AssetCategory`, `AssetEntry`, `AssetManifest`, `AssetKey` pattern, variant types (`PoseVariant`, `LightingVariant`, `PaletteVariant`, `VariantTag`, `AnimationMeta`), and constants (`ASSET_KEY_PATTERN`, `CATEGORY_FORMATS`, `RECOGNIZED_VARIANTS`, `DEFAULT_VARIANTS`)
    - Export all types and constants
    - _Requirements: 1.1, 1.3, 2.1, 2.4, 2.5, 8.4, 12.1, 12.5, 14.1, 14.6_

  - [x] 1.2 Create `packages/types/src/theme.ts` with `ThemeTokenSet`, `ThemeId`, `ThemeMap`, `DEFAULT_THEME_ID`, `DEFAULT_THEME_TOKENS`, and `THEME_MAP` constant
    - Match the 8 required `--lh-*` CSS custom properties
    - _Requirements: 6.1, 6.4, 6.5, 17.1, 17.2, 17.4_

  - [x] 1.3 Create `packages/types/src/layout.ts` with `LayoutZone`, `LayoutContractType`, `LAYOUT_CONTRACT`, `FXAnchorName`, `FXAnchorPosition`, `FX_ANCHORS`, and `DEFAULT_FX_ANCHOR`
    - All positions as percentage values relative to 16:9 viewport
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 19.1, 19.2, 19.6_

  - [x] 1.4 Export new modules from `packages/types/src/index.ts`
    - Add `export * from "./asset"`, `export * from "./theme"`, `export * from "./layout"`
    - _Requirements: 1.5, 6.4, 13.5_

  - [x] 1.5 Write property test for AssetManifest round-trip serialization
    - Generate random valid `AssetManifest` objects, serialize to JSON, parse back, and assert equivalence
    - **Validates: Requirement 2.3 (round-trip consistency)**

  - [x] 1.6 Write unit tests for asset key pattern validation
    - Test `ASSET_KEY_PATTERN` against valid keys (`enemy:fire_golem`, `environment:dark_forest:night`) and invalid keys
    - **Validates: Requirements 2.4, 8.4, 8.5**

- [x] 2. Checkpoint — Verify shared types compile and export correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement Asset Registry (`apps/web/src/lib/asset-registry.ts`)
  - [x] 3.1 Create `apps/web/src/lib/asset-registry.ts` implementing the `AssetRegistry` class
    - Constructor accepts `AssetManifest` and builds internal lookup maps
    - Implement `resolve(assetKey, variant?)` — parse key via `ASSET_KEY_PATTERN`, look up entry, return `ResolvedAsset` or null
    - Implement `getFallback(category)` — return the fallback entry from `fallback/{category}` convention
    - Implement `resolveWithFallback(assetKey, variant?)` — resolve with automatic fallback, never returns null
    - Implement variant fallback logic: if requested variant missing, fall back to default variant per `DEFAULT_VARIANTS` before falling back to category fallback
    - Implement `getVariants(baseKey)` — return all entries sharing the same category:slug prefix
    - Implement `validate()` — check all manifest file paths are loadable, return `{ valid, errors }`
    - Implement `isCached(assetKey)` — check in-memory cache
    - Log resolution failures with attempted key and reason to console
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.3, 4.5, 5.1, 5.3, 5.4, 8.1, 8.3, 8.5, 9.5, 12.4_

  - [x] 3.2 Implement `preload(assetKeys, onProgress?)` and caching on `AssetRegistry`
    - Preload images via `HTMLImageElement`, store in `imageCache` map
    - Report progress as `PreloadProgress` via callback
    - Use browser cache for previously loaded assets
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 3.3 Write property test for resolve-with-fallback guarantee
    - For any valid `AssetCategory` and any asset key string, `resolveWithFallback` never returns null
    - **Validates: Requirements 1.2, 9.1, 9.4**

  - [x] 3.4 Write unit tests for AssetRegistry
    - Test resolve with valid key, missing key, variant fallback, invalid key format rejection
    - Test preload progress reporting
    - **Validates: Requirements 1.1, 1.2, 1.4, 4.5, 8.5, 10.5**

- [x] 4. Implement useAsset hook (`apps/web/src/hooks/useAsset.ts`)
  - [x] 4.1 Create `apps/web/src/hooks/useAsset.ts`
    - Accept `assetKey` string and optional `UseAssetOptions` with `variant`
    - Return `UseAssetResult` with `src`, `status`, `width`, `height`, `error`
    - Integrate with `AssetRegistry` — check preload cache first for synchronous loaded state
    - On error, automatically resolve category-appropriate fallback as `src`
    - On variant miss, fall back to default variant per Requirement 12 rules
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [x] 4.2 Write unit tests for useAsset hook
    - Test loading → loaded transition, error → fallback resolution, variant fallback, cached asset synchronous return
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**

- [x] 5. Checkpoint — Verify registry and hook work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Scene Compositor component tree (`apps/web/src/components/fantasy/scene/`)
  - [x] 6.1 Create `SceneCompositor.tsx` — root 16:9 aspect-ratio container
    - Use CSS absolute positioning with `aspect-ratio: 16/9` and `position: relative; overflow: hidden`
    - Apply theme CSS custom properties from `ThemeMap` on the container element based on `themeId` prop
    - Fall back to `DEFAULT_THEME_ID` when `themeId` is missing or unrecognized
    - Render child layers in order: `<Background />`, `<Midground />`, `<CharacterStage />`, `<FXLayer />`, `<UIOverlay />`
    - Each layer stacked via z-index matching the layer depth order (10, 20, 30, 40, 50)
    - When rendered with no props, display a complete fallback scene using fallback assets in every layer slot
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 6.2, 6.3, 9.3, 9.4, 13.6, 15.1, 15.5, 15.6, 17.3_

  - [x] 6.2 Create `Background.tsx` — background layer component
    - Accept `assetKey` prop and `zone` from `LAYOUT_CONTRACT.background`
    - Use `useAsset` to resolve and display the background image scaled to fill the 16:9 viewport
    - Support lighting variants via asset key variant suffix
    - _Requirements: 3.1, 5.2, 5.4, 15.2_

  - [x] 6.3 Create `Midground.tsx` — midground/parallax layer component
    - Accept optional `assetKey` prop and `zone` from `LAYOUT_CONTRACT.midground`
    - Render midground layer separately from background when parallax data is present
    - Render nothing gracefully when no midground asset is provided
    - _Requirements: 3.1, 5.5, 15.2_

  - [x] 6.4 Create `CharacterStage.tsx` — enemy art display with layout contract positioning
    - Accept `enemyKey` and optional `enemyVariant` props
    - Position enemy art according to `LAYOUT_CONTRACT.enemyDisplay` (centered, max 40% width, 60% height)
    - Maintain consistent sizing relative to viewport regardless of source image dimensions
    - Default to idle pose variant; support CSS crossfade transition (300ms default) between pose variants
    - Display fallback silhouette when enemy asset is missing without breaking layout
    - _Requirements: 3.2, 4.2, 4.3, 4.4, 4.5, 12.2, 14.4, 15.3_

  - [x] 6.5 Create `FXLayer.tsx` — effect rendering with anchor positioning
    - Accept `effects` array of `EffectDescriptor` objects and `zone` from `LAYOUT_CONTRACT.fxOverlay`
    - Position each effect at its specified `FXAnchorName` position from `FX_ANCHORS`
    - `screen_full` anchor scales effect to cover entire viewport
    - Default unrecognized anchors to `screen_center` and log a warning
    - Support display duration per effect (default 800ms), auto-remove after duration
    - Render multiple simultaneous effects without z-order conflicts
    - Skip rendering and log warning if an effect asset fails to load
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 14.5, 19.3, 19.4, 19.5_

  - [x] 6.6 Create `UIOverlay.tsx` — HUD, enemy info, question panel mounting
    - Accept `children` and `zone` from `LAYOUT_CONTRACT.uiOverlay`
    - Mount sub-component slots at Layout Contract positions: question panel, enemy info bar, player HUD
    - Pass through children for flexible UI composition
    - _Requirements: 3.5, 15.4_

  - [x] 6.7 Write unit tests for SceneCompositor
    - Test layer rendering order and z-index stacking
    - Test theme application on container element
    - Test fallback scene rendering when no props provided
    - Test that missing layer assets don't break other layers
    - **Validates: Requirements 3.1, 3.2, 3.4, 6.2, 6.3, 9.4, 15.1, 15.5, 15.6**

  - [x] 6.8 Write unit tests for FXLayer anchor positioning
    - Test each named anchor positions effect correctly
    - Test `screen_full` fills viewport
    - Test unrecognized anchor defaults to `screen_center`
    - Test effect auto-removal after duration
    - **Validates: Requirements 19.3, 19.4, 19.5, 7.4, 14.5**

- [x] 7. Checkpoint — Verify scene compositor renders with fallback assets
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Manifest Generator CLI (`apps/web/src/scripts/generate-manifest.ts`)
  - [x] 8.1 Create `apps/web/src/scripts/generate-manifest.ts`
    - Implement `generateManifest(options)` that scans `public/assets/{category}/{slug}/` directories
    - Infer `assetKey` from folder path: `{category}:{slug}` and append `:{variant}` when variant filenames detected
    - Read image dimensions (width, height) from each discovered file using a Node image-size library
    - Tag each variant with its variant category (pose, lighting, palette) per `RECOGNIZED_VARIANTS`
    - Enforce variant naming rules: unrecognized variant suffixes produce a validation warning
    - Skip files not matching `{slug}_{variant}.{ext}` pattern with a logged warning (don't fail the scan)
    - Detect and report orphaned manifest entries (keys in existing manifest whose files no longer exist)
    - Output manifest to configurable path, defaulting to `apps/web/src/data/asset-manifest.json`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 12.6_

  - [x] 8.2 Add `npm run generate-manifest` script to `apps/web/package.json`
    - Wire CLI entry point via `ts-node` or `tsx` to run `generate-manifest.ts`
    - _Requirements: 11.5_

  - [x] 8.3 Write property test for manifest generator completeness
    - For a given set of valid asset files on disk, the generated manifest contains exactly one entry per valid file (no duplicates, no omissions)
    - **Validates: Requirement 11.6**

  - [x] 8.4 Write unit tests for manifest generator
    - Test key inference from folder paths
    - Test variant detection and tagging
    - Test orphaned entry detection
    - Test skip behavior for non-conforming filenames
    - **Validates: Requirements 11.1, 11.2, 11.4, 11.7, 12.6**

- [x] 9. Implement Theme CSS token generation
  - [x] 9.1 Create a CSS generation utility in `apps/web/src/styles/themes/` that produces scoped CSS from `ThemeMap` constants
    - Generate CSS that sets `--lh-*` custom properties scoped to the battle viewport container
    - Ensure the default theme extends the existing `fantasy-ui.css` convention with `--lh-accent-primary`, `--lh-accent-secondary`, `--lh-panel-bg`, `--lh-panel-border`, `--lh-border-glow`, `--lh-text-primary`, `--lh-text-secondary`, `--lh-text-accent`
    - _Requirements: 17.1, 17.3, 17.4_

  - [x] 9.2 Write unit test for theme CSS token contrast
    - Verify `--lh-text-primary` against `--lh-panel-bg` meets WCAG AA minimum contrast ratio (4.5:1)
    - **Validates: Requirement 17.5**

- [x] 10. Checkpoint — Verify manifest generator and theme CSS work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Create Starter Asset Pack and folder structure
  - [x] 11.1 Create `public/assets/` directory structure following the naming convention
    - Create directories: `enemy/placeholder_enemy/`, `environment/default_env/`, `effect/attack_slash/`, `effect/magic_spark/`, `effect/status_shield/`, `effect/env_fog/`, `effect/generic_flash/`, `icon/placeholder/`, `ui_frame/placeholder/`, `overlay/placeholder/`, `fallback/`
    - _Requirements: 8.1, 8.2, 16.2_

  - [x] 11.2 Create placeholder starter assets
    - 1 enemy asset with idle pose variant (simple stylized silhouette placeholder)
    - 1 environment background with day lighting variant (WebP format)
    - 5 effect assets (1 attack, 1 magic, 1 status, 1 environmental, 1 generic) in PNG/WebP
    - 1 fallback asset per category (enemy, environment, effect, icon, ui_frame, overlay)
    - All assets follow naming convention: `{slug}_{variant}.{ext}`
    - _Requirements: 16.1, 16.2, 16.5, 16.6_

  - [x] 11.3 Run `npm run generate-manifest` to produce the starter `asset-manifest.json`
    - Verify the generated manifest passes validation
    - _Requirements: 16.3_

  - [x] 11.4 Verify the SceneCompositor renders a complete battle scene with starter assets and no fallbacks visible
    - _Requirements: 16.4_

- [x] 12. Wire everything together and integrate with battle flow
  - [x] 12.1 Create an `AssetRegistryProvider` context in `apps/web` that loads `asset-manifest.json` and provides the `AssetRegistry` instance to the component tree
    - Load manifest at app initialization
    - Provide registry instance via React context for `useAsset` hook consumption
    - _Requirements: 1.5, 18.6_

  - [x] 12.2 Integrate `SceneCompositor` into the battle experience
    - Wire `enemy_slug` from battle data to `enemyKey` prop via `enemy:{enemy_slug}` pattern
    - Wire environment identifier from battle metadata to `environmentKey` prop via `environment:{env_id}` pattern
    - Wire `theme_id` from battle metadata to `themeId` prop
    - Wire effect triggers to `effects` prop with appropriate `FXAnchorName` values
    - Display loading placeholder matching scene visual style while assets load
    - _Requirements: 4.1, 5.1, 6.2, 7.2, 7.3, 9.2, 9.3_

  - [x] 12.3 Add scene preloading — preload all scene assets before compositor begins rendering
    - Call `AssetRegistry.preload()` with scene asset keys when battle is about to display
    - _Requirements: 10.1_

  - [x] 12.4 Write integration tests for the full pipeline
    - Test: asset manifest → registry → useAsset → SceneCompositor renders correctly
    - Test: missing assets degrade gracefully with fallbacks
    - Test: theme tokens apply correctly to UI overlay descendants
    - **Validates: Requirements 1.1, 3.2, 6.2, 9.1, 9.4, 16.4**

- [x] 13. Final checkpoint — Full pipeline verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All 19 requirements are covered across the task list
- The implementation order follows the pipeline: types → registry → hook → components → generator → assets → wiring
- TypeScript is used throughout, matching the design document
