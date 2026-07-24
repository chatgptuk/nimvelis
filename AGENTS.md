# Nimvelis Repository Instructions

## Product

Nimvelis is a browser-native personal workspace with a desktop interface.

It is inspired by familiar desktop interaction patterns, but it is not a macOS emulator or Apple product. Do not use Apple logos, proprietary icons, wallpapers, application names, bundled assets, or copied interface resources.

The current release is Nimvelis Aurora 0.5.

## Current Scope

The current milestone is a usable local-first desktop.

Build only:

- Desktop shell
- Top menu bar
- Shelf
- Window manager
- App registry
- IndexedDB virtual file system
- Files
- Text editor
- Local image, PDF, audio, and video preview
- Global application and file search
- Calculator
- Memo
- Settings
- Vela text assistant through a native Cloudflare Workers AI binding
- Movable, persistent desktop icons
- Local persistence
- Installable offline shell
- Light and dark appearance
- Automated tests

Do not add authentication, D1, R2, Durable Objects, third-party apps, or collaboration unless the task explicitly requests them. Vela is the only current AI boundary and must use the native Workers AI binding with a server-side model allowlist.

## Architecture

Maintain clear boundaries between:

- System shell
- Window manager
- Application registry
- Design system
- System applications
- Persistence adapters
- Shared types

System applications must not directly manipulate global window state. They must interact with the system through defined APIs.

Do not place unrelated system behavior inside `App.tsx`.

Use dependency inversion for persistence and file-system implementations so local and cloud adapters can be exchanged later.

## Window Manager

- Represent every open window as a normalized record.
- Every window must have a unique instance ID.
- Support multiple instances when permitted by the application manifest.
- Use Pointer Events for dragging and resizing.
- Use `requestAnimationFrame` for high-frequency visual updates.
- Prefer CSS transforms while dragging.
- Commit final bounds after the interaction ends.
- Preserve keyboard and accessibility behavior.
- Do not introduce a third-party desktop or window-manager library.

## UI Rules

- Use React and TypeScript.
- Use CSS variables for design tokens.
- Use CSS Modules or well-scoped styles.
- Avoid hard-coded repeated colors, radii, spacing, shadows, and typography.
- Support light and dark appearances.
- Respect `prefers-reduced-motion`.
- Do not copy macOS assets pixel for pixel.
- Use `system-ui` as the default font stack.
- Avoid unnecessary UI frameworks.

## State

- Use Zustand for client-side system state.
- Keep transient drag state separate from persisted window state.
- Use selectors to prevent unnecessary whole-desktop rerenders.
- Persist only stable user state.
- Do not persist temporary animation or pointer state.

## Quality

All code must:

- Pass TypeScript checking
- Pass linting
- Pass unit tests
- Build successfully
- Avoid console errors
- Include meaningful accessible labels
- Handle invalid or missing persisted state safely

Add tests for system behavior, not implementation details.

## Agent Workflow

Before changing code:

1. Inspect the relevant files.
2. State the proposed implementation boundaries.
3. Identify risks or conflicts with existing architecture.

While implementing:

1. Keep changes scoped to the requested milestone.
2. Prefer small composable modules.
3. Do not silently replace established architecture.
4. Do not add dependencies without explaining why they are needed.
5. Do not leave placeholder implementations presented as complete.

After implementing:

1. Run formatting, type checking, tests, and the production build.
2. Fix failures caused by the change.
3. Summarize changed files and architectural decisions.
4. Report any remaining limitations honestly.

## Expected Commands

- `npm run dev`
- `npm run format`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npm run check`
- `npm run deploy`
