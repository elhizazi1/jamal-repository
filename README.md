# Jamal El Hizazi Repository · مستودع جمال الحزازي

Repository ID: `me.elhizazi.jamal.github.repository` · Extension: `me.elhizazi.jamal.github.repository.example`

```
repository.json                      ← the file RawanIDE / Market Plus reads
index.html                           ← repository page (GitHub Pages)
icon.svg
assets/site.css, site.js             ← shared by both pages (no external requests)
extension-src/                       ← source of the extension (manifest.json, assets/icon.svg, README.md)
extensions/<id>/<version>/           ← same layout as the official repository
    <id>-<version>.r1   icon.svg   marketplace.json   index.html (extension page)
tools/build.mjs                      ← packs the .r1, computes SHA-256 + size, rewrites repository.json
repo.config.json                     ← owner, repo, branch, Market Plus verification code
```

## نشر المستودع وتوثيقه (Publish and verify)

1. أنشئ مستودع GitHub عامًا باسم `jamal-repository` (أو غيّر الاسم في `repo.config.json`) وارفع كل هذه الملفات.
2. عدّل `repo.config.json`: ضع اسم مستخدم GitHub في `owner`، ثم شغّل `node tools/build.mjs`، ثم ارفع التغييرات.
3. فعّل GitHub Pages (Settings ← Pages ← Deploy from branch ← `main` / root) لتعمل صفحتا الموقع.
4. في موقع Market Plus: اربط حساب GitHub ثم اختر «Claim repository» بالمعرّف `me.elhizazi.jamal.github.repository` ورابط المستودع.
5. انسخ رمز التحقق الذي يعطيك إياه Market Plus إلى `"verification"` في `repo.config.json`، ثم شغّل `node tools/build.mjs` وارفع التغيير، ثم اضغط التحقق في الموقع.
6. بعد التوثيق يتحول ختم الصفحة تلقائيًا إلى «موثّق»، وتظهر الإضافة في التطبيق من تبويب المستودعات.

Every new version: bump `version` in `extension-src/manifest.json`, add its release notes, run `node tools/build.mjs`, commit.
Never edit a published `.r1`: Market Plus pins the SHA-256 of each version and suspends a repository whose published bytes change.

## ملاحظة
هذا المثال الحي على GitHub، وله نظير على GitLab بمعرّفات مختلفة (`me.elhizazi.jamal.repository`) لأن المعرّف يُوثَّق مرة واحدة فقط في Market Plus.

---
Jamal El Hizazi · GitHub: [@elhizazi1](https://github.com/elhizazi1) · https://jamal.elhizazi.me · jamal@elhizazi.me
