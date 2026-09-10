# AGENTS.md

## Project overview
This is a React + TypeScript frontend game application. This application allow user to do two tasks: Play a daily sudoku game or resolve any sudoku by providing a picture.

## ⚠️ Critical: Interactive Commands

**DO NOT RUN these commands directly - they will hang:**

- `pnpm new` - Package generator
- `pnpm delete` - Package deletion
- `pnpm add-entry` - Add custom entry points
- `pnpm changeset` - Create changesets

**Instead:** Ask the user to run these commands and wait for them to complete. Provide clear instructions on what options to select.

**Safe to run (non-interactive):**
- `pnpm install`, `pnpm build`, `pnpm test`, `pnpm verify`
- `pnpm dev`, `pnpm lint`, `pnpm format`
- `pnpm version` (applies changesets)
- `pnpm generate:configs` (regenerates TypeScript configs)

## Setup commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Production build: `pnpm build`
- Vitest unit tests: `pnpm test`
- Playwright end-to-end tests: `pnpm test:e2e`
- Lint: `pnpm lint`

## Package.json Field Order

Standard order for consistency:
```json
{
  "name": "@scope/package-name",
  "version": "0.0.0",
  "description": "...",
  "author": "...",
  "license": "MIT",
  "homepage": "...",
  "repository": {...},
  "bugs": {...},
  "private": true,
  "type": "module",
  "main": "...",
  "module": "...",
  "types": "...",
  "exports": {...},
  "files": [...],
  "publishConfig": {...},
  "scripts": {...},
  "dependencies": {...},
  "devDependencies": {...}
}
```

## Stack
- Next.js 14 with App Router
- Tailwind CSS for styling
- Vitest for unit tests, Playwright for end-to-end

## Code style
- TypeScript strict mode
- Single quotes, no semicolons
- Use functional patterns where possible
- Prefer named exports over default exports
- Use Tailwind utility classes; avoid inline styles
- Use Zod for all runtime validation

## File structure
- `src/app/` — Next.js App Router pages and layouts
- `src/components/` — shared React components
- `src/lib/` — utilities and shared logic
- `src/server/` — server-only code (database, auth)
- `test/` — for test files

## Commits
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`
- Keep PRs small and focused on one feature or fix

## PR instructions
- Title format: [<project_name>] <Title>
- Always run `pnpm lint` and `pnpm test` before committing.
- Keep commits focused — one logical change per commit.

## File Generation

When creating new TypeScript files outside of the generators, remember to:
1. Follow existing naming conventions
2. Add tests in the appropriate test package

## Troubleshooting

### Type Errors in IDE

If you see import errors:
1. Check if `tsconfig.json` in root has path mappings
2. Regenerate configs: `pnpm generate:configs`
3. Restart TypeScript server in your IDE

### Build Failures

If builds fail:
1. Clean artifacts: `pnpm clean`
2. Clear Turbo cache: `pnpm clean:cache`
3. Reinstall dependencies: `rm -rf node_modules pnpm-lock.yaml && pnpm install`

### ATTW Errors

If export validation fails:
- Check that all entry points are listed in `package.json` exports
- Verify `typesVersions` is configured for Node 10 compatibility
- Ensure built files exist in `dist/`