# Nimvelis

**Your world, anywhere.**

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chatgptuk/nimvelis)
[![CI](https://github.com/chatgptuk/nimvelis/actions/workflows/ci.yml/badge.svg)](https://github.com/chatgptuk/nimvelis/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Nimvelis Aurora 0.1 is a browser-native personal workspace with a desktop interface. The
current milestone is intentionally local-first: a custom window manager, desktop shell, app
registry, three system applications, appearance controls, and durable browser persistence.

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

No account ID, API token, environment variable, database, or storage bucket is required. Future
pushes to the generated repository can be deployed automatically by Workers Builds.

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
resource bindings. `assets.not_found_handling` is set to `single-page-application`, so browser
routes fall back to `index.html`.

## Scope

Aurora 0.1 does not include accounts, cloud files, AI, collaboration, or third-party apps.
See [`docs/architecture.md`](docs/architecture.md) for the component boundaries and data flow.

## License

Nimvelis is available under the [MIT License](LICENSE). You may use, modify, distribute, and
commercialize the software while preserving the copyright and license notice.
