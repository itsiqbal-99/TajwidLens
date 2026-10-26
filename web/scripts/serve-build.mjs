import {createServer} from 'node:http';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import serve from 'next/dist/compiled/serve-handler/index.js';

const root = resolve(import.meta.dirname, '../out');
const port = Number(process.env.PORT || 3000);
if (!existsSync(resolve(root, 'index.html'))) {
  console.error('Hasil build belum tersedia. Jalankan npm run build terlebih dahulu.');
  process.exit(1);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT harus berupa angka antara 1 dan 65535.');
  process.exit(1);
}

// Reuse Next's bundled static handler for local build preview; no separate server dependency.
const server = createServer((request, response) => {
  serve(request, response, {public: root, cleanUrls: true, trailingSlash: true, directoryListing: false})
    .catch(() => {response.statusCode = 500; response.end('Gagal memuat hasil build.');});
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} sedang dipakai. Hentikan server dev pada port tersebut terlebih dahulu.`
    : `Server gagal dijalankan: ${error.message}`);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`Hasil build: http://localhost:${port}`));
