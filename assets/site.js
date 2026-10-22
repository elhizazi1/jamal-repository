/* Jamal repository pages: language, copy buttons, live Market Plus check, and rendering from repository.json.
   Data comes from the JSON embedded in the page; repository.json is fetched afterwards and wins when it is reachable. */
(function () {
  'use strict'

  var MARKET_API = 'https://rawanide.elhizazi.me/api/v1/repositories/verify?url='
  var LANGS = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '简体' },
    { code: 'zh-TW', label: '繁體' }
  ]

  var T = {
    ar: {
      brand: 'مستودع جمال', url_label: 'رابط المستودع', copy: 'نسخ الرابط', copied: 'تم النسخ', copy_short: 'نسخ',
      hero_lead: 'إضافات لـ RawanIDE من تطوير جمال الحزازي. أضف الرابط مرة واحدة ثم ثبّت الإضافات من داخل التطبيق.',
      st_checking: 'جارٍ التحقق من Market Plus…', st_verified: 'موثّق في Market Plus', st_pending: 'بانتظار التوثيق في Market Plus', st_unknown: 'تعذّر الاتصال بـ Market Plus الآن',
      seal_verified: 'موثّق', seal_pending: 'قيد التوثيق', seal_unknown: 'غير مؤكّد',
      how_title: 'أضفه إلى RawanIDE',
      step1: 'افتح الإضافات ثم تبويب المستودعات.', step2: 'اضغط «إضافة مستودع» والصق الرابط أعلاه.', step3: 'افتح المستودع وثبّت الإضافة التي تريدها.',
      ext_title: 'الإضافات', ext_none: 'لا توجد إضافات في هذا المستودع بعد.', perms_none: 'بلا صلاحيات',
      facts_title: 'تفاصيل المستودع', f_id: 'معرّف المستودع', f_publisher: 'الناشر', f_protocol: 'إصدار البروتوكول', f_source: 'مصدر الحزم', f_perms: 'الصلاحيات المطلوبة', f_runtime: 'نوع التشغيل',
      runtime_declarative: 'تصريحي: بيانات فقط، بلا كود تنفيذي', all_none: 'لا شيء',
      foot_note: 'كل إصدار يُنزَّل من GitHub ويُتحقَّق من SHA-256 قبل التثبيت.', foot_market: 'Market Plus', foot_source: 'الكود المصدري',
      back: 'كل الإضافات', e_install_title: 'ثبّتها من التطبيق', e_install_lead: 'أضف المستودع في RawanIDE ثم افتحه وثبّت هذه الإضافة. إن كان عندك ملف .r1 فيمكنك تثبيته يدويًا من زر «تثبيت .r1».',
      e_adds: 'ماذا تضيف', e_snippets: 'مقتطفات الكود', e_snippets_hint: 'اكتب الاختصار في المحرر ثم اضغط Tab.', e_commands: 'الأوامر', e_commands_hint: 'تظهر في لوحة الأوامر ⌘ حسب نوع الملف.',
      e_theme: 'سمة الطرفية', e_theme_hint: 'اخترها من الإعدادات ثم الطرفية.', e_details: 'تفاصيل الإضافة', e_changelog: 'ما الجديد',
      d_version: 'الإصدار', d_publisher: 'الناشر', d_category: 'الفئة', d_license: 'الرخصة', d_runtime: 'نوع التشغيل', d_api: 'إصدار الواجهة', d_size: 'حجم الحزمة', d_sha: 'بصمة SHA-256', d_perms: 'الصلاحيات',
      e_download: 'تنزيل ملف .r1', trigger_in: 'في ملفات', sample: 'مثال على السطر', unit_kb: 'ك.ب'
    },
    en: {
      brand: 'Jamal Repository', url_label: 'Repository link', copy: 'Copy link', copied: 'Copied', copy_short: 'Copy',
      hero_lead: 'Extensions for RawanIDE by Jamal El Hizazi. Add the link once, then install from inside the app.',
      st_checking: 'Checking with Market Plus…', st_verified: 'Verified by Market Plus', st_pending: 'Waiting for Market Plus verification', st_unknown: 'Could not reach Market Plus right now',
      seal_verified: 'Verified', seal_pending: 'Pending', seal_unknown: 'Unchecked',
      how_title: 'Add it to RawanIDE',
      step1: 'Open Extensions, then the Repositories tab.', step2: 'Tap Add repository and paste the link above.', step3: 'Open the repository and install the extension you want.',
      ext_title: 'Extensions', ext_none: 'This repository has no extensions yet.', perms_none: 'No permissions',
      facts_title: 'Repository details', f_id: 'Repository ID', f_publisher: 'Publisher', f_protocol: 'Protocol version', f_source: 'Package source', f_perms: 'Permissions requested', f_runtime: 'Runtime',
      runtime_declarative: 'Declarative: data only, no executable code', all_none: 'None',
      foot_note: 'Every version is downloaded from GitHub and its SHA-256 is checked before install.', foot_market: 'Market Plus', foot_source: 'Source code',
      back: 'All extensions', e_install_title: 'Install it from the app', e_install_lead: 'Add the repository in RawanIDE, open it and install this extension. If you already have the .r1 file, use the Install .r1 button instead.',
      e_adds: 'What it adds', e_snippets: 'Code snippets', e_snippets_hint: 'Type the trigger in the editor, then press Tab.', e_commands: 'Commands', e_commands_hint: 'Shown in the ⌘ command palette for matching file types.',
      e_theme: 'Terminal theme', e_theme_hint: 'Pick it in Settings, under Terminal.', e_details: 'Extension details', e_changelog: 'What is new',
      d_version: 'Version', d_publisher: 'Publisher', d_category: 'Category', d_license: 'License', d_runtime: 'Runtime', d_api: 'API version', d_size: 'Package size', d_sha: 'SHA-256', d_perms: 'Permissions',
      e_download: 'Download .r1 file', trigger_in: 'In', sample: 'Sample', unit_kb: 'KB'
    },
    'zh-CN': {
      brand: 'Jamal 仓库', url_label: '仓库链接', copy: '复制链接', copied: '已复制', copy_short: '复制',
      hero_lead: 'Jamal El Hizazi 为 RawanIDE 开发的扩展。只需添加一次链接，之后在应用内安装即可。',
      st_checking: '正在向 Market Plus 核实…', st_verified: '已通过 Market Plus 验证', st_pending: '等待 Market Plus 验证', st_unknown: '暂时无法连接 Market Plus',
      seal_verified: '已验证', seal_pending: '待验证', seal_unknown: '未确认',
      how_title: '添加到 RawanIDE',
      step1: '打开“扩展”，进入“仓库”标签页。', step2: '点按“添加仓库”，粘贴上面的链接。', step3: '打开该仓库，安装你需要的扩展。',
      ext_title: '扩展', ext_none: '此仓库还没有扩展。', perms_none: '无需权限',
      facts_title: '仓库详情', f_id: '仓库 ID', f_publisher: '发布者', f_protocol: '协议版本', f_source: '安装包来源', f_perms: '所需权限', f_runtime: '运行方式',
      runtime_declarative: '声明式：仅含数据，不含可执行代码', all_none: '无',
      foot_note: '每个版本都从 GitHub 下载，并在安装前校验 SHA-256。', foot_market: 'Market Plus', foot_source: '源代码',
      back: '所有扩展', e_install_title: '在应用中安装', e_install_lead: '在 RawanIDE 中添加此仓库，打开后安装这个扩展。若已有 .r1 文件，可使用“安装 .r1”按钮。',
      e_adds: '包含内容', e_snippets: '代码片段', e_snippets_hint: '在编辑器中输入触发词，然后按 Tab。', e_commands: '命令', e_commands_hint: '按文件类型显示在 ⌘ 命令面板中。',
      e_theme: '终端主题', e_theme_hint: '在“设置”的“终端”中选择。', e_details: '扩展详情', e_changelog: '更新内容',
      d_version: '版本', d_publisher: '发布者', d_category: '分类', d_license: '许可证', d_runtime: '运行方式', d_api: 'API 版本', d_size: '包大小', d_sha: 'SHA-256', d_perms: '权限',
      e_download: '下载 .r1 文件', trigger_in: '适用于', sample: '示例', unit_kb: 'KB'
    },
    'zh-TW': {
      brand: 'Jamal 倉庫', url_label: '倉庫連結', copy: '複製連結', copied: '已複製', copy_short: '複製',
      hero_lead: 'Jamal El Hizazi 為 RawanIDE 開發的擴充功能。只需加入一次連結，之後在應用程式內安裝即可。',
      st_checking: '正在向 Market Plus 查證…', st_verified: '已通過 Market Plus 驗證', st_pending: '等待 Market Plus 驗證', st_unknown: '暫時無法連線 Market Plus',
      seal_verified: '已驗證', seal_pending: '待驗證', seal_unknown: '未確認',
      how_title: '加入 RawanIDE',
      step1: '開啟「擴充功能」，進入「儲存庫」分頁。', step2: '點按「新增儲存庫」，貼上上方的連結。', step3: '開啟該儲存庫，安裝你需要的擴充功能。',
      ext_title: '擴充功能', ext_none: '此倉庫尚無擴充功能。', perms_none: '無需權限',
      facts_title: '倉庫詳情', f_id: '倉庫 ID', f_publisher: '發佈者', f_protocol: '協定版本', f_source: '安裝包來源', f_perms: '所需權限', f_runtime: '執行方式',
      runtime_declarative: '宣告式：僅含資料，不含可執行程式碼', all_none: '無',
      foot_note: '每個版本都從 GitHub 下載，並在安裝前校驗 SHA-256。', foot_market: 'Market Plus', foot_source: '原始碼',
      back: '所有擴充功能', e_install_title: '在應用程式中安裝', e_install_lead: '在 RawanIDE 中新增此倉庫，開啟後安裝這個擴充功能。若已有 .r1 檔案，可使用「安裝 .r1」按鈕。',
      e_adds: '包含內容', e_snippets: '程式碼片段', e_snippets_hint: '在編輯器中輸入觸發詞，然後按 Tab。', e_commands: '指令', e_commands_hint: '依檔案類型顯示在 ⌘ 指令面板中。',
      e_theme: '終端機主題', e_theme_hint: '在「設定」的「終端機」中選擇。', e_details: '擴充功能詳情', e_changelog: '更新內容',
      d_version: '版本', d_publisher: '發佈者', d_category: '分類', d_license: '授權', d_runtime: '執行方式', d_api: 'API 版本', d_size: '套件大小', d_sha: 'SHA-256', d_perms: '權限',
      e_download: '下載 .r1 檔案', trigger_in: '適用於', sample: '範例', unit_kb: 'KB'
    }
  }

  var body = document.body
  var page = body.getAttribute('data-page')
  var root = body.getAttribute('data-root') || ''
  var data = { repository: { extensions: [] }, extension: null }
  var state = { lang: 'ar', verify: 'checking' }

  try { data = JSON.parse(document.getElementById('data').textContent) } catch (e) { /* page still renders its static text */ }

  function storeGet() { try { return localStorage.getItem('jamal-lang') } catch (e) { return null } }
  function storeSet(v) { try { localStorage.setItem('jamal-lang', v) } catch (e) { /* private mode */ } }
  function pickLang() {
    var saved = storeGet()
    if (saved && T[saved]) return saved
    var n = (navigator.language || 'ar').toLowerCase()
    if (n.indexOf('zh') === 0) return /tw|hk|hant/.test(n) ? 'zh-TW' : 'zh-CN'
    if (n.indexOf('en') === 0) return 'en'
    return 'ar'
  }
  function t(key) { return (T[state.lang] && T[state.lang][key]) || T.en[key] || key }
  function localized(i18n, field, fallback) {
    var e = i18n && (i18n[state.lang] || i18n[state.lang.split('-')[0]] || i18n.en)
    return (e && e[field]) || fallback
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag)
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k]
      else if (k === 'class') n.className = attrs[k]
      else n.setAttribute(k, attrs[k])
    })
    ;(kids || []).forEach(function (c) { if (c) n.appendChild(c) })
    return n
  }
  function svg(tag, attrs, text) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag)
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]) })
    if (text) n.textContent = text
    return n
  }

  /* ---------- copy ---------- */
  function copyText(text, button, label) {
    function done() {
      var old = button.textContent
      button.textContent = t('copied')
      button.setAttribute('data-done', '1')
      setTimeout(function () { button.textContent = label ? t(label) : old; button.removeAttribute('data-done') }, 1400)
    }
    function fallback() {
      var ta = el('textarea', { readonly: '', style: 'position:fixed;opacity:0' })
      ta.value = text; document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy') } catch (e) { /* nothing else to try */ }
      document.body.removeChild(ta); done()
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback)
    else fallback()
  }

  /* ---------- seal ---------- */
  function buildSeal() {
    var s = svg('svg', { 'class': 'seal', viewBox: '0 0 200 200', role: 'img', 'aria-hidden': 'true' })
    var pathId = 'seal-ring-' + page
    s.appendChild(svg('circle', { 'class': 'ring', cx: 100, cy: 100, r: 96 }))
    s.appendChild(svg('circle', { 'class': 'ring-dash', cx: 100, cy: 100, r: 90 }))
    var defs = svg('defs')
    defs.appendChild(svg('path', { id: pathId, d: 'M100 100 m-72 0 a72 72 0 1 1 144 0 a72 72 0 1 1 -144 0' }))
    s.appendChild(defs)
    var text = svg('text', { 'class': 'ringtext' })
    var tp = svg('textPath', { href: '#' + pathId })
    tp.setAttribute('data-ring', '1')
    text.appendChild(tp)
    s.appendChild(text)
    var star = svg('g', { 'class': 'star-group' })
    star.appendChild(svg('rect', { 'class': 'star', x: 68, y: 68, width: 64, height: 64 }))
    star.appendChild(svg('rect', { 'class': 'star', x: 68, y: 68, width: 64, height: 64, transform: 'rotate(45 100 100)' }))
    s.appendChild(star)
    var core = svg('text', { 'class': 'core', x: 100, y: 106 })
    core.setAttribute('data-core', '1')
    s.appendChild(core)
    return s
  }
  function paintSeal() {
    document.querySelectorAll('svg.seal').forEach(function (s) {
      s.setAttribute('data-state', state.verify)
      var ring = s.querySelector('[data-ring]')
      if (ring) {
        var label = state.verify === 'verified' ? 'JAMAL EL HIZAZI · VERIFIED REPOSITORY · ' : 'JAMAL EL HIZAZI · COMMUNITY REPOSITORY · '
        ring.textContent = label
        // Spread the letters evenly around the whole ring (the circumference at r=72 is about 452).
        var holder = ring.parentNode
        holder.style.letterSpacing = '0px'
        var natural = 0
        try { natural = holder.getComputedTextLength() } catch (e) { natural = 0 }
        if (natural > 0) holder.style.letterSpacing = Math.max(0, (452 - natural) / label.length).toFixed(2) + 'px'
      }
      var core = s.querySelector('[data-core]')
      if (core) {
        var key = state.verify === 'verified' ? 'seal_verified' : state.verify === 'pending' ? 'seal_pending' : 'seal_unknown'
        core.textContent = t(key)
        core.setAttribute('class', 'core' + (state.verify === 'verified' ? '' : ' small'))
      }
    })
    document.querySelectorAll('[data-status]').forEach(function (n) {
      n.setAttribute('data-state', state.verify)
      n.textContent = t('st_' + state.verify)
    })
  }

  function verify() {
    var url = data.repository && data.repository.repositoryUrl
    if (!url || typeof fetch !== 'function') { state.verify = 'unknown'; paintSeal(); return }
    var ctl = typeof AbortController === 'function' ? new AbortController() : null
    var timer = ctl ? setTimeout(function () { ctl.abort() }, 7000) : null
    fetch(MARKET_API + encodeURIComponent(url), { signal: ctl ? ctl.signal : undefined, headers: { accept: 'application/json' } })
      .then(function (r) {
        if (r.ok) return r.json().then(function (j) { state.verify = j && j.verified === true ? 'verified' : 'pending' })
        state.verify = r.status === 403 || r.status === 404 ? 'pending' : 'unknown'
      })
      .catch(function () { state.verify = 'unknown' })
      .then(function () { if (timer) clearTimeout(timer); paintSeal() })
  }

  /* ---------- rendering ---------- */
  function shortKb(bytes) { return (bytes / 1024).toFixed(1) + ' ' + t('unit_kb') }

  function renderRepo() {
    var repo = data.repository || {}
    var h1 = document.querySelector('[data-repo-name]')
    if (h1) h1.textContent = localized(repo.i18n, 'name', repo.name || '')
    var field = document.querySelector('[data-repo-url]')
    if (field) field.textContent = repo.repositoryUrl || ''

    var list = document.querySelector('[data-ext-list]')
    if (list) {
      list.textContent = ''
      var items = repo.extensions || []
      if (!items.length) list.appendChild(el('p', { 'class': 'empty', text: t('ext_none') }))
      items.forEach(function (x) {
        var href = root + 'extensions/' + encodeURIComponent(x.id) + '/' + encodeURIComponent(x.version) + '/'
        var title = el('h3', { text: localized(x.i18n, 'name', x.name) }, [
          el('span', { 'class': 'tag', text: 'v' + x.version }),
          el('span', { 'class': 'tag', text: x.category || '' }),
          (x.permissions || []).length ? null : el('span', { 'class': 'tag safe', text: t('perms_none') })
        ])
        var row = el('a', { 'class': 'row', href: href }, [
          el('img', { src: root + 'extensions/' + encodeURIComponent(x.id) + '/' + encodeURIComponent(x.version) + '/icon.svg', alt: '', width: 64, height: 64 }),
          el('div', {}, [title, el('p', { text: localized(x.i18n, 'description', x.description || '') })]),
          el('span', { 'class': 'chev', 'aria-hidden': 'true', text: '›' })
        ])
        list.appendChild(row)
      })
    }

    var facts = document.querySelector('[data-facts]')
    if (facts) {
      var ext = (repo.extensions || [])[0]
      var perms = {}
      ;(repo.extensions || []).forEach(function (x) { (x.permissions || []).forEach(function (p) { perms[p] = 1 }) })
      var permList = Object.keys(perms)
      facts.textContent = ''
      ;[
        ['f_id', repo.id, true],
        ['f_publisher', repo.publisher, false],
        ['f_protocol', repo.protocol, true],
        ['f_source', 'GitHub', false],
        ['f_runtime', ext && ext.runtime === 'declarative' ? t('runtime_declarative') : (ext && ext.runtime) || '', false],
        ['f_perms', permList.length ? permList.join(', ') : t('all_none'), permList.length > 0]
      ].forEach(function (r) {
        facts.appendChild(el('dt', { text: t(r[0]) }))
        facts.appendChild(el('dd', { 'class': r[2] ? 'mono' : '', text: r[1] || '' }))
      })
    }
  }

  function renderExt() {
    var x = data.extension
    if (!x) return
    var repo = data.repository || {}
    var name = localized(x.i18n, 'name', x.name)
    document.title = name + ' · ' + (localized(repo.i18n, 'name', repo.name) || '')
    var set = function (sel, text) { var n = document.querySelector(sel); if (n) n.textContent = text }
    set('[data-ext-name]', name)
    set('[data-ext-desc]', localized(x.i18n, 'description', ''))
    set('[data-repo-url]', repo.repositoryUrl || '')
    var meta = document.querySelector('[data-ext-meta]')
    if (meta) {
      meta.textContent = ''
      meta.appendChild(el('span', { 'class': 'tag', text: 'v' + x.version }))
      meta.appendChild(el('span', { 'class': 'tag', text: x.category }))
      meta.appendChild(el('span', { 'class': 'tag', text: x.publisher }))
      meta.appendChild(el('span', { 'class': (x.permissions || []).length ? 'tag' : 'tag safe', text: (x.permissions || []).length ? x.permissions.join(', ') : t('perms_none') }))
    }

    var snippets = document.querySelector('[data-snippets]')
    if (snippets) {
      snippets.textContent = ''
      ;(x.snippets || []).forEach(function (s) {
        snippets.appendChild(el('div', { 'class': 'snip' }, [
          el('div', { 'class': 'snip-top' }, [
            el('span', { 'class': 'trigger', text: s.trigger }),
            el('strong', { text: s.description || '' }),
            el('small', { text: t('trigger_in') + ' ' + (s.languages || []).join(', ') })
          ]),
          el('pre', { 'class': 'code', text: String(s.body).replace(/\$\{\d+(?::([^}]*))?\}/g, '$1').replace(/\$\d+/g, '') })
        ]))
      })
    }

    var commands = document.querySelector('[data-commands]')
    if (commands) {
      commands.textContent = ''
      ;(x.commands || []).forEach(function (c) {
        commands.appendChild(el('div', { 'class': 'snip' }, [
          el('div', { 'class': 'snip-top' }, [
            el('strong', { text: c.title }),
            el('small', { text: t('trigger_in') + ' ' + (c.languages || []).join(', ') })
          ]),
          el('small', { text: c.description || '' })
        ]))
      })
    }

    var theme = document.querySelector('[data-theme-preview]')
    if (theme && x.theme) {
      var c = x.theme.colors || {}, a = x.theme.ansi || []
      theme.textContent = ''
      theme.style.background = c.background
      theme.style.color = c.foreground
      var line = function (parts) {
        var p = el('div')
        parts.forEach(function (q) { p.appendChild(el('span', { text: q[0], style: q[1] ? 'color:' + q[1] : '' })) })
        return p
      }
      theme.appendChild(line([['~/project ', c.accent], ['$ ', a[2]], ['git status', null]]))
      theme.appendChild(line([['On branch ', null], ['main', a[6]]]))
      theme.appendChild(line([['modified: ', a[3]], ['index.html', null]]))
      theme.appendChild(line([['error: ', a[1]], ['file not found', null]]))
      var last = line([['~/project ', c.accent], ['$ ', a[2]]])
      last.appendChild(el('span', { 'class': 'cursor', style: 'background:' + c.cursor }))
      theme.appendChild(last)
      var sw = document.querySelector('[data-swatches]')
      if (sw) {
        sw.textContent = ''
        a.forEach(function (col) { sw.appendChild(el('span', { style: 'background:' + col, title: col })) })
      }
      set('[data-theme-name]', x.theme.name)
    }

    var facts = document.querySelector('[data-facts]')
    if (facts) {
      var p = x.package || {}
      facts.textContent = ''
      ;[
        ['d_version', x.version, true], ['d_publisher', x.publisher, false], ['d_category', x.category, false], ['d_license', x.license, false],
        ['d_runtime', x.runtime === 'declarative' ? t('runtime_declarative') : x.runtime, false], ['d_api', x.apiVersion, true],
        ['d_size', p.sizeBytes ? shortKb(p.sizeBytes) + ' (' + p.sizeBytes + ' B)' : '', true],
        ['d_perms', (x.permissions || []).length ? x.permissions.join(', ') : t('all_none'), false]
      ].forEach(function (r) {
        facts.appendChild(el('dt', { text: t(r[0]) }))
        facts.appendChild(el('dd', { 'class': r[2] ? 'mono' : '', text: r[1] || '' }))
      })
      facts.appendChild(el('dt', { text: t('d_sha') }))
      var dd = el('dd', { 'class': 'hash' }, [el('span', { 'class': 'mono', text: p.sha256 || '' })])
      var cb = el('button', { 'class': 'btn small ghost', type: 'button', text: t('copy_short') })
      cb.addEventListener('click', function () { copyText(p.sha256 || '', cb, 'copy_short') })
      dd.appendChild(cb)
      facts.appendChild(dd)
    }

    var dl = document.querySelector('[data-download]')
    if (dl && x.package) { dl.setAttribute('href', x.package.downloadUrl); dl.textContent = t('e_download') }
    var log = document.querySelector('[data-changelog]')
    if (log && x.changelog) log.textContent = x.changelog[state.lang.split('-')[0]] || x.changelog.en || ''
  }

  function applyStatic() {
    document.documentElement.lang = state.lang
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr'
    document.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')) })
    document.querySelectorAll('[data-copy-main]').forEach(function (b) { b.textContent = t('copy') })
    document.querySelectorAll('.langs button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === state.lang ? 'true' : 'false') })
    if (page === 'repo') {
      var repo = data.repository || {}
      document.title = (localized(repo.i18n, 'name', repo.name) || t('brand'))
    }
  }

  function render() { applyStatic(); if (page === 'repo') renderRepo(); else renderExt(); paintSeal() }

  function setLang(code) { state.lang = code; storeSet(code); render() }

  function mount() {
    state.lang = pickLang()
    var langs = document.querySelector('[data-langs]')
    if (langs) LANGS.forEach(function (l) {
      var b = el('button', { type: 'button', 'data-lang': l.code, text: l.label, lang: l.code })
      b.addEventListener('click', function () { setLang(l.code) })
      langs.appendChild(b)
    })
    document.querySelectorAll('[data-seal]').forEach(function (n) { n.appendChild(buildSeal()) })
    document.querySelectorAll('[data-copy-main]').forEach(function (b) {
      b.addEventListener('click', function () { copyText((data.repository && data.repository.repositoryUrl) || '', b, 'copy') })
    })
    render()
    verify()

    // Fresh data from repository.json wins over the embedded copy when it can be fetched.
    if (typeof fetch === 'function') {
      fetch(root + 'repository.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null }).then(function (j) {
        if (!j || j.protocol !== '1.0') return
        data.repository = j
        if (data.extension) {
          var m = (j.extensions || []).filter(function (e) { return e.id === data.extension.id && e.version === data.extension.version })[0]
          if (m) data.extension.package = { file: data.extension.package.file, sizeBytes: m.sizeBytes, sha256: m.sha256, downloadUrl: m.downloadUrl }
        }
        render()
      }).catch(function () { /* offline or file://: keep the embedded copy */ })
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
  else mount()
})()
