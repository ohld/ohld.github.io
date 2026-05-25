#!/usr/bin/env node
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const distDir = path.resolve(process.env.SMOKE_DIST_DIR || 'dist')
const host = process.env.SMOKE_DIST_HOST || '127.0.0.1'
const requestedPort = Number(process.env.SMOKE_DIST_PORT || 0)

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
}

function assertDistExists() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error(`${distDir}: missing index.html; run a build before smoke:dist`)
    process.exit(1)
  }
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath)
  const normalized = path.posix.normalize(decoded)
  const resolved = path.resolve(distDir, normalized.replace(/^\/+/, ''))
  if (!resolved.startsWith(`${distDir}${path.sep}`) && resolved !== distDir) return null
  return resolved
}

function candidateFiles(urlPath) {
  const resolved = safeResolve(urlPath)
  if (!resolved) return []
  const candidates = [resolved]
  const ext = path.extname(resolved)
  if (!ext) candidates.push(path.join(resolved, 'index.html'))
  if (urlPath.endsWith('/')) candidates.unshift(path.join(resolved, 'index.html'))
  return candidates
}

function sendFile(res, reqMethod, filePath, statusCode = 200) {
  const ext = path.extname(filePath)
  const body = fs.readFileSync(filePath)
  res.writeHead(statusCode, {
    'content-type': contentTypes[ext] || 'application/octet-stream',
    'content-length': body.byteLength,
  })
  if (reqMethod === 'HEAD') {
    res.end()
    return
  }
  res.end(body)
}

function send404(res, reqMethod) {
  const fallback =
    ['404-static.html', '404.html']
      .map((file) => path.join(distDir, file))
      .find((file) => fs.existsSync(file))

  if (fallback) {
    sendFile(res, reqMethod, fallback, 404)
    return
  }

  const body = '<!doctype html><meta name="robots" content="noindex, follow"><title>404</title>'
  res.writeHead(404, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  })
  if (reqMethod === 'HEAD') {
    res.end()
    return
  }
  res.end(body)
}

function createStaticServer() {
  return http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || host}`)
      for (const candidate of candidateFiles(url.pathname)) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          sendFile(res, req.method || 'GET', candidate)
          return
        }
      }
      send404(res, req.method || 'GET')
    } catch {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Bad request')
    }
  })
}

function runSmoke(baseUrl) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['scripts/browser-smoke.mjs'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SMOKE_BASE_URL: baseUrl,
      },
      stdio: 'inherit',
    })
    child.on('exit', (code) => resolve(code || 0))
  })
}

assertDistExists()
const server = createStaticServer()

server.listen(requestedPort, host, async () => {
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : requestedPort
  const baseUrl = `http://${host}:${port}`
  console.log(`Serving ${distDir} at ${baseUrl}`)
  const code = await runSmoke(baseUrl)
  server.close(() => process.exit(code))
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(130))
  })
}
