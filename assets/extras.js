/* Scroll-spy for the section tabs (repository page only) and a search box that appears when there are many extensions.
   The tabs themselves are static HTML; site.js translates their labels. */
(function () {
  'use strict'
  var SEARCH = { ar: ['ابحث في الإضافات…', 'إضافة'], en: ['Search extensions…', 'extensions'], 'zh-CN': ['搜索扩展…', '个扩展'], 'zh-TW': ['搜尋擴充功能…', '個擴充功能'] }
  var MIN_FOR_SEARCH = 4

  function spy() {
    if (document.body.getAttribute('data-page') !== 'repo' || !('IntersectionObserver' in window)) return
    var links = [].slice.call(document.querySelectorAll('.nav a[href^="#"]'))
    function mark(id) { links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false') }) }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) mark(e.target.id) })
    }, { rootMargin: '-35% 0px -55% 0px' })
    document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s) })
    window.addEventListener('scroll', function () {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && links.length) mark(links[links.length - 1].getAttribute('href').slice(1))
    }, { passive: true })
  }

  function buildSearch() {
    var list = document.querySelector('[data-ext-list]'); if (!list) return
    var rows = list.querySelectorAll('.row')
    var old = document.querySelector('.tools'); if (old) old.remove()
    if (rows.length < MIN_FOR_SEARCH) return
    var L = SEARCH[document.documentElement.lang] || SEARCH.en
    var box = document.createElement('div'); box.className = 'tools'
    var inp = document.createElement('input'); inp.type = 'search'; inp.placeholder = L[0]; inp.setAttribute('aria-label', L[0])
    var cnt = document.createElement('span'); cnt.className = 'count'
    function run() {
      var q = inp.value.trim().toLowerCase(), n = 0
      rows.forEach(function (r) { var ok = !q || r.textContent.toLowerCase().indexOf(q) > -1; r.style.display = ok ? '' : 'none'; if (ok) n++ })
      cnt.textContent = n + ' ' + L[1]
    }
    inp.addEventListener('input', run); box.appendChild(inp); box.appendChild(cnt); list.parentNode.insertBefore(box, list); run()
  }

  function init() {
    spy()
    var list = document.querySelector('[data-ext-list]')
    if (list && 'MutationObserver' in window) {
      new MutationObserver(function () { setTimeout(buildSearch, 0) }).observe(list, { childList: true })
    }
    var langs = document.querySelector('[data-langs]')
    if (langs) langs.addEventListener('click', function () { setTimeout(buildSearch, 80) })
    buildSearch()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init()
})()
