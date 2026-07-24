# Deploy Nimvelis to Cloudflare Workers

Nimvelis Aurora is a React SPA with a small Worker API deployed through the Cloudflare Vite
plugin. Static Assets serves the desktop and the native Workers AI binding powers Vela. It does
not require secrets, databases, buckets, or account-specific resource IDs.

## Deploy to Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chatgptuk/nimvelis)

The deployment page lets you choose:

- the GitHub repository that Cloudflare creates for your copy;
- the Worker name used for the deployment;
- the Cloudflare account that owns the Worker.

Cloudflare reads `package.json` and `wrangler.jsonc`, runs the build through Workers Builds, and
deploys the Worker and generated static assets. The `AI` binding is declared in
`wrangler.jsonc`, so the copied repository does not need an API key or manual resource ID. Workers
AI usage belongs to the Cloudflare account selected during deployment and is subject to that
account's pricing and limits. The copied repository stays in your account, so you can customize
Nimvelis and use Workers Builds for later deployments.

## Sync with Nimvelis upstream

Cloudflare creates a normal cloned repository rather than a GitHub fork. GitHub therefore does
not display a fork relationship or provide its usual **Sync fork** button.

### One-click validated sync

The generated repository includes `.github/workflows/sync-upstream.yml`.

1. Open the generated repository on GitHub.
2. Select **Actions**.
3. Select **Sync from Nimvelis upstream**.
4. Select **Run workflow**, choose the default branch, and confirm.

The workflow:

- fetches `https://github.com/chatgptuk/nimvelis.git`;
- merges upstream `main` without discarding downstream commits;
- preserves the generated repository's own GitHub workflow definitions;
- runs `npm ci` and `npm run check`;
- pushes the validated merge to the generated repository's default branch.

Workers Builds sees the resulting push and deploys it using the existing Cloudflare project.
If Git reports a conflict or validation fails, nothing is pushed.

The workflow intentionally does not use a personal access token. GitHub workflow files are
therefore kept unchanged during automated sync.

Repositories created before this workflow was added need one full command-line sync first. If
an organization policy or protected branch blocks the workflow's push, use the command-line
flow below and open a pull request in the generated repository.

### Full sync from the command line

Use a local Git client when you also want upstream changes under `.github/workflows`, or when a
merge conflict needs manual resolution:

```bash
git remote add upstream https://github.com/chatgptuk/nimvelis.git
git fetch upstream
git switch main
git merge upstream/main
npm ci
npm run check
git push origin main
```

If `upstream` already exists, verify it with `git remote -v` instead of adding it again. Resolve
any reported conflicts, rerun the checks, and commit the merge before pushing.

## Deploy with Wrangler

### 1. Clone and install

```bash
git clone https://github.com/chatgptuk/nimvelis.git
cd nimvelis
npm ci
```

### 2. Sign in

```bash
npx wrangler login
npx wrangler whoami
```

The second command confirms which Cloudflare account will receive the Worker.

### 3. Verify and deploy

```bash
npm run check
npm run deploy
```

`npm run check` includes a Wrangler dry run. It validates the upload bundle without changing
anything in your Cloudflare account. `npm run deploy` performs the real deployment.

To override the default Worker name:

```bash
npm run deploy -- --name my-nimvelis
```

The name must be available in the selected Cloudflare account. Wrangler prints the public
`workers.dev` URL and deployment version after a successful upload.

## How the configuration stays portable

The repository deliberately avoids:

- `account_id`;
- custom-domain routes;
- API tokens or secrets;
- D1, R2, KV, Durable Objects, or other resource IDs;
- environment-specific build paths.

The portable configuration does declare the built-in `AI` binding and the generated `ASSETS`
binding. The Cloudflare Vite plugin creates the deployable Worker configuration during
`npm run build`. The Worker handles `/api/vela/chat` first and passes all desktop routes to Static
Assets. The SPA fallback ensures that an unknown browser route serves `index.html` instead of
returning an asset 404.

## Custom domains

Deploy the Worker first. In the Cloudflare dashboard, open the Worker, go to its domain and
route settings, and add a custom domain from a zone in your account. Custom domains are not
committed to this repository because every deployer owns a different Cloudflare zone.

## Troubleshooting

### The Worker name is already taken

Choose another name on the Deploy to Cloudflare setup page, edit the `name` field in
`wrangler.jsonc`, or pass `--name` during CLI deployment.

### Wrangler is using the wrong account

Run:

```bash
npx wrangler whoami
npx wrangler logout
npx wrangler login
```

### A direct browser route returns 404

Confirm that the deployed copy still contains:

```json
{
  "assets": {
    "not_found_handling": "single-page-application"
  }
}
```

### Local desktop state does not appear on another device

Aurora 0.8 stores windows, workspaces, desktop icon positions, preferences (including time zone
and week start), tasks, calendar events, notifications, Vela conversation history and model
choice, Terminal command history, Luma best scores, Memo content, appearance, and wallpaper in
localStorage. Files and their content live in IndexedDB in the same browser. Terminal uses only
those local files and explicit system-app capabilities; it cannot run host or Cloudflare account
commands. Luma never sends gameplay or scores to a server. Network details and Bluetooth devices
are not stored. Deploying the app does not synchronize state across browsers or devices. Vela
sends only its visible conversation to Workers AI when the user sends a message.
