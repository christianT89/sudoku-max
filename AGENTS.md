# AGENTS.md

## Project overview
This is a React + TypeScript frontend game application. This application allow user to do two tasks: Play a daily sudoku game or resolve any sudoku by providing a picture.

## Setup commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Production build: `pnpm build`
- Vitest unit tests: `pnpm test`
- Playwright end-to-end tests: `pnpm test:e2e`
- Lint: `pnpm lint`

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

## Commits
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`
- Keep PRs small and focused on one feature or fix

## PR instructions
- Title format: [<project_name>] <Title>
- Always run `pnpm lint` and `pnpm test` before committing.
- Keep commits focused — one logical change per commit.