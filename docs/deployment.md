# Deploy Nimvelis to Cloudflare Workers

Nimvelis Aurora is a static React SPA deployed with the Cloudflare Vite plugin and Workers
Static Assets. It does not require a server entry point, secrets, databases, buckets, or other
Cloudflare resources.

## Deploy to Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chatgptuk/nimvelis)

The deployment page lets you choose:

- the GitHub repository that Cloudflare creates for your copy;
- the Worker name used for the deployment;
- the Cloudflare account that owns the Worker.

Cloudflare reads `package.json` and `wrangler.jsonc`, runs the build through Workers Builds, and
deploys the generated static assets. The copied repository stays in your account, so you can
customize Nimvelis and use Workers Builds for later deployments.

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

The Cloudflare Vite plugin creates the deployable Worker configuration during `npm run build`.
The SPA fallback in `wrangler.jsonc` ensures that an unknown browser route serves `index.html`
instead of returning an asset 404.

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

Aurora 0.1 stores windows, Memo content, appearance, and wallpaper in that browser's local
storage. Deploying the app does not synchronize state across browsers or devices.
