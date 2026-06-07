# Skin Images Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate SkinGraph Radar with real CS2 skin images so the public catalog and detail screens show recognizable assets almost immediately.

**Architecture:** Use ByMykel/CSGO-API as the offline enrichment source, matching existing `Skin.name` values to API skin records and persisting `imageUrl` in Neo4j. The browser receives ready-to-render URLs from existing API responses; it does not fetch or resolve the catalog at runtime.

**Tech Stack:** Next.js App Router, TypeScript, Neo4j, `tsx`, ByMykel static JSON API, Next Image remote patterns.

---

### Task 1: Image Matching Helper

**Files:**
- Create: `lib/skin-image-catalog.ts`
- Create: `lib/skin-image-catalog.test.ts`

- [ ] Add a focused test for matching a local skin name against ByMykel records by exact `name`.
- [ ] Add a focused test that prefers base skin records over wear-specific market hash names.
- [ ] Implement a small pure helper that returns a `Map<string, string>` from local skin name to image URL.
- [ ] Run the helper test with `npx tsx --test lib/skin-image-catalog.test.ts`.

### Task 2: Neo4j Enrichment Script

**Files:**
- Create: `scripts/enrich-skin-images.ts`
- Modify: `package.json`

- [ ] Fetch `https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json`.
- [ ] Read current `Skin` nodes from Neo4j.
- [ ] Build the image map with `buildSkinImageMap`.
- [ ] Update `s.imageUrl` only when a non-empty URL is found.
- [ ] Add `npm run enrich-images`.
- [ ] Log matched, missing and updated counts.

### Task 3: Fast Public Rendering

**Files:**
- Modify: `next.config.ts`
- Modify: `app/skins/page.tsx`
- Modify: `app/skins/[id]/page.tsx`

- [ ] Add `raw.githubusercontent.com` to Next image `remotePatterns`.
- [ ] Keep catalog thumbnails `loading="lazy"` except the first visible items.
- [ ] Use `objectFit: "contain"` for weapon renders so assets are not cropped.
- [ ] Show the selected skin image on the detail page when `skin.imageUrl` exists.

### Task 4: Documentation and Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/graph-model.md`

- [ ] Document `npm run enrich-images`.
- [ ] Document that `Skin.imageUrl` is populated from ByMykel/CSGO-API.
- [ ] Run `npx tsx --test lib/skin-image-catalog.test.ts`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
