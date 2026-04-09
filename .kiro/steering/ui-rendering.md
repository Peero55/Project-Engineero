# UI Rendering Steering

## Rendering Platform

Battle rendering is built in Unity (via Unity MCP), not React/Three.js.
The web app (apps/web) handles non-battle UI (admin, routing, auth).
Unity owns the cinematic battle experience.

## Rendering Model

Battle rendering must be asset-driven.

Preferred composition (Unity scene hierarchy):

- background scene layer (SpriteRenderer or UI Image)
- enemy or mentor art layer (SpriteRenderer with Animator)
- overlay/HUD layer (Unity UI Canvas)
- question/action layer (Unity UI Canvas)
- feedback/effects layer (Particle System or UI animations)

## Asset Rules

- Use semantic asset identifiers (same key scheme: `enemy:{slug}`, `environment:{id}`).
- Provide graceful fallbacks for missing assets.
- Keep renderer logic composable and reusable via Unity prefabs and ScriptableObjects.
- Unity assets live under the Unity project's Assets/ folder.

## Visual Goal

- cinematic
- readable
- thematic
- not cluttered
- not generic SaaS
