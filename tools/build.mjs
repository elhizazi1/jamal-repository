#!/usr/bin/env node
// Builds the repository. For every extension listed in repo.config.json ("extensions") it
//   - packs extension-src/<name>/ into a .r1 (or reuses the published one) and computes its SHA-256 and size
//   - writes extensions/<id>/<version>/<id>-<version>.r1, <icon>, marketplace.json, index.html (page)
// and then writes repository.json (the file RawanIDE / MarketPlace reads) and refreshes the data embedded in
// index.html, about/index.html and every extension page so the pages also work offline.
//
// Usage:  node tools/build.mjs          (no dependencies, Node 18+)
// Edit repo.config.json first: owner, repo, branch, the MarketPlace verification code, and the "extensions" list.

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
// Writes a file and copes with a read-only one (common after unpacking an archive or copying through an Android file manager, which
// makes the build fail with EACCES): an identical file is left alone, otherwise it is made writable, and as a last resort replaced
// (deleting a file only needs its folder to be writable).
function writeFileSafe(p, data) {
  try {
    if (fs.existsSync(p) && fs.readFileSync(p).equals(Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8'))) return
  } catch { /* cannot compare: just try to write */ }
  try { fs.writeFileSync(p, data); return } catch (e) { if (e.code !== 'EACCES' && e.code !== 'EPERM') throw e }
  try { fs.chmodSync(p, 0o644); fs.writeFileSync(p, data); return } catch { /* replace the file instead */ }
  fs.unlinkSync(p)
  fs.writeFileSync(p, data)
}

const writeJson = (p, v) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); writeFileSafe(path.join(root, p), JSON.stringify(v, null, 2) + '\n') }

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
if (!Array.isArray(cfg.extensions) || !cfg.extensions.length) fail('repo.config.json: "extensions" must list at least one extension')

const ID = /^[a-z0-9][a-z0-9._-]{2,127}$/
if (!ID.test(REPOSITORY.id)) fail('repository id is invalid')
const BLOCKED = ['TERMINAL_ACCESS', 'PROCESS_EXECUTION', 'DEVICE_FILES_READ', 'DEVICE_FILES_WRITE']

// ---------- links ----------
const rawBase = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}`
const repositoryUrl = `https://github.com/${cfg.owner}/${cfg.repo}`
const pagesUrl = `https://${cfg.owner.toLowerCase()}.github.io/${cfg.repo}/`

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

// A published .r1 is immutable: MarketPlace pins its SHA-256, and compressed bytes can differ between Node versions.
// If the file already exists and its contents match the extension source, its exact bytes are reused (same SHA-256 everywhere).
// If the source changed without a version bump, the build stops instead of silently changing a published file.
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

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---------- screenshots ----------
// repo.config.json: "screenshots": [{ "file": "01", "caption": { "en": "...", "ar": "..." } }, ...]
// "file" may be a bare number/name ("01": the first of 01.png / 01.webp / 01.jpg / 01.jpeg that exists) or a full file name.
// A listed file that is not there yet is skipped with a notice, so the build works before the pictures are added.
const SHOT_EXT = ['png', 'webp', 'jpg', 'jpeg']
const SHOT_MAX = 8
const SHOT_MAX_BYTES = 2 * 1024 * 1024 // the same limits Market Plus applies to the official extensions' screenshots
function resolveScreenshots(ec, id, where) {
  if (ec.screenshots === undefined) return []
  if (!Array.isArray(ec.screenshots)) fail(`${where}: "screenshots" must be an array`)
  const dir = `extensions/${id}/screenshots`
  const dirPath = path.join(root, dir)
  // What is really in the folder, so a name that differs only in letter case (01.PNG) still matches and a miss can say what was seen.
  const present = fs.existsSync(dirPath) ? fs.readdirSync(dirPath).filter((f) => !f.startsWith('.')) : null
  const out = []
  ec.screenshots.slice(0, SHOT_MAX).forEach((shot, n) => {
    const want = typeof shot === 'string' ? shot : shot && shot.file
    if (typeof want !== 'string' || !/^[A-Za-z0-9._-]{1,80}$/.test(want)) fail(`${where}: screenshots[${n}].file must be a simple file name such as "01"`)
    const wanted = new Set((/\.(png|webp|jpe?g)$/i.test(want) ? [want] : SHOT_EXT.map((e) => `${want}.${e}`)).map((f) => f.toLowerCase()))
    const found = (present || []).find((f) => wanted.has(f.toLowerCase()))
    if (!found) {
      const seen = present === null ? `the folder ${dir}/ does not exist` : present.length ? `it contains: ${present.join(', ')}` : 'the folder is empty'
      warn.push(`${id}: screenshot "${want}" not found in ${dir}/ (${seen}). Expected ${[...wanted].join(' or ')} (skipped)`)
      return
    }
    if (fs.statSync(path.join(dirPath, found)).size > SHOT_MAX_BYTES) { warn.push(`${id}: ${dir}/${found} is over 2 MB (skipped)`); return }
    const caption = {}
    const given = shot && typeof shot === 'object' && shot.caption && typeof shot.caption === 'object' ? shot.caption : {}
    for (const k of Object.keys(given)) if (typeof given[k] === 'string' && given[k].trim()) caption[k] = given[k].trim().slice(0, 200)
    out.push({ file: found, url: `${rawBase}/${dir}/${encodeURIComponent(found)}`, caption })
  })
  if (ec.screenshots.length > SHOT_MAX) warn.push(`${id}: only the first ${SHOT_MAX} screenshots are used`)
  return out
}

// ---------- earlier versions ----------
// Every version already published stays announced in repository.json, so the app can offer it ("Other versions") when an update
// misbehaves. They are read from the folders this tool created earlier (extensions/<id>/<version>/marketplace.json + the .r1 beside it);
// nothing is rebuilt and the .r1 files are never touched, so their SHA-256 stays exactly what Market Place pinned.
const versionCmp = (a, b) => {
  const pa = String(a).split(/[.+_-]/), pb = String(b).split(/[.+_-]/)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? '0', y = pb[i] ?? '0'
    if (x === y) continue
    const nx = /^\d+$/.test(x), ny = /^\d+$/.test(y)
    if (nx && ny) return Number(x) - Number(y)
    return nx ? 1 : ny ? -1 : x.localeCompare(y)
  }
  return 0
}
function olderVersionEntries(manifest, ec) {
  const base = path.join(root, 'extensions', manifest.id)
  if (!fs.existsSync(base)) return []
  const out = []
  for (const version of fs.readdirSync(base)) {
    if (version === manifest.version || !/^[0-9A-Za-z][0-9A-Za-z.+_-]{0,63}$/.test(version)) continue
    const dir = path.join(base, version)
    const metaPath = path.join(dir, 'marketplace.json')
    if (!fs.statSync(dir).isDirectory() || !fs.existsSync(metaPath)) continue
    const fileName = `${manifest.id}-${version}.r1`
    if (!fs.existsSync(path.join(dir, fileName))) { warn.push(`${manifest.id}@${version}: ${fileName} is missing, version not listed`); continue }
    let meta
    try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) } catch { warn.push(`${manifest.id}@${version}: marketplace.json is not valid JSON, version not listed`); continue }
    if (meta.version !== version || meta.id !== manifest.id) { warn.push(`${manifest.id}@${version}: marketplace.json does not match its folder, version not listed`); continue }
    if ((meta.permissions || []).some((p) => BLOCKED.includes(p))) { warn.push(`${manifest.id}@${version}: sensitive permissions, version not listed`); continue }
    const pkg = fs.readFileSync(path.join(dir, fileName))
    const folder = `extensions/${manifest.id}/${version}`
    const notes = meta.releases && meta.releases[version] && meta.releases[version].notes
    out.push({
      id: manifest.id, name: meta.name, version, publisher: meta.publisher, description: meta.description, category: meta.category,
      icon: `${rawBase}/${folder}/${encodeURIComponent(String(meta.icon || 'icon.svg'))}`,
      // Older marketplace.json files of data-only packs (language packs) say runtime null, but a listing must carry one: use what this
      // extension's config lists ("runtimeOverride"), else the file's own value, else "declarative" (what data-only packs are listed as).
      apiVersion: meta.apiVersion, runtime: ec.runtimeOverride ?? meta.runtime ?? 'declarative', permissions: meta.permissions || [],
      sizeBytes: pkg.length, sha256: crypto.createHash('sha256').update(pkg).digest('hex'),
      downloadUrl: `${rawBase}/${folder}/${fileName}`,
      homepageUrl: `${pagesUrl}${folder}/`, documentationUrl: `${pagesUrl}${folder}/`,
      tags: ec.tags,
      ...(notes && typeof notes.en === 'string' && notes.en ? { changelog: notes.en } : {}),
      i18n: meta.i18n,
      ...(ec.license ? { license: ec.license } : {}),
    })
  }
  return out.sort((a, b) => versionCmp(b.version, a.version))
}

// ---------- one extension ----------
const seenIds = new Set()
function buildExtension(ec, index) {
  const where = `repo.config.json: extensions[${index}]`
  if (!/^extension-src\/[A-Za-z0-9._-]+$/.test(String(ec.src || ''))) fail(`${where}: "src" must look like "extension-src/<name>"`)
  if (!fs.existsSync(path.join(root, ec.src, 'manifest.json'))) fail(`${ec.src}/manifest.json is missing`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ec.releaseDate || ''))) fail(`${where}: "releaseDate" must be YYYY-MM-DD`)
  if (!ec.changelog || typeof ec.changelog.en !== 'string' || !ec.changelog.en) fail(`${where}: "changelog.en" is required`)
  if (!Array.isArray(ec.tags) || !ec.tags.every((t) => typeof t === 'string')) fail(`${where}: "tags" must be an array of strings`)
  // optional SPDX licence id for the listing ("MIT"); kept in repo.config.json so it is never lost when repository.json is regenerated
  if (ec.license !== undefined && !(typeof ec.license === 'string' && /^[A-Za-z0-9.+() -]{1,64}$/.test(ec.license))) fail(`${where}: "license" must be a short licence id such as "MIT"`)

  const manifest = JSON.parse(read(`${ec.src}/manifest.json`))
  if (!ID.test(manifest.id)) fail(`${ec.src}: extension id is invalid`)
  if (seenIds.has(manifest.id)) fail(`${ec.src}: extension id ${manifest.id} is used twice`)
  seenIds.add(manifest.id)
  if (!/^[0-9A-Za-z][0-9A-Za-z.+_-]{0,63}$/.test(manifest.version)) fail(`${ec.src}: extension version is invalid`)
  const PACKAGED_RUNTIME = manifest.runtime == null ? null : manifest.runtime // language packs (data only) have no runtime
  // "runtimeOverride" is what repository.json / marketplace.json list when it must differ from the packaged manifest
  // (a published .r1 cannot be edited, so a runtime added to the manifest later can only be listed here until the next version).
  const RUNTIME = ec.runtimeOverride === undefined ? PACKAGED_RUNTIME : ec.runtimeOverride
  if (RUNTIME !== null && RUNTIME !== 'declarative' && RUNTIME !== 'hosted-js') fail(`${ec.src}: community repositories allow only "declarative", "hosted-js" or no runtime`)
  if (RUNTIME !== PACKAGED_RUNTIME) warn.push(`${manifest.id}: listed runtime "${RUNTIME}" differs from the packaged manifest (${PACKAGED_RUNTIME === null ? 'none' : PACKAGED_RUNTIME}). Put "runtime" in the manifest and publish a new version to make them match.`)
  const ICON_SRC = String(manifest.icon || '')
  if (!ICON_SRC || !fs.existsSync(path.join(root, ec.src, ICON_SRC))) fail(`${ec.src}: manifest icon "${ICON_SRC}" not found`)
  const ICON_NAME = path.posix.basename(ICON_SRC)
  const languages = ((manifest.localization && manifest.localization.languages) || []).map((l) => l.nativeName || l.name)
  if ((manifest.permissions || []).some((p) => BLOCKED.includes(p))) fail(`${ec.src}: sensitive permissions are not allowed for community extensions`)
  // Screenshots live OUTSIDE the package (extensions/<id>/screenshots/), so adding or changing them never alters the .r1 or its SHA-256.
  const screenshots = resolveScreenshots(ec, manifest.id, where)
  const i18n = manifest.localizedMetadata
  if (!i18n || !i18n.en) fail(`${ec.src}/manifest.json: localizedMetadata.en is required`)

  const entries = walk(path.join(root, ec.src))
  const folder = `extensions/${manifest.id}/${manifest.version}`
  const fileName = `${manifest.id}-${manifest.version}.r1`
  fs.mkdirSync(path.join(root, folder), { recursive: true })

  const target = path.join(root, folder, fileName)
  let pkg
  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target)
    const have = zipCrcs(existing)
    const same = have.size === entries.length && entries.every((e) => have.get(e.name) === crc32(e.data))
    if (!same) fail(`${fileName} already exists and ${ec.src} has changed. Bump "version" in ${ec.src}/manifest.json to publish a new version (never edit a published .r1).`)
    pkg = existing
    console.log(`= reusing existing ${fileName} (unchanged contents)`)
  } else {
    pkg = makeZip(entries)
    writeFileSafe(target, pkg)
    console.log(`+ created ${fileName}`)
  }
  const sha256 = crypto.createHash('sha256').update(pkg).digest('hex')
  const sizeBytes = pkg.length
  // writeFileSync instead of copyFileSync: copyfile fails with EPERM on some Android/Termux setups
  writeFileSafe(path.join(root, folder, ICON_NAME), fs.readFileSync(path.join(root, ec.src, ICON_SRC)))

  const downloadUrl = `${rawBase}/${folder}/${fileName}`
  const commands = (manifest.commands || []).map((c) => ({ id: c.id, title: c.title, languages: c.languages || [] }))
  const contributes = manifest.localization ? ['language-pack'] : []

  const entry = {
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
    tags: ec.tags,
    changelog: ec.changelog.en,
    i18n,
    ...(ec.license ? { license: ec.license } : {}),
    ...(screenshots.length ? { screenshots: screenshots.map((x) => ({ url: x.url, caption: x.caption })) } : {}),
  }

  // marketplace.json (same layout as the official repository)
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
    publishedAt: ec.releaseDate,
    featured: false,
    i18n,
    longDescription: {},
    links: { homepage: `${pagesUrl}${folder}/`, repository: repositoryUrl },
    screenshots: screenshots.map((x) => ({ url: x.url, caption: x.caption })),
    highlights: {
      commandCount: commands.length,
      commands,
      languages,
      fileLanguages: [],
      contributes,
    },
    releases: {
      [manifest.version]: { date: ec.releaseDate, notes: ec.changelog },
    },
  })

  // the extension's own page: created from the template the first time, afterwards only its embedded data is refreshed
  const pagePath = path.join(root, folder, 'index.html')
  if (!fs.existsSync(pagePath)) {
    const tpl = fs.readFileSync(path.join(root, 'tools/extension-page.template.html'), 'utf8')
    const fill = { TITLE: (i18n.ar && i18n.ar.name) || manifest.name, DESC: i18n.en.description || manifest.description, ICON: ICON_NAME, VERSION: manifest.version }
    writeFileSafe(pagePath, tpl.replace(/\{\{(TITLE|DESC|ICON|VERSION)\}\}/g, (_, k) => escHtml(fill[k])))
    console.log(`+ created ${folder}/index.html`)
  }

  // the redirect extensions/<id>/ → latest version
  writeFileSafe(path.join(root, `extensions/${manifest.id}/index.html`),
    `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${manifest.version}/"><title>${manifest.name}</title><a href="${manifest.version}/">${manifest.name} ${manifest.version}</a>\n`)

  const pageExt = {
    id: manifest.id, name: manifest.name, version: manifest.version, publisher: manifest.publisher, category: manifest.category,
    i18n, runtime: RUNTIME, apiVersion: manifest.apiVersion, permissions: manifest.permissions || [],
    package: { file: fileName, sizeBytes, sha256, downloadUrl },
    changelog: ec.changelog,
    ...(ec.license ? { license: ec.license } : {}),
    ...(screenshots.length ? { screenshots: screenshots.map((x) => ({ src: `../screenshots/${encodeURIComponent(x.file)}`, caption: x.caption })) } : {}),
  }
  if (commands.length) pageExt.commands = commands

  console.log(`✓ ${fileName}  ${sizeBytes} bytes  sha256 ${sha256}`)
  const older = olderVersionEntries(manifest, ec)
  if (older.length) console.log(`  also listed: ${older.map((o) => o.version).join(', ')}`)
  return { entry, older, pageExt, folder }
}

const built = cfg.extensions.map(buildExtension)

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
  extensions: built.flatMap((b) => [b.entry, ...b.older]),
}
writeJson('repository.json', repositoryJson)

// ---------- pages: refresh the embedded data (used when repository.json cannot be fetched, e.g. file://) ----------
const inject = (page, data) => {
  const full = path.join(root, page)
  if (!fs.existsSync(full)) return
  const html = fs.readFileSync(full, 'utf8')
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  const next = html.replace(/(<!--DATA-->)[\s\S]*?(<!--\/DATA-->)/, () => `<!--DATA--><script type="application/json" id="data">${json}</script><!--/DATA-->`)
  if (next === html && !html.includes(json)) warn.push(`${page}: no <!--DATA--> marker found`)
  writeFileSafe(full, next)
}
inject('index.html', { repository: repositoryJson })
inject('about/index.html', { repository: repositoryJson }) // developer page: repository data only (extension list + MarketPlace check)
for (const b of built) inject(`${b.folder}/index.html`, { repository: repositoryJson, extension: b.pageExt })

console.log(`✓ repository.json  →  ${repositoryUrl}  (${built.length} extension${built.length === 1 ? '' : 's'})`)
console.log(`✓ pages            →  ${pagesUrl}`)
for (const w of warn) console.warn('! ' + w)
