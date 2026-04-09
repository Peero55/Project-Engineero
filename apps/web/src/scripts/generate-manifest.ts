import * as fs from "node:fs";
import * as path from "node:path";
import { imageSize } from "image-size";
import type {
  AssetManifest,
  AssetEntry,
  AssetCategory,
  VariantTag,
  VariantCategory,
} from "@legendary-hunts/types";
import { RECOGNIZED_VARIANTS } from "@legendary-hunts/types";

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface GeneratorOptions {
  assetsDir: string;
  outputPath: string;
  existingManifestPath?: string;
}

export interface GeneratorResult {
  manifest: AssetManifest;
  warnings: string[];
  orphanedKeys: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_CATEGORIES: AssetCategory[] = [
  "enemy",
  "environment",
  "effect",
  "icon",
  "ui_frame",
  "overlay",
];

const IMAGE_EXTENSIONS = new Set(["png", "webp", "jpg", "jpeg"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext.startsWith(".") ? ext.slice(1) : ext;
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(getExtension(filename));
}

/**
 * Classify a variant suffix into its VariantCategory.
 * Returns the category if recognized, or null if unrecognized.
 */
function classifyVariant(variant: string): VariantCategory | null {
  for (const [category, values] of Object.entries(RECOGNIZED_VARIANTS)) {
    if (values.includes(variant)) {
      return category as VariantCategory;
    }
  }
  return null;
}

function readDimensions(filePath: string): { width: number; height: number } {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = imageSize(buffer);
    return {
      width: result.width ?? 0,
      height: result.height ?? 0,
    };
  } catch {
    return { width: 0, height: 0 };
  }
}

function dirExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Fallback directory scanner
// ---------------------------------------------------------------------------

function scanFallbackDir(assetsDir: string, warnings: string[]): AssetEntry[] {
  const fallbackDir = path.join(assetsDir, "fallback");
  if (!dirExists(fallbackDir)) return [];

  const entries: AssetEntry[] = [];
  const files = fs.readdirSync(fallbackDir);

  for (const file of files) {
    if (!isImageFile(file)) continue;

    const ext = getExtension(file);
    const baseName = path.basename(file, `.${ext}`);

    // Expected pattern: {category}_fallback
    const fallbackMatch = baseName.match(/^([a-z_]+)_fallback$/);
    if (!fallbackMatch) {
      warnings.push(`Skipping non-conforming fallback file: fallback/${file}`);
      continue;
    }

    const categoryStr = fallbackMatch[1];
    if (!VALID_CATEGORIES.includes(categoryStr as AssetCategory)) {
      warnings.push(
        `Skipping fallback file with unknown category "${categoryStr}": fallback/${file}`,
      );
      continue;
    }

    const category = categoryStr as AssetCategory;
    const filePath = path.join(assetsDir, "fallback", file);
    const dims = readDimensions(filePath);
    const assetKey = `${category}:fallback`;

    entries.push({
      assetKey,
      filePath: path.posix.join("assets", "fallback", file),
      width: dims.width,
      height: dims.height,
      category,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Category / slug directory scanner
// ---------------------------------------------------------------------------

function scanCategoryDir(
  assetsDir: string,
  category: AssetCategory,
  warnings: string[],
): AssetEntry[] {
  const categoryDir = path.join(assetsDir, category);
  if (!dirExists(categoryDir)) return [];

  const entries: AssetEntry[] = [];
  const slugDirs = fs.readdirSync(categoryDir);

  for (const slug of slugDirs) {
    const slugDir = path.join(categoryDir, slug);
    if (!dirExists(slugDir)) continue;

    const files = fs.readdirSync(slugDir);

    for (const file of files) {
      if (!isImageFile(file)) continue;

      const ext = getExtension(file);
      const baseName = path.basename(file, `.${ext}`);

      // Parse filename: {slug}.{ext} (base) or {slug}_{variant}.{ext}
      let variant: string | undefined;

      if (baseName === slug) {
        // Base file — no variant
        variant = undefined;
      } else if (baseName.startsWith(`${slug}_`)) {
        // Variant file
        variant = baseName.slice(slug.length + 1);
        if (!variant) {
          warnings.push(
            `Skipping file with empty variant suffix: ${category}/${slug}/${file}`,
          );
          continue;
        }
      } else {
        // Doesn't match expected pattern
        warnings.push(
          `Skipping non-conforming file: ${category}/${slug}/${file} (expected ${slug}.{ext} or ${slug}_{variant}.{ext})`,
        );
        continue;
      }

      // Build asset key
      const assetKey = variant
        ? `${category}:${slug}:${variant}`
        : `${category}:${slug}`;

      // Read dimensions
      const fullPath = path.join(slugDir, file);
      const dims = readDimensions(fullPath);

      // Build variant tags
      const variants: VariantTag[] = [];
      if (variant) {
        const variantCategory = classifyVariant(variant);
        if (variantCategory) {
          variants.push({ category: variantCategory, value: variant });
        } else {
          warnings.push(
            `Unrecognized variant suffix "${variant}" in ${category}/${slug}/${file}`,
          );
        }
      }

      const entry: AssetEntry = {
        assetKey,
        filePath: path.posix.join("assets", category, slug, file),
        width: dims.width,
        height: dims.height,
        category,
        ...(variants.length > 0 ? { variants } : {}),
      };

      entries.push(entry);
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Orphan detection
// ---------------------------------------------------------------------------

function detectOrphans(
  existingManifestPath: string | undefined,
  newKeys: Set<string>,
): string[] {
  if (!existingManifestPath || !fileExists(existingManifestPath)) return [];

  try {
    const raw = fs.readFileSync(existingManifestPath, "utf-8");
    const existing: AssetManifest = JSON.parse(raw);
    return existing.entries
      .map((e) => e.assetKey)
      .filter((key) => !newKeys.has(key));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateManifest(
  options: GeneratorOptions,
): Promise<GeneratorResult> {
  const warnings: string[] = [];
  const allEntries: AssetEntry[] = [];

  // Scan each valid category directory
  for (const category of VALID_CATEGORIES) {
    const entries = scanCategoryDir(options.assetsDir, category, warnings);
    allEntries.push(...entries);
  }

  // Scan fallback directory
  const fallbackEntries = scanFallbackDir(options.assetsDir, warnings);
  allEntries.push(...fallbackEntries);

  // Build manifest
  const manifest: AssetManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    entries: allEntries,
  };

  // Detect orphaned keys
  const newKeys = new Set(allEntries.map((e) => e.assetKey));
  const orphanedKeys = detectOrphans(options.existingManifestPath, newKeys);

  // Ensure output directory exists
  const outputDir = path.dirname(options.outputPath);
  if (!dirExists(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write manifest
  fs.writeFileSync(
    options.outputPath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8",
  );

  return { manifest, warnings, orphanedKeys };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let assetsDir = "public/assets";
  let outputPath = "src/data/asset-manifest.json";
  let existingManifestPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--assets-dir" && args[i + 1]) {
      assetsDir = args[++i];
    } else if (args[i] === "--output" && args[i + 1]) {
      outputPath = args[++i];
    } else if (args[i] === "--existing-manifest" && args[i + 1]) {
      existingManifestPath = args[++i];
    }
  }

  console.log(`Scanning assets in: ${assetsDir}`);
  console.log(`Output path: ${outputPath}`);

  const result = await generateManifest({
    assetsDir,
    outputPath,
    existingManifestPath,
  });

  if (result.warnings.length > 0) {
    console.warn("\nWarnings:");
    for (const w of result.warnings) {
      console.warn(`  ⚠ ${w}`);
    }
  }

  if (result.orphanedKeys.length > 0) {
    console.warn("\nOrphaned manifest entries (files no longer on disk):");
    for (const key of result.orphanedKeys) {
      console.warn(`  ✗ ${key}`);
    }
  }

  console.log(
    `\nGenerated manifest with ${result.manifest.entries.length} entries.`,
  );
}

// Run when executed directly
const isDirectRun = typeof require !== "undefined" && require.main === module;

if (isDirectRun) {
  main().catch((err) => {
    console.error("Manifest generation failed:", err);
    process.exit(1);
  });
}
