// A tiny static file server for the game/ folder (Node 22, standard library
// only), so the entry can be played locally with no build step:
//
//   node serve.ts                    → http://localhost:8080
//   node serve.ts --port 8902        → http://localhost:8902
//   node serve.ts --host 0.0.0.0     → reachable on the LAN (default is loopback)
//
// It only serves files inside game/, sends the MIME types a browser game
// needs, and answers 403/404 for anything else. This is a dev convenience,
// not a server for the internet: no caching headers beyond no-store, no
// directory listings, no range requests.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));

const BY_TYPE: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

function flagValue(name: string, fallback: string): string {
  const at = process.argv.indexOf(name);
  return at === -1 || at + 1 >= process.argv.length ? fallback : process.argv[at + 1];
}

function pickPort(): number {
  const wanted = Number(flagValue('--port', '8080'));
  return Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;
}

// Resolve a request path to a file inside game/, or null when it escapes.
function insideGame(requestPath: string): string | null {
  const cleaned = requestPath.endsWith('/') ? `${requestPath}index.html` : requestPath;
  const file = resolve(join(root, normalize(cleaned)));
  if (file !== root && !file.startsWith(root + sep)) return null;
  return file;
}

const port = pickPort();
const host = flagValue('--host', '127.0.0.1');
createServer((request, response) => {
  let pathname = '/';
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  const file = insideGame(pathname);
  if (file === null) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let size: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': BY_TYPE[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, host, () => {
  console.log(`game/ is on http://${host}:${port}`);
});
