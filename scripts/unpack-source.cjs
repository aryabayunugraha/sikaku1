/* Expand the compact source bundle committed to source/bundle-NN.b64. */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = process.cwd();
const sourceDir = path.join(root, 'source');
const chunks = fs.existsSync(sourceDir)
  ? fs.readdirSync(sourceDir).filter((name) => /^bundle-\d{4}\.b64$/.test(name)).sort()
  : [];
if (!chunks.length) throw new Error(`Source bundle tidak ditemukan di: ${sourceDir}`);
const encoded = chunks.map((name) => fs.readFileSync(path.join(sourceDir, name), 'utf8').replace(/\s+/g, '')).join('');
const tar = zlib.gunzipSync(Buffer.from(encoded, 'base64'));
let offset = 0, written = 0;
const block = 512;
const str = (b, s, n) => b.subarray(s, s + n).toString('utf8').replace(/\0.*$/s, '');
while (offset + block <= tar.length) {
  const h = tar.subarray(offset, offset + block);
  if (h.every((v) => v === 0)) break;
  const name = str(h, 0, 100), prefix = str(h, 345, 155);
  const relative = prefix ? `${prefix}/${name}` : name;
  const rawSize = str(h, 124, 12).trim();
  const size = rawSize ? Number.parseInt(rawSize, 8) : 0;
  const type = String.fromCharCode(h[156] || 48);
  if (!Number.isFinite(size) || size < 0) throw new Error(`Ukuran entry tidak valid: ${relative}`);
  const dest = path.resolve(root, relative);
  if (dest !== root && !dest.startsWith(root + path.sep)) throw new Error(`Path archive di luar project ditolak: ${relative}`);
  if (type === '5') fs.mkdirSync(dest, { recursive: true });
  else if (type === '0' || type === '\0' || type === '7') {
    const begin = offset + block, end = begin + size;
    if (end > tar.length) throw new Error(`Data archive terpotong: ${relative}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, tar.subarray(begin, end));
    written++;
  } else throw new Error(`Jenis entry archive tidak didukung (${type}): ${relative}`);
  offset += block + Math.ceil(size / block) * block;
}
if (!written) throw new Error('Archive kosong atau tidak valid.');
console.log(`SIKAKU Next.js source ready (${written} files).`);
