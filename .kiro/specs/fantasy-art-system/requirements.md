# Requirements Document

## Introduction

The Fantasy Art System provides the visual asset infrastructure for Engineero's battle experience. It covers asset loading, semantic key resolution, layered scene composition, data-to-visual mapping, UI component theming, and graceful fallback handling. The system integrates into the existing `apps/web` Next.js application and leverages shared types from `packages/types`. Supabase stores semantic metadata only — React owns all visual rendering and composition.

## Glossary

- **Asset_Registry**: A lookup module in `apps/web` that maps semantic asset keys to file paths and metadata
- **Scene_Compositor**: The React component layer in `apps/web` responsible for assembling background, midground, character, FX, and UI layers into a complete battle scene
- **Asset_Key**: A semantic string identifier (e.g., `enemy:fire_golem`, `env:dark_forest`) used to resolve visual assets without hardcoding file paths
- **Fallback_Asset**: A default placeholder visual displayed when a requested asset cannot be found or loaded
- **Layer_Stack**: The ordered depth composition of visual elements: background → midground → character → FX → UI overlay
- **Asset_Manifest**: A typed data structure that maps asset keys to file paths, dimensions, and variant metadata
- **Theme_Map**: A mapping from game theme identifiers to UI color palettes, frame styles, and environmental tints
- **Battle_Scene**: The complete rendered view combining environment background, enemy art, player HUD, question panel, and effect overlays
- **Sprite_Sheet**: A single image containing multiple animation frames or character pose variants arranged in a grid
- **Manifest_Generator**: A CLI script that scans the `public/assets/` folder structure and produces or updates the Asset_Manifest JSON file automatically
- **Layout_Contract**: The percentage-based spatial rules that define where each layer and UI zone is positioned within the 16:9 battle viewport
- **useAsset**: A React hook that connects components to the Asset_Registry, handling resolution, loading state, error state, and caching transparently
- **Starter_Asset_Pack**: The minimum viable set of visual assets required to render a complete battle scene end-to-end
- **FX_Anchor**: A named screen position (e.g., enemy_center, player_side, screen_center) used to place effects relative to scene elements
- **Theme_Token_Set**: A complete set of CSS custom properties (--lh-\*) that define a theme's visual treatment for UI components

## Requirements

### Requirement 1: Asset Registry and Semantic Key Resolution

**User Story:** As a developer, I want to look up visual assets by semantic keys, so that battle scenes can be composed without hardcoded file paths and new assets can be added without code changes.

#### Acceptance Criteria

1. THE Asset_Registry SHALL resolve an Asset_Key to a file path, dimensions, and variant metadata
2. WHEN an Asset_Key is not found in the Asset_Manifest, THE Asset_Registry SHALL return the corresponding Fallback_Asset for that asset category
3. THE Asset_Registry SHALL support asset categories: enemy, environment, effect, icon, ui_frame, and overlay
4. WHEN the Asset_Manifest is loaded, THE Asset_Registry SHALL validate that all referenced file paths correspond to existing assets
5. THE Asset_Registry SHALL expose a typed TypeScript API from a shared location importable by `apps/web` components

### Requirement 2: Asset Manifest Data Structure

**User Story:** As a developer, I want a typed, structured manifest that maps all asset keys to their visual resources, so that the registry has a single source of truth for asset resolution.

#### Acceptance Criteria

1. THE Asset_Manifest SHALL define entries with fields: assetKey, filePath, width, height, category, and optional variant tags
2. THE Asset_Manifest SHALL be serializable to and parseable from JSON
3. FOR ALL valid Asset_Manifest objects, serializing to JSON then parsing back SHALL produce an equivalent object (round-trip property)
4. WHEN an Asset_Manifest entry contains an invalid category value, THE Asset_Manifest parser SHALL return a descriptive validation error
5. THE Asset_Manifest SHALL support versioning through a top-level schemaVersion field

### Requirement 3: Layered Scene Composition

**User Story:** As a developer, I want to compose battle scenes from discrete visual layers, so that each layer can be independently managed, swapped, and animated.

#### Acceptance Criteria

1. THE Scene_Compositor SHALL render layers in the following depth order: background, midground, character, FX, UI overlay
2. WHEN a layer asset is missing, THE Scene_Compositor SHALL render the remaining layers without visual corruption and display the Fallback_Asset for the missing layer
3. THE Scene_Compositor SHALL maintain a 16:9 aspect ratio for the battle scene viewport
4. WHILE a battle is active, THE Scene_Compositor SHALL keep all five layer slots mounted and composable
5. THE Scene_Compositor SHALL accept layer content as React children or asset keys, allowing both static images and dynamic React components per layer

### Requirement 4: Enemy Art Resolution and Display

**User Story:** As a developer, I want enemy visuals to be resolved from the enemy slug in battle data, so that each enemy type displays its correct art in the battle scene.

#### Acceptance Criteria

1. WHEN a battle encounter provides an enemy_slug, THE Asset_Registry SHALL resolve the slug to the corresponding enemy art asset using the pattern `enemy:{enemy_slug}`
2. THE Scene_Compositor SHALL render the resolved enemy art in the character layer, centered in the combat space
3. WHEN an enemy_slug has no matching asset, THE Asset_Registry SHALL return a generic silhouette Fallback_Asset and THE Scene_Compositor SHALL display the fallback without breaking the scene layout
4. THE enemy art display SHALL maintain consistent sizing relative to the scene viewport regardless of source image dimensions
5. WHEN an enemy asset defines pose variants, THE Asset_Registry SHALL expose the available variants and THE Scene_Compositor SHALL default to the idle pose

### Requirement 5: Environment Background Resolution

**User Story:** As a developer, I want environment backgrounds to be resolved from battle or hunt metadata, so that each battle takes place in a thematically appropriate setting.

#### Acceptance Criteria

1. WHEN battle metadata includes an environment identifier, THE Asset_Registry SHALL resolve the identifier to a background asset using the pattern `env:{environment_id}`
2. THE Scene_Compositor SHALL render the resolved background asset in the background layer, scaled to fill the 16:9 viewport
3. WHEN an environment identifier has no matching asset, THE Asset_Registry SHALL return a default neutral background Fallback_Asset
4. THE environment background assets SHALL support lighting variants (day, night, dramatic) selectable via an optional variant tag in the Asset_Key
5. WHEN a background asset includes parallax layer data, THE Scene_Compositor SHALL render the midground layer separately from the background layer

### Requirement 6: UI Theme Mapping

**User Story:** As a developer, I want UI elements to adapt their visual style based on the current game theme, so that frames, panels, and accents feel cohesive with the battle environment.

#### Acceptance Criteria

1. THE Theme_Map SHALL map theme identifiers to color palettes, border styles, and accent treatments compatible with the existing CSS custom property system (--lh-\* tokens)
2. WHEN a battle scene specifies a theme identifier, THE Scene_Compositor SHALL apply the corresponding Theme_Map values to UI overlay layer components
3. WHEN a theme identifier has no matching Theme_Map entry, THE Scene_Compositor SHALL apply the default theme without visual errors
4. THE Theme_Map SHALL be defined as a typed data structure in `packages/types` so that both asset tooling and `apps/web` components share the same contract
5. THE Theme_Map entries SHALL include at minimum: primary accent color, secondary accent color, panel background tint, and border glow color

### Requirement 7: Effect and Overlay Rendering

**User Story:** As a developer, I want attack, magic, status, and environmental effects to render in the correct layer with consistent visual treatment, so that combat feedback feels cinematic and readable.

#### Acceptance Criteria

1. THE Scene_Compositor SHALL render effect assets in the FX layer, positioned above the character layer and below the UI overlay layer
2. WHEN an effect Asset_Key is resolved, THE Scene_Compositor SHALL display the effect at the specified screen position relative to the target (enemy or player area)
3. THE Asset_Registry SHALL support effect categories: attack, magic, status, and environmental
4. WHEN multiple effects are active simultaneously, THE Scene_Compositor SHALL render all active effects in the FX layer without z-order conflicts
5. IF an effect asset fails to load, THEN THE Scene_Compositor SHALL skip rendering that effect and log a warning without interrupting the battle flow

### Requirement 8: Asset Naming Convention and Folder Structure

**User Story:** As a developer, I want a consistent naming convention and folder structure for all visual assets, so that the Asset_Registry can predictably locate files and new assets integrate without ambiguity.

#### Acceptance Criteria

1. THE Asset*Registry SHALL expect assets organized under `public/assets/{category}/{slug}/` with filenames following the pattern `{slug}*{variant}.{ext}`
2. THE Asset_Registry SHALL support image formats: PNG for characters and UI elements, WebP for environment backgrounds
3. WHEN a new asset is added following the naming convention, THE Asset_Registry SHALL resolve the asset without code changes beyond updating the Asset_Manifest
4. THE Asset_Manifest SHALL enforce that all assetKey values match the pattern `{category}:{slug}` or `{category}:{slug}:{variant}`
5. THE Asset_Registry SHALL reject asset keys that do not conform to the naming pattern and log a descriptive error

### Requirement 9: Graceful Degradation and Error Handling

**User Story:** As a developer, I want the art system to handle missing, corrupt, or slow-loading assets gracefully, so that the battle experience remains functional and visually coherent even with incomplete asset coverage.

#### Acceptance Criteria

1. WHEN an asset file fails to load (network error or corrupt file), THE Scene_Compositor SHALL display the category-appropriate Fallback_Asset in place of the failed asset
2. WHILE assets are loading, THE Scene_Compositor SHALL display a loading placeholder that matches the scene's visual style
3. THE Scene_Compositor SHALL complete initial render within 100ms of receiving asset keys, using Fallback_Assets for any assets not yet cached
4. IF all assets for a scene fail to load, THEN THE Scene_Compositor SHALL render a complete fallback scene using only Fallback_Assets and text labels
5. THE Asset_Registry SHALL log all asset resolution failures with the attempted Asset_Key and failure reason to the browser console

### Requirement 10: Asset Preloading and Caching

**User Story:** As a developer, I want assets to be preloaded and cached efficiently, so that scene transitions feel smooth and repeat encounters load instantly.

#### Acceptance Criteria

1. WHEN a battle scene is about to be displayed, THE Asset_Registry SHALL preload all assets referenced by the scene's asset keys before the Scene_Compositor begins rendering
2. THE Asset_Registry SHALL cache loaded assets in memory so that subsequent requests for the same Asset_Key return the cached version without a network request
3. WHEN the browser cache contains a previously loaded asset, THE Asset_Registry SHALL use the cached version
4. THE Asset_Registry SHALL support a preload hint API that accepts an array of Asset_Keys and begins loading them in the background
5. WHILE preloading is in progress, THE Asset_Registry SHALL report loading progress as a fraction of total assets requested versus assets loaded

### Requirement 11: Asset Manifest Generator

**User Story:** As a developer, I want the Asset Manifest to be generated automatically from the folder structure, so that adding new assets never requires manual JSON editing and the manifest stays in sync with what's on disk.

#### Acceptance Criteria

1. THE Manifest_Generator SHALL scan `public/assets/{category}/{slug}/` directories and produce a valid Asset_Manifest JSON file
2. THE Manifest_Generator SHALL infer assetKey from the folder path using the pattern `{category}:{slug}` and append `:{variant}` when variant filenames are detected
3. THE Manifest_Generator SHALL read image dimensions (width, height) from each discovered file and include them in the manifest entry
4. WHEN the Manifest*Generator encounters a file that does not match the expected naming pattern `{slug}*{variant}.{ext}`, IT SHALL log a warning and skip the file without failing the entire scan
5. THE Manifest_Generator SHALL be executable as a CLI command (e.g., `npm run generate-manifest`) and output the manifest to a configurable path defaulting to `apps/web/src/data/asset-manifest.json`
6. FOR ALL asset files present in the scanned directories, THE generated manifest SHALL contain exactly one entry per valid asset file (no duplicates, no omissions)
7. THE Manifest_Generator SHALL detect and report orphaned manifest entries (keys in an existing manifest whose files no longer exist on disk)

### Requirement 12: Variant Strategy and Rules

**User Story:** As a developer, I want clear rules governing when and how asset variants are created, so that variant proliferation is controlled and every variant serves a defined purpose.

#### Acceptance Criteria

1. THE Asset_Registry SHALL recognize three variant categories: pose (idle, attack, hurt, defeated), lighting (day, night, dramatic), and palette (recolor swaps)
2. FOR ALL enemy assets, THE Asset_Manifest SHALL require at minimum an idle pose variant; additional pose variants (attack, hurt, defeated) SHALL be optional
3. FOR ALL environment assets, THE Asset_Manifest SHALL require at minimum a day lighting variant; night and dramatic variants SHALL be optional
4. WHEN a requested variant does not exist for an asset, THE Asset_Registry SHALL fall back to the default variant for that asset (idle for poses, day for lighting) rather than returning a Fallback_Asset
5. THE Asset_Manifest SHALL tag each variant with its variant category (pose, lighting, or palette) so that the Scene_Compositor can filter and select variants programmatically
6. THE Manifest_Generator SHALL enforce variant naming rules: variant suffixes MUST be one of the recognized values per category, and unrecognized suffixes SHALL produce a validation warning

### Requirement 13: Scene Layout Contract

**User Story:** As a developer, I want a precise, percentage-based layout contract for the battle viewport, so that the Scene Compositor and UI components share an unambiguous spatial agreement and render consistently across screen sizes.

#### Acceptance Criteria

1. THE Layout_Contract SHALL define all layer and UI zone positions as percentage values relative to the 16:9 battle viewport (not pixel values)
2. THE Layout_Contract SHALL specify the following zones: background (100% width, 100% height), midground (100% width, bottom 60%), character stage (center 50% width, bottom 70% height), FX overlay (100% width, 100% height), and UI overlay (100% width, 100% height)
3. THE Layout_Contract SHALL define the enemy display area as horizontally centered within the character stage, occupying no more than 40% of viewport width and 60% of viewport height
4. THE Layout_Contract SHALL define the UI panel zones: question panel (bottom 30% of viewport height, 90% width centered), enemy info bar (top 10% of viewport height, 60% width centered), and player HUD (bottom-left 20% width, 15% height)
5. THE Layout_Contract SHALL be defined as a typed constant in `packages/types` so that both the Scene_Compositor and UI components reference the same spatial values
6. WHEN the viewport is resized, THE Scene_Compositor SHALL scale all layers and UI zones proportionally according to the Layout_Contract percentages while maintaining the 16:9 aspect ratio

### Requirement 14: Animation and Timing Strategy

**User Story:** As a developer, I want a defined animation strategy for effects and character state transitions, so that the system is ready for animated assets even though MVP uses static images.

#### Acceptance Criteria

1. THE Asset_Manifest SHALL support an optional `animation` field per entry with properties: frameCount, frameDuration (ms), and loop (boolean)
2. FOR MVP, THE Scene_Compositor SHALL render all assets as static images; WHEN an asset has animation metadata, THE Scene_Compositor SHALL display only the first frame
3. THE Asset_Registry SHALL resolve Sprite_Sheet assets by returning the full sheet path plus frame metadata, so that a future animation renderer can slice frames without manifest changes
4. WHEN a character transitions between pose variants (e.g., idle → attack → idle), THE Scene_Compositor SHALL support a configurable transition duration defaulting to 300ms with a CSS crossfade
5. THE effect rendering system SHALL support a display duration per effect (defaulting to 800ms) after which the effect is automatically removed from the FX layer
6. THE animation metadata format SHALL be forward-compatible: adding new animation properties in future schema versions SHALL NOT break existing manifest entries that lack those properties

### Requirement 15: Scene Compositor React Component Tree

**User Story:** As a developer, I want a concrete React component hierarchy for the Scene Compositor, so that each layer is a discrete, composable component and the battle viewport can be assembled declaratively.

#### Acceptance Criteria

1. THE Scene_Compositor SHALL be implemented as a React component that renders child layer components in the following order: `<Background />`, `<Midground />`, `<CharacterStage />`, `<FXLayer />`, `<UIOverlay />`
2. EACH layer component SHALL accept its content via props (asset keys or React children) and SHALL be independently replaceable without affecting other layers
3. THE `<CharacterStage />` component SHALL position enemy art according to the Layout_Contract enemy display area (centered, max 40% width, 60% height)
4. THE `<UIOverlay />` component SHALL mount sub-components for question panel, enemy info bar, and player HUD at the positions defined by the Layout_Contract
5. THE `<SceneCompositor />` SHALL use CSS absolute positioning within a 16:9 aspect-ratio container, with each layer stacked via z-index matching the Layer_Stack depth order
6. WHEN rendered with no props, THE `<SceneCompositor />` SHALL display a complete fallback scene using Fallback_Assets in every layer slot

### Requirement 16: Starter Asset Pack (MVP Asset Set)

**User Story:** As a developer, I want a minimum viable set of placeholder assets available from day one, so that the entire pipeline can be tested end-to-end before production art is created.

#### Acceptance Criteria

1. THE Starter_Asset_Pack SHALL include at minimum: 1 enemy asset (with idle pose variant), 1 environment background (with day lighting variant), 1 UI theme token set, and 5 effect assets (1 attack, 1 magic, 1 status, 1 environmental, 1 generic)
2. THE Starter_Asset_Pack assets SHALL follow the naming convention and folder structure defined in Requirement 8
3. THE Starter_Asset_Pack SHALL include a pre-generated Asset_Manifest that passes validation by the Manifest_Generator
4. WHEN the Starter_Asset_Pack is placed in `public/assets/`, THE Scene_Compositor SHALL render a complete battle scene with no Fallback_Assets visible
5. THE Starter_Asset_Pack enemy asset SHALL be a simple stylized silhouette placeholder (not production art) that demonstrates correct sizing and positioning within the character stage
6. THE Starter_Asset_Pack SHALL include one Fallback_Asset per category (enemy, environment, effect, icon, ui_frame, overlay) for use when production assets are missing

### Requirement 17: Theme CSS Token Implementation

**User Story:** As a developer, I want each game theme to be expressed as a concrete set of CSS custom properties, so that UI components can be themed by swapping token sets without component-level style changes.

#### Acceptance Criteria

1. EACH Theme_Token_Set SHALL define the following CSS custom properties: `--lh-accent-primary`, `--lh-accent-secondary`, `--lh-panel-bg`, `--lh-panel-border`, `--lh-border-glow`, `--lh-text-primary`, `--lh-text-secondary`, `--lh-text-accent`
2. THE system SHALL include a default Theme_Token_Set that is applied when no theme identifier is specified or when the specified theme has no matching token set
3. WHEN the Scene_Compositor applies a theme, IT SHALL set the Theme_Token_Set values as CSS custom properties on the battle viewport container element so that all descendant UI components inherit them
4. THE Theme_Token_Set definitions SHALL be co-located with the Theme_Map in `packages/types` as typed constants, and a CSS generation utility SHALL produce the corresponding `:root` or scoped CSS from those constants
5. FOR ALL Theme_Token_Set entries, contrast between `--lh-text-primary` and `--lh-panel-bg` SHALL meet WCAG AA minimum contrast ratio (4.5:1) to ensure readability
6. THE Starter_Asset_Pack (Requirement 16) SHALL include at least one complete Theme_Token_Set demonstrating all required custom properties

### Requirement 18: Asset Loader Hook (useAsset)

**User Story:** As a developer, I want a React hook that resolves an asset key to a loaded image and exposes loading/error states, so that any component can consume assets from the registry without manual fetch logic.

#### Acceptance Criteria

1. THE useAsset hook SHALL accept an Asset_Key string and return an object with: `src` (resolved file path or null), `status` ('loading' | 'loaded' | 'error'), `width`, `height`, and `error` (error message or null)
2. WHEN the Asset_Key resolves successfully, THE useAsset hook SHALL return status 'loaded' with the resolved file path as `src`
3. WHEN the Asset_Key is not found or the asset fails to load, THE useAsset hook SHALL return status 'error' and automatically resolve the category-appropriate Fallback_Asset as `src`
4. THE useAsset hook SHALL integrate with the Asset_Registry's preload cache so that previously loaded assets return status 'loaded' synchronously without a loading flash
5. THE useAsset hook SHALL accept an optional variant parameter to request a specific variant (e.g., `useAsset('enemy:fire_golem', { variant: 'attack' })`) and SHALL fall back to the default variant per Requirement 12 rules if the requested variant is unavailable
6. THE useAsset hook SHALL be importable from a shared location within `apps/web` (e.g., `@/hooks/useAsset`) and SHALL not depend on any component-specific context beyond the Asset_Registry provider

### Requirement 19: FX Anchor Positioning System

**User Story:** As a developer, I want effects to be placed at named anchor points relative to scene elements, so that attack effects hit the enemy, status effects appear on the correct target, and environmental effects fill the scene predictably.

#### Acceptance Criteria

1. THE FX_Anchor system SHALL define the following named anchors: `enemy_center` (center of enemy display area), `enemy_top` (top edge of enemy display area), `player_side` (bottom-left of character stage), `screen_center` (center of battle viewport), and `screen_full` (entire battle viewport)
2. EACH FX_Anchor position SHALL be derived from the Layout_Contract percentages so that anchors remain consistent with the scene layout across viewport sizes
3. WHEN an effect is triggered, THE Scene_Compositor SHALL accept an anchor name and render the effect asset centered on that anchor point within the FX layer
4. THE FX_Anchor `screen_full` SHALL cause the effect to scale to cover the entire battle viewport (used for environmental effects like screen flashes or weather overlays)
5. WHEN an effect specifies an anchor that is not recognized, THE Scene_Compositor SHALL default to `screen_center` and log a warning
6. THE FX_Anchor positions SHALL be defined as a typed constant alongside the Layout_Contract in `packages/types` so that both the Scene_Compositor and effect trigger logic reference the same anchor definitions
