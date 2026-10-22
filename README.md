# Jamal El Hizazi Repository · مستودع جمال الحزازي (GitHub)

مستودع إضافات RawanIDE على GitHub، يحتوي حاليًا على **حزمة اللغة الفرنسية**. / A RawanIDE extension repository on GitHub, currently hosting the **French Language Pack**.

Repository ID: `me.elhizazi.jamal.github.repository` · Extension: `me.elhizazi.jamal.github.repository.language.french`

المعرّف يُوثَّق مرة واحدة فقط في Market Plus، لذلك لكل نسخة معرّف مختلف. / An ID can be claimed only once in Market Plus, so each copy has its own.

```
repository.json                      ← the file RawanIDE / Market Plus reads · الملف الذي يقرأه التطبيق
index.html                           ← repository page · صفحة المستودع
icon.svg
assets/site.css, site.js             ← shared by both pages (no external requests)
extension-src/                       ← exact contents of the published package (manifest.json, strings/fr.json, icons/, README.md)
extensions/<id>/<version>/           ← <id>-<version>.r1   french-language.webp   marketplace.json   index.html
tools/build.mjs                      ← packs/reuses the .r1, computes SHA-256 + size, rewrites repository.json and marketplace.json
repo.config.json                     ← owner, repo, branch, Market Plus verification code
```

---

## المتطلبات · Requirements

- `git` و Node.js 18+ (في Termux: `pkg install -y git nodejs`).
- حساب GitHub و Personal Access Token: GitHub ← Settings ← Developer settings ← Personal access tokens ← Tokens (classic) ← Generate new token، وفعّل الصلاحية `repo`.
  / A GitHub account and a Personal Access Token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic), scope `repo`.

## 1) النشر الأول · First publish

1. أنشئ مستودعًا **عامًا وفارغًا** باسم `jamal-repository` من https://github.com/new — **بدون** README و`.gitignore` وترخيص.
   / Create a **public, empty** repository named `jamal-repository` at https://github.com/new — **no** README, `.gitignore` or license.

2. جهّز الملفات وعدّل `repo.config.json` (`owner` = اسم مستخدمك، `repo`، `branch`):
   ```bash
   cd jamal-repository          # the folder that contains these files
   nano repo.config.json
   node tools/build.mjs
   ```

3. ارفع الملفات:
   ```bash
   git init -b main
   git config --global --add safe.directory "$PWD"
   git config user.name "Your Name"
   git config user.email "you@example.com"
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<owner>/jamal-repository.git
   git push -u origin main
   ```
   عند السؤال: **Username** = اسم المستخدم، **Password** = الـ Token وليس كلمة مرور الحساب (لا يظهر شيء أثناء اللصق، وهذا طبيعي).
   / Username = your user name, Password = the token (nothing is echoed while pasting).

4. فعّل الموقع · Enable the site:
   افتح `Settings ← Pages`، واختر **Deploy from a branch**، ثم الفرع `main` والمجلد `/ (root)`، واضغط **Save**.
   / Open `Settings → Pages`, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, **Save**.

   الموقع بعد دقيقتين على: `https://elhizazi1.github.io/jamal-repository/`
   ويجب أن يفتح `https://elhizazi1.github.io/jamal-repository/repository.json` في نافذة تصفح خفي (Incognito) بدون تسجيل دخول.

## 2) التوثيق في Market Plus · Verification

1. في موقع Market Plus: اختر «Claim repository» بالمعرّف `me.elhizazi.jamal.github.repository` ورابط المستودع `https://github.com/<owner>/jamal-repository`.
2. انسخ رمز التحقق إلى `"verification"` في **`repo.config.json`** (وليس `repository.json`)، ثم:
   ```bash
   node tools/build.mjs
   git add .
   git commit -m "Add Market Plus verification code"
   git push
   ```
3. انتظر دقيقة حتى يتحدّث الموقع، تأكد أن الرمز ظاهر في `https://elhizazi1.github.io/jamal-repository/repository.json`، ثم اضغط «التحقق» في Market Plus.

> `repository.json` يُولَّد من `repo.config.json`. لا تعدّله يدويًا: أول بناء قادم سيمحو تعديلك. / `repository.json` is generated from `repo.config.json`; do not edit it by hand.

بعد التوثيق يتحول ختم الصفحة تلقائيًا إلى «موثّق»، وتظهر الإضافة في التطبيق من تبويب المستودعات.

## 3) إصدار جديد · A new version

```bash
# 1. bump "version" in extension-src/manifest.json and edit the extension
nano extension-src/manifest.json
# 2. build (creates extensions/<id>/<new version>/ and rewrites repository.json)
node tools/build.mjs
# 3. publish
git add . && git commit -m "Release <version>" && git push
```

**لا تعدّل `.r1` منشورًا أبدًا.** Market Plus يثبّت بصمة SHA-256 لكل إصدار ويوقف المستودع إذا تغيّرت البايتات المنشورة. لذلك `tools/build.mjs` يعيد استخدام الحزمة الموجودة إذا لم يتغير محتوى `extension-src`، ويتوقف بخطأ إذا تغيّر دون رفع `version`.
/ Never edit a published `.r1`. The build reuses the existing package when `extension-src` is unchanged and refuses to run if it changed without a version bump.

## حل المشاكل · Troubleshooting

- **`fatal: detected dubious ownership`** (Termux) — `git config --global --add safe.directory "$PWD"` ثم أعد الأمر.
- **`! [rejected] main -> main (fetch first)`** — المستودع البعيد فيه commits ليست عندك (غالبًا أنشأته مع README أو عدّلت ملفًا من الموقع). نفّذ `git pull origin main --no-rebase --no-edit` ثم `git push`. لا تستعمل `--force`. إن ظهر `CONFLICT` على ملف أضفته أنت، خذ نسختك: `git checkout --ours <file>` ثم `git add <file>` و`git commit --no-edit`.
- **`EPERM: operation not permitted, copyfile`** (Termux) — أُصلح في `tools/build.mjs` الحالي؛ حدّث الملف إن كانت عندك نسخة أقدم.
- **توقف البناء بـ `extension-src has changed`** — ارفع `version` في `extension-src/manifest.json` (انظر القسم 3).
- **الدفع فشل لكن أوامر `add` و`commit` اكتملت** — ادفع بعد إصلاح السبب؛ لا تعد `git init`.

---
Jamal El Hizazi · GitHub: [@elhizazi1](https://github.com/elhizazi1) · https://jamal.elhizazi.me · jamal@elhizazi.me
