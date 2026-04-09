import { describe, it, expect } from "vitest";
import { ASSET_KEY_PATTERN } from "../asset";

/**
 * Validates: Requirements 2.4, 8.4, 8.5
 * Unit tests for ASSET_KEY_PATTERN regex validation.
 */

describe("ASSET_KEY_PATTERN", () => {
  describe("valid keys", () => {
    const validKeys = [
      "enemy:fire_golem",
      "environment:dark_forest",
      "environment:dark_forest:night",
      "effect:attack_slash",
      "icon:health_potion",
      "ui_frame:gold_border",
      "overlay:fog_layer",
    ];

    it.each(validKeys)("matches %s", (key) => {
      expect(ASSET_KEY_PATTERN.test(key)).toBe(true);
    });
  });

  describe("valid keys with variants", () => {
    const variantKeys = ["enemy:fire_golem:idle", "enemy:fire_golem:attack"];

    it.each(variantKeys)("matches %s", (key) => {
      expect(ASSET_KEY_PATTERN.test(key)).toBe(true);
    });
  });

  describe("invalid keys", () => {
    const invalidKeys: [string, string][] = [
      ["", "empty string"],
      ["invalid:category:key", "unrecognized category"],
      ["ENEMY:fire_golem", "uppercase category"],
      ["enemy:", "missing slug"],
      [":fire_golem", "missing category"],
      ["enemy:fire golem", "space in slug"],
      ["enemy:fire-golem", "hyphen in slug"],
      ["enemy:slug:variant:extra", "too many colons"],
    ];

    it.each(invalidKeys)("rejects %s (%s)", (key) => {
      expect(ASSET_KEY_PATTERN.test(key)).toBe(false);
    });
  });
});
