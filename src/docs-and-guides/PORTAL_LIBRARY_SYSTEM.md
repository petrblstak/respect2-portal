# Portal Library System - Architecture & Integration Guide

## Overview

This document explains how the `cmp-portal-core` library is integrated into the Aricoma Portal application. The current approach evolved after migrating from the legacy Webpack builder to Angular's modern Application builder (esbuild), which fundamentally changed how module resolution works.

**Last Updated**: January 10, 2026  
**Migration Context**: Angular 20 with Application Builder (esbuild)

---

## Table of Contents

1. [Why We Changed the Approach](#why-we-changed-the-approach)
2. [Current Architecture](#current-architecture)
3. [Why Alternative Approaches Don't Work](#why-alternative-approaches-dont-work)
4. [Development Workflow](#development-workflow)
5. [How Services Are Shared](#how-services-are-shared)
6. [Troubleshooting](#troubleshooting)

---

## Why We Changed the Approach

### The Old Approach (TypeScript Paths Mapping)

Previously, the library was referenced via `tsconfig.json` paths mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "cmp-portal-core": ["../_portal-libs-v25/dist/cmp-portal-core"]
    }
  }
}
```

**This worked with the Webpack builder** but broke after migrating to the Application builder.

### The Problem: Angular Core Duplication (NG0203 Error)

After updating to Angular's Application builder (esbuild-based), the paths mapping approach caused **duplicate Angular Core packages** to be included in the build:

1. **Application's `node_modules/@angular/core`** - The app's dependencies
2. **Library's `node_modules/@angular/core`** - The library's peer dependencies

This duplication caused the infamous **NG0203 error**:

```
Error: NG0203: inject() must be called from an injection context
```

**Important**: The DI code was mostly correct - the error was a symptom, not the root cause. The real issue was that Angular's DI system saw two different `@angular/core` modules and couldn't reconcile injection tokens between them.

### Why the Application Builder Behaves Differently

The **Application builder uses esbuild** for module bundling, which:

- Resolves modules more strictly than Webpack
- Doesn't deduplicate packages across different resolution paths as aggressively
- Treats each `node_modules` directory independently

When using paths mapping:

- App imports from `node_modules/@angular/core`
- Library (via paths) brings its own `node_modules/@angular/core`
- esbuild sees them as two separate modules → **duplication**

With Webpack, this was silently deduplicated. With esbuild, it causes runtime errors.

---

## Current Architecture

### The Solution: Direct Copy to `node_modules`

The library is now **built separately and copied** into the application's `node_modules` directory, treating it as if it were an npm package.

```
_portal-libs-v25/                      (Library workspace)
├── projects/cmp-portal-core/
│   └── src/lib/                       (Library source code)
├── dist/cmp-portal-core/              (Build output)

aricoma-portal-v20/                    (Application workspace)
├── node_modules/
│   └── cmp-portal-core/               ← Library copied here
├── scripts/
│   └── update-library.ps1             (Update script)
└── .angular/
    └── cache/                         ← Must be cleared on library updates
```

### How It Works

1. **Build the library**: `ng build` in `_portal-libs-v25` → outputs to `dist/cmp-portal-core`
2. **Copy to app**: Run `update-library.ps1` → copies `dist/cmp-portal-core` to app's `node_modules/cmp-portal-core`
3. **Clear Angular cache**: Script automatically deletes `.angular/cache` to force fresh resolution
4. **Import normally**: App imports from `'cmp-portal-core'` like any npm package

### Key Script: `update-library.ps1`

Located at `aricoma-portal-v20/scripts/update-library.ps1`:

```powershell
# 1. Remove old library from node_modules
Remove-Item -Recurse -Force node_modules/cmp-portal-core

# 2. Copy fresh build
Copy-Item -Recurse -Force ..\_portal-libs-v25\dist\cmp-portal-core node_modules/cmp-portal-core

# 3. Clear Angular cache (critical!)
Remove-Item -Recurse -Force .angular/cache
```

**Run with**: `npm run update-lib` (defined in `package.json`)

### Why Cache Clearing Is Essential

Angular's build cache (`.angular/cache/`) uses **file hashing** to determine if rebuild is needed. When you manually update `node_modules`, Angular doesn't detect the change because:

- The cache key is based on file paths and timestamps
- Manual `node_modules` updates bypass npm's cache invalidation
- Old library artifacts remain in cache

**Symptoms without cache clearing**:

- Dev server (`ng serve`) loads old library version
- Production builds work fine (they rebuild from scratch)
- Confusing "why isn't my library change showing up?" bugs

**Solution**: Delete `.angular/cache` after every library update.

---

## Why Alternative Approaches Don't Work

### 1. npm Workspaces (Considered but Rejected)

**Why not use npm workspaces?**

```json
{
  "workspaces": ["aricoma-portal-v20", "_portal-libs-v25"]
}
```

**Problem**: The library is **shared across multiple application projects**, not just one:

```
portaly/
├── aricoma-portal-v20/      (Client A)
├── client-b-portal-v20/     (Client B)
├── client-c-portal-v20/     (Client C)
└── _portal-libs-v25/        (Shared library)
```

npm workspaces are designed for **monorepos with a single root**. Each client app is a separate workspace root, so workspaces won't work across this structure.

### 2. Publishing to npm (Unnecessary Overhead)

**Why not publish `cmp-portal-core` to npm (or private registry)?**

- **Solo developer**: Only one person (me) works on this project currently
- **High coupling**: Library and apps evolve together; breaking changes are frequent
- **Deployment overhead**: Would require versioning, publishing, updating `package.json` for every change
- **No external consumers**: The library is not used outside these client portals

**Verdict**: Publishing adds complexity without benefits for this use case.

### 3. TypeScript Paths (Broken with Application Builder)

Already explained above - causes Angular Core duplication with esbuild.

---

## Development Workflow

### Initial Setup

1. **Install dependencies in both workspaces**:

   ```bash
   cd _portal-libs-v25
   npm install

   cd ../aricoma-portal-v20
   npm install
   ```

2. **Build library for first time**:

   ```bash
   cd _portal-libs-v25
   npm run build
   ```

3. **Copy library to app**:
   ```bash
   cd ../aricoma-portal-v20
   npm run update-lib
   ```

### Making Library Changes

**Workflow**:

1. Make changes in `_portal-libs-v25/projects/cmp-portal-core/src/`
2. Build library:
   ```bash
   cd _portal-libs-v25
   npm run build
   ```
3. Update app:
   ```bash
   cd ../aricoma-portal-v20
   npm run update-lib  # Copies library + clears cache
   ```
4. Restart dev server (if running):
   ```bash
   ng serve
   ```

**Important**: Always run `update-lib` after building the library, even if dev server is running. The cache clearing ensures changes are picked up.

### Production Builds

Production builds work seamlessly:

```bash
cd aricoma-portal-v20
npm run build  # or ng build --configuration production
```

**No special steps needed** - production builds always use fresh `node_modules` content.

---

## How Services Are Shared

### The TranslateService Pattern

Both the app and library use `@ngx-translate/core`, but they share a **single instance** of `TranslateService`. Here's how:

**In App Module** (`aricoma-portal-v20/src/app/app.module.ts`):

```typescript
imports: [
  TranslateModule.forRoot({
    loader: {
      provide: TranslateLoader,
      useClass: MergedTranslateLoader,
      deps: [HttpClient],
    },
  }),
];
```

**In Library Module** (`cmp-portal-core/src/lib/cmp-portal-core.module.ts`):

```typescript
imports: [
  TranslateModule, // NOT forRoot()!
];
```

### How Singleton Services Work Across Library Boundary

1. **Root Injector**: `TranslateModule.forRoot()` in the app registers `TranslateService` as a **singleton in the root injector**
2. **Library Imports**: Library only imports `TranslateModule` (without providers)
3. **Injector Hierarchy**: When library components inject `TranslateService`, Angular:
   - Checks component injector → not found
   - Checks module injector → not found (library didn't provide it)
   - Walks up to root injector → **found!** (from app's `forRoot()`)
   - Returns the singleton instance
4. **Same Package**: Since library is in `node_modules/cmp-portal-core` with `@ngx-translate/core` as peer dependency, npm ensures only one `@ngx-translate/core` installation exists

**Key Principle**: Only call `forRoot()` in the app; library modules import without providers.

### Other Shared Services

The same pattern applies to all services from the library:

- `DataService`, `AuthService`, `CoursesService` (library services) - Provided in library via `providedIn: 'root'`
- App components and library components both inject the same instances
- No manual passing via injection tokens needed (old approach removed)

---

## Troubleshooting

### Issue: Library Changes Not Showing in Dev Server

**Symptoms**:

- Built library with new changes
- Ran `ng serve`
- Old library version still loads

**Solution**:

```bash
npm run update-lib  # Clears cache automatically
ng serve
```

**Why**: Angular cache wasn't invalidated. Always run `update-lib` after library builds.

### Issue: NG0203 Error After Library Update

**Symptoms**:

```
Error: NG0203: inject() must be called from an injection context
```

**Likely Causes**:

1. **Library not copied properly** - check `node_modules/cmp-portal-core` exists
2. **Multiple Angular Core versions** - run `npm ls @angular/core` to verify only one version
3. **Cache issue** - delete `.angular/cache` manually and restart

**Solution**:

```bash
# Full reset
cd aricoma-portal-v20
rm -rf node_modules/.angular/cache
npm run update-lib
ng serve
```

### Issue: Library Build Fails

**Symptoms**:

```
Error: Cannot find module '@angular/core'
```

**Solution**:

```bash
cd _portal-libs-v25
rm -rf node_modules
npm install
npm run build
```

### Issue: Different Behavior in Dev vs Production

**Symptoms**:

- Dev server shows old library version
- Production build works correctly

**Explanation**:

- Production builds (`ng build --configuration production`) always rebuild from scratch
- Dev server (`ng serve`) uses incremental builds with caching
- Cache isn't invalidated when `node_modules` change manually

**Solution**: Always run `npm run update-lib` after library changes.

---

## Migration History

### Before: TypeScript Paths (Pre-Application Builder)

```json
// tsconfig.json
{
  "paths": {
    "cmp-portal-core": ["../_portal-libs-v25/dist/cmp-portal-core"]
  }
}
```

**Worked with**: Webpack builder (`@angular-devkit/build-angular:browser`)  
**Broke with**: Application builder (`@angular-devkit/build-angular:application`)  
**Reason**: esbuild's stricter module resolution caused duplicate Angular Core

### Current: Direct Copy (Application Builder Compatible)

- Library built to `dist/cmp-portal-core`
- Copied to app's `node_modules/cmp-portal-core`
- No tsconfig paths, no workspaces, no npm publishing
- Cache clearing ensures fresh library loads

**Works with**: Application builder (esbuild), all Angular versions  
**Trade-off**: Manual update step required (`npm run update-lib`)

---

## Summary

| Aspect                    | Approach                                               |
| ------------------------- | ------------------------------------------------------ |
| **Library location**      | `node_modules/cmp-portal-core` (copied, not symlinked) |
| **Update mechanism**      | `npm run update-lib` script                            |
| **Cache invalidation**    | Automatic (script deletes `.angular/cache`)            |
| **Service sharing**       | Angular DI hierarchy (`forRoot()` pattern)             |
| **Build compatibility**   | Application builder (esbuild) ✓                        |
| **Multi-project support** | Yes (library shared across client portals)             |
| **npm publishing**        | No (unnecessary for solo dev)                          |
| **Development overhead**  | Minimal (one script to run)                            |

**Key Takeaway**: This approach treats the library as a local npm package, avoiding the pitfalls of paths mapping while maintaining simplicity for a solo developer managing multiple client projects.
