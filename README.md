# Nimvelis

**Your world, anywhere.**

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chatgptuk/nimvelis)
[![CI](https://github.com/chatgptuk/nimvelis/actions/workflows/ci.yml/badge.svg)](https://github.com/chatgptuk/nimvelis/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Nimvelis Aurora 0.8 is a browser-native personal workspace with a desktop interface. It combines
a local-first window manager, IndexedDB file system, Files, Text, Tasks, Calendar, Clock,
Connections, Terminal, Luma, local media preview, global search, system-wide personalization, and
an installable offline shell with Vela, an optional text assistant powered by Cloudflare Workers
AI.

Nimvelis is an independent project and is not affiliated with or endorsed by Apple Inc. Its
marks, icons, wallpaper, interface assets, naming, and visual system are original to Nimvelis;
Apple assets and SF Symbols are not included.

## Deploy your own

### One click

Click **Deploy to Cloudflare** above. Cloudflare will:

1. Ask you to sign in to Cloudflare and GitHub.
2. Create a copy of this repository in your GitHub account.
3. Let you choose your repository name and Worker name.
4. Build and deploy the app with Workers Builds.

No account ID, API token, environment variable, database, or storage bucket is required. The
native Workers AI binding is created from `wrangler.jsonc` and inference is billed to, and limited
by, the Cloudflare account that deploys the Worker. Future pushes to the generated repository can
be deployed automatically by Workers Builds.

### Receive upstream updates

Cloudflare creates an independent cloned repository, not a GitHub fork. The generated repository
therefore includes a manual **Sync from Nimvelis upstream** workflow:

1. Open the **Actions** tab in your generated GitHub repository.
2. Select **Sync from Nimvelis upstream**.
3. Choose **Run workflow**.

The workflow fetches `chatgptuk/nimvelis`, merges compatible changes, runs the full validation
suite, and pushes only when validation succeeds. A successful push is then deployed by Workers
Builds. Your commits are preserved; a merge conflict stops the workflow without changing the
repository.

For full Git control, including workflow-file updates, follow the
[upstream synchronization guide](docs/deployment.md#sync-with-nimvelis-upstream).

### From the command line

Requirements: Node.js 20 or newer and a Cloudflare account.

```bash
npm ci
npx wrangler login
npm run build
npm run deploy
```

To choose a different Worker name without editing `wrangler.jsonc`:

```bash
npm run deploy -- --name my-nimvelis
```

Cloudflare prints the resulting `workers.dev` URL when deployment completes. You can then attach
a custom domain from the Worker settings in the Cloudflare dashboard.

See [the deployment guide](docs/deployment.md) for the full flow and troubleshooting.

## Local development

| Command            | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `npm run dev`      | Start the local Cloudflare Vite development server                       |
| `npm run check`    | Run formatting, lint, types, unit tests, build, and a dry-run deployment |
| `npm run test:e2e` | Run Playwright desktop interaction tests                                 |
| `npm run preview`  | Preview a production build locally                                       |
| `npm run deploy`   | Deploy the existing production build with Wrangler                       |

The Worker configuration intentionally contains no account-specific IDs, routes, secrets, or
resource IDs. It declares only portable `AI` and static asset bindings.
`assets.not_found_handling` is set to `single-page-application`, so browser routes fall back to
`index.html`.

## What works today

- Organize windows across named workspaces, use Overview to switch tasks, snap windows left or
  right, move desktop icons with mouse or touch, and use per-app Shelf menus.
- Plan private tasks with dates and priorities, schedule local calendar events beside task due
  dates, and use world clocks, a focus timer, stopwatch, and laps without creating an account.
- Inspect online state and browser-provided connection quality, measure same-origin latency, and
  connect an explicitly approved Bluetooth Low Energy device from Connections.
- Use Terminal as a multi-instance local shell with history, Tab completion, app launching, system
  information, and commands that operate directly on the IndexedDB virtual file system.
- Take a quiet break with Luma, an original keyboard- and touch-friendly constellation puzzle with
  three board sizes, hints, undo, a timer, and device-local best scores.
- Personalize interface density, desktop icon visibility, time zone, 12/24-hour clock, calendar
  week start, text scale, contrast, motion, appearance, and wallpaper from Settings.
- Chat with Vela through Cloudflare Workers AI, choose between server-approved Llama and Gemma
  models, stream replies, stop generation, copy responses, and keep conversation history locally.
- Multi-select, copy, cut, paste, move, sort, favorite, and drag files between folders; switch
  between list and grid views; browse Recent and undo moves to Trash.
- Edit documents in tabs with automatic local saving, find and replace, Markdown preview, recent
  files, and local recovery snapshots.
- Preview images, PDFs, audio, and video without uploading them.
- Search applications, file names, text content, and system commands with `⌘/Ctrl + K`.
- Open Device space for quick appearance controls, notification history, storage status, offline
  state, install controls, and available app updates.
- Keep window state, preferences, notifications, and IndexedDB files synchronized across open
  Nimvelis tabs with `BroadcastChannel`.
- Inspect the current browser, device, display, and local storage from **About This Device**.
- Install the app and reopen its shell offline after the first production visit.

Aurora 0.8 does not yet include accounts, cloud files, collaboration, or third-party apps.
See [`docs/architecture.md`](docs/architecture.md) for the component boundaries and data flow.

## Device capability boundaries

Connections uses only browser capabilities. When supported, the Network Information API can
provide an estimated connection type, effective quality, downlink, round-trip time, and Data Saver
state. Browsers do not expose nearby Wi-Fi names, saved passwords, or operating-system controls to
Nimvelis.

Web Bluetooth requires HTTPS, a compatible browser, a direct click, and approval through the
browser's own device picker. Nimvelis cannot scan silently and connects only to the selected
Bluetooth Low Energy/GATT device for the current browser session. Date & Time changes Nimvelis
display formatting only; it never changes the operating system clock or time zone.

## Terminal boundary

Terminal is the Nimvelis **Local Shell**, not a remote console or a bridge to the host operating
system. Commands such as `ls`, `cd`, `cat`, `mkdir`, `write`, `mv`, `cp`, `rm`, `open`, `theme`,
and `timezone` use the same capability-shaped System API and IndexedDB virtual file system as the
graphical apps. `rm` moves items to recoverable Trash.

Browsers do not expose arbitrary OS processes, SSH sessions, package managers, or the deploying
Cloudflare account to this app. Terminal therefore rejects host commands such as `sudo`, `ssh`,
`npm`, and `git` with an explicit sandbox explanation instead of pretending they ran.

## AI and privacy

Vela sends the conversation messages shown in its window and the selected model key to
`/api/vela/chat`. The Worker validates the request, maps the key to an approved Cloudflare model,
and streams the Workers AI response back. Vela never reads or uploads Nimvelis files
automatically. Its chat history and model choice stay in the browser's local storage. Prompts are
processed under the deploying Cloudflare account's Workers AI service and policies.

## License

Nimvelis is available under the [MIT License](LICENSE). You may use, modify, distribute, and
commercialize the software while preserving the copyright and license notice.
