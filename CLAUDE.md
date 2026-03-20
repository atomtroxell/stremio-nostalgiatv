# Project Context and Style Guide

## Project

Nostalgia TV (NTV) — a self-hosted Stremio addon serving live retro TV channels.
Node.js / Express. Deployed via Docker behind Caddy on a VPS.

## Hard Rules

- No AI, Claude, or Anthropic references anywhere — not in code, comments, commits, docs, or generated files
- No emojis anywhere — not in code, comments, docs, READMEs, or commit messages
- No co-authored-by or attribution trailers in commits

---

## JavaScript Style

### General

- `'use strict';` at the top of every file
- `const` for all imports and declarations that don't reassign; `let` only when reassignment is needed
- Single quotes for all strings
- Semicolons always
- 2-space indentation
- Arrow functions for callbacks and inline expressions; named functions for handlers and exported utilities
- `async/await` — no `.then()` chains

### Naming

- `camelCase` for variables and functions
- `UPPER_SNAKE_CASE` for module-level constants (CHANNELS, BASE_URL, BASE)
- `kebab-case` for channel IDs, file names, and CSS classes
- Namespace prefixes where appropriate — `ntv-` for channel IDs, `wp-` for WordPress plugins

### Object and Array Formatting

- Align property values in object arrays using spaces when the objects are structurally similar — prioritize visual scanability
- One object per line in arrays
- Short single-responsibility objects can stay on one line
- Trailing commas on multi-line arrays and objects

Example from channels.js:
```js
{ id: 'ntv-swimrewind', name: 'Swim Rewind', description: 'Swim Rewind — ...', poster: `${BASE_URL}/...` },
```

### Modules

- Group imports at the top: built-ins first, then third-party, then local
- `module.exports` at the bottom, always
- Named exports preferred: `module.exports = { get, set, clear, all }`
- Export handler functions explicitly when tests need to call them directly

### Error Handling

- `console.warn` for non-fatal errors — not `console.error`
- Module-prefixed log messages: `[refresh]`, `[cron]`, `[startup]`
- Catch blocks should name the error variable descriptively: `urlErr`, `extractorErr`

### Comments

- Explain "why", not "what" — if the code is obvious, skip the comment
- Section headers for logical groups: `// Pluto TV — HLS via jmp2.uk proxy`
- Em dash separator in section headers: `// Toonami Aftermath — 7 channels`
- Critical notes in caps with full explanation:
  ```js
  // CRITICAL: idPrefixes MUST be a non-empty array.
  // Setting it to null, undefined, or [] causes Android clients to lose
  // the stream handler entirely due to Stremio/stremio-bugs#1469
  ```
- Inline notes for non-obvious decisions, e.g. API quirks, mixed-content warnings, redirect behavior
- First letter capitalized, no period at end — except in multi-sentence CRITICAL blocks

---

## Writing Style

### Descriptions and Copy

- Em dash (—) as separator in channel descriptions: `{Content} — {Platform/URL}`
- Short and information-dense — no padding
- No exclamation points
- Lowercase for inline references to tools, flags, and config keys

### Commit Messages

- Conventional commits: `type: description` or `type(scope): description`
- Types: `feat`, `fix`, `update`, `revert`, `docs`, `refactor`, `chore`
- Lowercase, imperative mood, no period at end
- Body only when context is genuinely needed

### READMEs and Docs

- Plain language, no fluff
- Short sentences
- Describe what something does, then why, then how — in that order
- Code blocks for every command the reader is expected to run
- No marketing language

---

## Project-Specific Patterns

### Channel IDs

All channel IDs use the `ntv-` prefix. Never use `toons-` or any other prefix.

### Channel Descriptions

Follow the format: `{Show or content description} — {Source/platform}`
Example: `Classic Nickelodeon — Pluto TV`

### Log Prefixes

Always prefix log output with the module name in brackets:
- `[startup]` — one-time boot operations
- `[cron]` — scheduled refresh
- `[refresh]` — per-extractor operations

### Static Assets

Logos live in `public/images/`. Channel poster URLs reference `BASE_URL` at runtime so they work both locally and on the VPS without hardcoding.

### Input Validation

Any handler that receives an `id` validates it starts with `ntv-` before doing anything else. Return empty results — never throw — for invalid input.

---

## Architecture Summary

```
index.js          — Express app, rate limiter, cron, root route
src/manifest.js   — Stremio manifest (id, name, description, resources)
src/channels.js   — Central channel registry, single source of truth
src/addon.js      — Catalog, meta, and stream handlers
src/refresh.js    — SSRF-safe URL resolver, extractor orchestration
src/store.js      — In-memory Map of channel ID → resolved stream URL
src/extractors/   — One file per source (toonami, plutotv, swimrewind, owncast)
public/           — Landing page, logos, favicons, OG image, webmanifest
```
