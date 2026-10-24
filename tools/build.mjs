#!/usr/bin/env node
// Builds the repository: packs extension-src/ into a .r1 (or reuses the published one), computes its SHA-256 and size, and writes
//   - extensions/<id>/<version>/<id>-<version>.r1, <icon>, marketplace.json, index.html (page data)
//   - repository.json (the file RawanIDE / MarketPlace reads)
// and refreshes the data embedded in index.html, about/index.html and the current extension page so the pages also work offline.
//
// Usage:  node tools/build.mjs          (no dependencies, Node 18+)
// Edit repo.config.json first: owner, repo, branch, and the MarketPlace verification code once you have it.

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const writeJson = (p, v) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), JSON.stringify(v, null, 2) + '\n') }

const REPOSITORY = {
  id: 'me.elhizazi.jamal.github.repository',
  name: 'Jamal El Hizazi Repository',
  publisher: 'Jamal El Hizazi',
  description: 'Extensions for RawanIDE by Jamal El Hizazi.',
  i18n: {
    ar: { name: 'مستودع جمال الحزازي', description: 'إضافات لـ RawanIDE من تطوير جمال الحزازي.' },
    en: { name: 'Jamal El Hizazi Repository', description: 'Extensions for RawanIDE by Jamal El Hizazi.' },
    'zh-CN': { name: 'Jamal El Hizazi 扩展仓库', description: 'Jamal El Hizazi 为 RawanIDE 开发的扩展。' },
    'zh-TW': { name: 'Jamal El Hizazi 擴充功能倉庫', description: 'Jamal El Hizazi 為 RawanIDE 開發的擴充功能。' },
  },
}

const warn = []
const fail = (m) => { console.error('✗ ' + m); process.exit(1) }

// ---------- config ----------
const cfg = JSON.parse(read('repo.config.json'))
for (const k of ['owner', 'repo', 'branch']) if (!/^[A-Za-z0-9._-]+$/.test(String(cfg[k] || ''))) fail(`repo.config.json: "${k}" is missing or invalid`)

// ---------- extension ----------
const manifest = JSON.parse(read('extension-src/manifest.json'))
const ID = /^[a-z0-9][a-z0-9._-]{2,127}$/
if (!ID.test(manifest.id)) fail('extension id is invalid')
if (!ID.test(REPOSITORY.id)) fail('repository id is invalid')
if (!/^[0-9A-Za-z][0-9A-Za-z.+_-]{0,63}$/.test(manifest.version)) fail('extension version is invalid')
const RUNTIME = manifest.runtime == null ? null : manifest.runtime // language packs (data only) have no runtime
if (RUNTIME !== null && RUNTIME !== 'declarative' && RUNTIME !== 'hosted-js') fail('community repositories allow only "declarative", "hosted-js" or no runtime')
const ICON_SRC = String(manifest.icon || '')
if (!ICON_SRC || !fs.existsSync(path.join(root, 'extension-src', ICON_SRC))) fail(`manifest icon "${ICON_SRC}" not found in extension-src/`)
const ICON_NAME = path.posix.basename(ICON_SRC)
const languages = ((manifest.localization && manifest.localization.languages) || []).map((l) => l.nativeName || l.name)
const BLOCKED = ['TERMINAL_ACCESS', 'PROCESS_EXECUTION', 'DEVICE_FILES_READ', 'DEVICE_FILES_WRITE']
if ((manifest.permissions || []).some((p) => BLOCKED.includes(p))) fail('sensitive permissions are not allowed for community extensions')

// ---------- zip (deterministic: sorted names, fixed timestamps) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const DOS_TIME = 0
const DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 22

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return walk(full, base)
    if (e.name === '.DS_Store') return []
    return [{ name: path.relative(base, full).split(path.sep).join('/'), data: fs.readFileSync(full) }]
  }).sort((a, b) => (a.name < b.name ? -1 : 1))
}

function makeZip(entries) {
  const locals = [], central = []
  let offset = 0
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8')
    const packed = zlib.deflateRawSync(data, { level: 9 })
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8)
    local.writeUInt16LE(DOS_TIME, 10); local.writeUInt16LE(DOS_DATE, 12); local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28)
    locals.push(local, nameBuf, packed)
    const c = Buffer.alloc(46)
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10)
    c.writeUInt16LE(DOS_TIME, 12); c.writeUInt16LE(DOS_DATE, 14); c.writeUInt32LE(crc, 16)
    c.writeUInt32LE(packed.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nameBuf.length, 28)
    c.writeUInt32LE(offset, 42)
    central.push(c, nameBuf)
    offset += 30 + nameBuf.length + packed.length
  }
  const centralBuf = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, centralBuf, end])
}

const entries = walk(path.join(root, 'extension-src'))
if (!entries.some((e) => e.name === 'manifest.json')) fail('extension-src/manifest.json is missing')
const folder = `extensions/${manifest.id}/${manifest.version}`
const fileName = `${manifest.id}-${manifest.version}.r1`
fs.mkdirSync(path.join(root, folder), { recursive: true })

// A published .r1 is immutable: MarketPlace pins its SHA-256, and compressed bytes can differ between Node versions.
// If the file already exists and its contents match extension-src, its exact bytes are reused (same SHA-256 everywhere).
// If extension-src changed without a version bump, the build stops instead of silently changing a published file.
function zipCrcs(buf) {
  const map = new Map()
  let p = buf.readUInt32LE(buf.length - 6) // central directory offset (archive has no trailing comment)
  while (buf.readUInt32LE(p) === 0x02014b50) {
    const crc = buf.readUInt32LE(p + 16), n = buf.readUInt16LE(p + 28), x = buf.readUInt16LE(p + 30), c = buf.readUInt16LE(p + 32)
    map.set(buf.toString('utf8', p + 46, p + 46 + n), crc)
    p += 46 + n + x + c
  }
  return map
}
const target = path.join(root, folder, fileName)
let pkg
if (fs.existsSync(target)) {
  const existing = fs.readFileSync(target)
  const have = zipCrcs(existing)
  const same = have.size === entries.length && entries.every((e) => have.get(e.name) === crc32(e.data))
  if (!same) fail(`${fileName} already exists and extension-src has changed. Bump "version" in extension-src/manifest.json to publish a new version (never edit a published .r1).`)
  pkg = existing
  console.log(`= reusing existing ${fileName} (unchanged contents)`)
} else {
  pkg = makeZip(entries)
  fs.writeFileSync(target, pkg)
}
const sha256 = crypto.createHash('sha256').update(pkg).digest('hex')
const sizeBytes = pkg.length
// writeFileSync instead of copyFileSync: copyfile fails with EPERM on some Android/Termux setups
fs.writeFileSync(path.join(root, folder, ICON_NAME), fs.readFileSync(path.join(root, 'extension-src', ICON_SRC)))

// ---------- links ----------
const rawBase = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}`
const repositoryUrl = `https://github.com/${cfg.owner}/${cfg.repo}`
const pagesUrl = `https://${cfg.owner.toLowerCase()}.github.io/${cfg.repo}/`
const downloadUrl = `${rawBase}/${folder}/${fileName}`
const i18n = manifest.localizedMetadata
if (!i18n || !i18n.en) fail('extension-src/manifest.json: localizedMetadata.en is required')
const RELEASE_DATE = '2026-10-22'
const CHANGELOG = {
  en: 'Initial release of the French language pack.',
  ar: 'الإصدار الأولي لحزمة اللغة الفرنسية.',
  fr: 'Version initiale du pack de langue française.',
}
const TAGS = ['language-pack', 'french']
const contributes = manifest.localization ? ['language-pack'] : []

// ---------- repository.json ----------
const repositoryJson = {
  protocol: '1.0',
  id: REPOSITORY.id,
  name: REPOSITORY.name,
  publisher: REPOSITORY.publisher,
  description: REPOSITORY.description,
  homepageUrl: pagesUrl,
  repositoryUrl,
  icon: `${rawBase}/icon.svg`,
  // The code MarketPlace gives you when you claim this repository. Needed once, until it shows as verified.
  verification: cfg.verification || 'REPLACE_WITH_MARKET_PLUS_CODE',
  i18n: REPOSITORY.i18n,
  extensions: [
    {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      publisher: manifest.publisher,
      description: manifest.description,
      category: manifest.category,
      icon: `${rawBase}/${folder}/${ICON_NAME}`,
      apiVersion: manifest.apiVersion,
      runtime: RUNTIME,
      permissions: manifest.permissions || [],
      sizeBytes,
      sha256,
      downloadUrl,
      homepageUrl: `${pagesUrl}${folder}/`,
      documentationUrl: `${pagesUrl}${folder}/`,
      tags: TAGS,
      changelog: CHANGELOG.en,
      i18n,
    },
  ],
}
writeJson('repository.json', repositoryJson)

// ---------- marketplace.json (same layout as the official repository) ----------
writeJson(`${folder}/marketplace.json`, {
  schemaVersion: 2,
  id: manifest.id,
  name: manifest.name,
  description: manifest.description,
  category: manifest.category,
  publisher: manifest.publisher,
  version: manifest.version,
  apiVersion: manifest.apiVersion,
  runtime: RUNTIME,
  permissions: manifest.permissions || [],
  icon: ICON_NAME,
  package: { file: fileName, size: sizeBytes, sha256 },
  publishedAt: RELEASE_DATE,
  featured: false,
  i18n,
  longDescription: {},
  links: { homepage: `${pagesUrl}${folder}/`, repository: repositoryUrl },
  screenshots: [],
  highlights: {
    commandCount: 0,
    commands: [],
    languages,
    fileLanguages: [],
    contributes,
  },
  releases: {
    [manifest.version]: { date: RELEASE_DATE, notes: CHANGELOG },
  },
})

// ---------- pages: refresh the embedded data (used when repository.json cannot be fetched, e.g. file://) ----------
const pageData = {
  repository: repositoryJson,
  extension: {
    id: manifest.id, name: manifest.name, version: manifest.version, publisher: manifest.publisher, category: manifest.category,
    i18n, runtime: RUNTIME, apiVersion: manifest.apiVersion, permissions: manifest.permissions || [],
    package: { file: fileName, sizeBytes, sha256, downloadUrl },
    changelog: CHANGELOG,
  },
}
const inject = (page, data = pageData) => {
  const full = path.join(root, page)
  if (!fs.existsSync(full)) return
  const html = fs.readFileSync(full, 'utf8')
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  const next = html.replace(/(<!--DATA-->)[\s\S]*?(<!--\/DATA-->)/, () => `<!--DATA--><script type="application/json" id="data">${json}</script><!--/DATA-->`)
  if (next === html && !html.includes(json)) warn.push(`${page}: no <!--DATA--> marker found`)
  fs.writeFileSync(full, next)
}
inject('index.html')
inject(`${folder}/index.html`)
inject('about/index.html', { repository: repositoryJson }) // developer page: repository data only (extension list + MarketPlace check)

// latest-version redirect: extensions/<id>/index.html
fs.writeFileSync(path.join(root, `extensions/${manifest.id}/index.html`),
  `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${manifest.version}/"><title>${manifest.name}</title><a href="${manifest.version}/">${manifest.name} ${manifest.version}</a>\n`)

console.log(`✓ ${fileName}  ${sizeBytes} bytes  sha256 ${sha256}`)
console.log(`✓ repository.json  →  ${repositoryUrl}`)
console.log(`✓ pages            →  ${pagesUrl}`)
for (const w of warn) console.warn('! ' + w)
