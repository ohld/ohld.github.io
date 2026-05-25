# VPS Deploy Runbook

This runbook is for deploying the static `okhlopkov.com` container to a new
RU-accessible origin without touching the current Ghost service first.

## Server Choice

Recommended minimum for this static site:

- 2 vCPU;
- 2 GB RAM;
- 20 GB disk;
- Ubuntu 24.04 LTS;
- Docker + Docker Compose plugin;
- public IPv4 that opens from Russia and non-Russia networks.

1 vCPU / 1 GB RAM can serve the final Nginx container, but builds happen on the
VPS in the current workflow. Use 2 GB RAM to avoid fragile Node/Docker builds.

Provider candidates mentioned by Dan: Aezza or Senko. Do not assume a provider
is reachable from Russia; verify before DNS cutover.

## GitHub Setup

Create a GitHub environment named `okhlopkov-vps`.

Required secrets:

- `OKHLOPKOV_VPS_HOST` — server host or IP;
- `OKHLOPKOV_VPS_USER` — SSH user;
- `OKHLOPKOV_VPS_SSH_KEY` — private deploy key;
- `OKHLOPKOV_VPS_PATH` — app path on the server, for example
  `/opt/okhlopkov-site`.

Optional environment vars:

- `OKHLOPKOV_PORT` — defaults to `8080`;
- `OKHLOPKOV_SITE_URL` — defaults to `https://okhlopkov.com`.

## Server Setup

Install Docker and create the app directory:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git rsync
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
sudo mkdir -p /opt/okhlopkov-site
sudo chown "$USER:$USER" /opt/okhlopkov-site
```

If using Caddy on the host, keep the container bound to localhost:

```caddy
okhlopkov.com {
  reverse_proxy 127.0.0.1:8080
}

www.okhlopkov.com {
  redir https://okhlopkov.com{uri} 308
}
```

The edge/proxy must also permanently redirect `http://okhlopkov.com/` to
`https://okhlopkov.com/`.

## Preview Deploy

Use the manual GitHub workflow:

1. Run `Deploy static site to VPS`.
2. Pick the branch/ref that contains the static migration.
3. Wait for the `verify` job to pass.
4. The deploy job syncs the repo, builds the container on the VPS, starts it,
   then verifies the app through an SSH tunnel.

The workflow verifies:

- public-repo safety;
- root-domain static build;
- URL map and sitemap;
- all preserved legacy pages;
- backlink-critical paths;
- browser smoke against the built `dist/`;
- browser smoke against the deployed container through the SSH tunnel;
- real Nginx redirects;
- origin cache headers;
- strict 404 behavior.

Local Docker/Nginx evidence on 2026-05-25: the same image shape passed strict
verification at `http://127.0.0.1:4186` with real `308` redirects, origin cache
headers, 88 legacy pages, 99 sitemap URLs and browser smoke. This does not
replace a deployed preview/RU reachability check, but it proves the container
configuration before VPS deploy.

## Before DNS Cutover

Do not point `okhlopkov.com` at this origin until:

```bash
npm run preflight:okhlopkov
VERIFY_BASE_URL=https://preview-host \
SITE_URL=https://okhlopkov.com \
VERIFY_REQUIRE_STRICT_404=1 \
VERIFY_REQUIRE_REAL_REDIRECTS=1 \
VERIFY_REQUIRE_ORIGIN_HEADERS=1 \
npm run verify:migration
```

Also manually verify the preview from Russia and non-Russia networks.

Run the browser smoke test against the preview host:

```bash
SMOKE_BASE_URL=https://preview-host npm run smoke:browser
```

This checks the key desktop/mobile routes for header/footer presence,
horizontal overflow, canonical URLs, robots meta and console errors.

## After DNS Cutover

Run the live verifier:

```bash
npm run cutover:live
```

This checks edge-level canonical redirects, live migration rules and browser
smoke. It is expected to fail before DNS/Cloudflare points to the static origin.

Submit `https://okhlopkov.com/sitemap.xml` in Google Search Console and Yandex
Webmaster only after the live domain serves the new 99-URL sitemap with
`lastmod` entries.

## Rollback

Rollback is DNS/Cloudflare-level:

1. Point `okhlopkov.com` back to the existing Ghost/Coolify origin.
2. Keep the static VPS container running for debugging.
3. Save verifier output and affected URL map rows.
4. Fix the static branch, redeploy preview, then retry cutover.
