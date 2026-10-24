(function () {
  "use strict";

  var PANEL_ID = "translate-selection.panel";
  var pending = { text: "", filePath: "", start: 0, end: 0, original: "" };
  var translated = "";
  var currentTarget = "ar";
  
  // دالة لاكتشاف لغة التطبيق أو النظام ديناميكياً
  function getAppLang() {
    var lang = "en";
    if (typeof rawanide !== "undefined" && rawanide.env && rawanide.env.language) {
      lang = rawanide.env.language;
    } else if (typeof navigator !== "undefined" && navigator.language) {
      lang = navigator.language;
    }
    return lang.toLowerCase().startsWith("ar") ? "ar" : "en";
  }

  // الترجمات المدمجة للنافذة الداخلية
  var locales = {
    en: {
      panelTitle: "Translate selection",
      desc: "The selected text is sent over HTTPS to Google Translate for translation.",
      selectedText: "Selected text",
      translateTo: "Translate to",
      translationText: "Translation",
      placeholder: "Your translation will appear here...",
      btnTranslate: "Translate",
      btnCopy: "Copy translation",
      btnReplace: "Replace selection",
      qualityNote: "Translation quality and availability depend on the selected translation service.",
      optArabic: "Arabic",
      optEnglish: "English",
      optFrench: "French",
      optSpanish: "Spanish",
      optGerman: "German",
      optPortuguese: "Portuguese",
      optItalian: "Italian",
      optTurkish: "Turkish",
      optRussian: "Russian",
      optJapanese: "Japanese",
      optChinese: "Chinese",
      msgSelectFirst: "Select text in the editor first.",
      msgTranslating: "Translating…",
      msgReady: "Translation ready.",
      msgErrorTranslate: "Could not translate.",
      msgTranslateFirst: "Translate the text first.",
      msgNoSource: "The original selection could not be located safely.",
      msgReplaced: "Original selection replaced.",
      msgNotReplaced: "Text was not replaced. The source may have changed.",
      msgCopied: "Copied.",
      msgCopyFail: "Failed to copy.",
      msgUseMenu: "Use system text menu."
    },
    ar: {
      panelTitle: "ترجمة التحديد",
      desc: "يتم إرسال النص المحدد عبر اتصال آمن (HTTPS) إلى خدمة ترجمة جوجل.",
      selectedText: "النص المحدد",
      translateTo: "ترجم إلى",
      translationText: "الترجمة",
      placeholder: "ستظهر الترجمة هنا...",
      btnTranslate: "ترجمة",
      btnCopy: "نسخ الترجمة",
      btnReplace: "استبدال التحديد الأصلي",
      qualityNote: "جودة الترجمة تعتمد على الخدمة المستخدمة.",
      optArabic: "العربية",
      optEnglish: "الإنجليزية",
      optFrench: "الفرنسية",
      optSpanish: "الإسبانية",
      optGerman: "الألمانية",
      optPortuguese: "البرتغالية",
      optItalian: "الإيطالية",
      optTurkish: "التركية",
      optRussian: "الروسية",
      optJapanese: "اليابانية",
      optChinese: "الصينية",
      msgSelectFirst: "الرجاء تحديد نص في المحرر أولاً.",
      msgTranslating: "جاري الترجمة…",
      msgReady: "الترجمة جاهزة.",
      msgErrorTranslate: "تعذرت الترجمة.",
      msgTranslateFirst: "قم بالترجمة أولاً.",
      msgNoSource: "لم يتم العثور على التحديد الأصلي بأمان.",
      msgReplaced: "تم استبدال النص الأصلي بنجاح.",
      msgNotReplaced: "لم يتم الاستبدال. ربما تغير المصدر.",
      msgCopied: "تم النسخ.",
      msgCopyFail: "فشل النسخ.",
      msgUseMenu: "استخدم قائمة النظام للنسخ."
    }
  };

  function t(key) {
    var lang = getAppLang();
    var fallback = (locales[lang] && locales[lang][key]) || (locales.en && locales.en[key]) || key;
    // Prefer the host localization files, but retain safe fallbacks for older builds.
    try {
      if (typeof rawanide !== "undefined" && rawanide.i18n && typeof rawanide.i18n.t === "function") {
        return rawanide.i18n.t(key, fallback) || fallback;
      }
    } catch (_) {}
    return fallback;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function render(status, errorText) {
    var source = pending.text;
    var currentLang = getAppLang();
    var dirAttr = currentLang === "ar" ? 'dir="rtl"' : 'dir="ltr"';
    
    var resultBlock = translated
      ? '<label for="result">' + esc(t("translationText")) + '</label><textarea id="result" readonly>' + esc(translated) + '</textarea>'
      : '<label for="result">' + esc(t("translationText")) + '</label><textarea id="result" readonly placeholder="' + esc(t("placeholder")) + '"></textarea>';

    var css = ':root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;padding:16px;background:var(--rawan-bg);color:var(--rawan-on-surface);font:14px var(--rawan-font, sans-serif)}'
      + 'h2{font-size:18px;margin:0 0 6px}p{color:var(--rawan-on-surface-variant);margin:0 0 14px;line-height:1.45}'
      + 'label{display:block;font-weight:600;margin:12px 0 6px}textarea,select{width:100%;border:1px solid var(--rawan-outline);border-radius:12px;padding:14px;background:var(--rawan-surface);color:var(--rawan-on-surface);font:inherit}'
      + 'textarea{min-height:90px;resize:vertical}#source{min-height:74px} .row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}button{border:0;border-radius:999px;padding:14px 18px;background:var(--rawan-primary);color:var(--rawan-on-primary);font:600 14px var(--rawan-font,sans-serif)}button.secondary{background:var(--rawan-secondary-container);color:var(--rawan-on-secondary-container)}button:disabled{opacity:.5}#status{margin-top:10px;min-height:18px;color:var(--rawan-on-surface-variant)}.note{font-size:12px;margin-top:12px}';

    var copyScript = 'document.getElementById("copy").addEventListener("click",function(){'
      + 'var t_val=document.getElementById("result").value;'
      + 'if(navigator.clipboard && window.isSecureContext){'
      + '  navigator.clipboard.writeText(t_val).then(function(){document.getElementById("status").textContent="' + esc(t("msgCopied")) + '";}).catch(function(){document.getElementById("status").textContent="' + esc(t("msgCopyFail")) + '";});'
      + '} else {'
      + '  var txt=document.getElementById("result"); txt.focus(); txt.select();'
      + '  try{ var ok=document.execCommand("copy"); document.getElementById("status").textContent=ok?"' + esc(t("msgCopied")) + '":"' + esc(t("msgUseMenu")) + '"; }'
      + '  catch(e){ document.getElementById("status").textContent="' + esc(t("msgUseMenu")) + '"; }'
      + '}'
      + '});';

    return '<!doctype html><html ' + dirAttr + '><head><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>' + css + '</style></head><body>'
      + '<h2>' + esc(t("panelTitle")) + '</h2>'
      + '<p>' + esc(t("desc")) + '</p>'
      + '<label for="source">' + esc(t("selectedText")) + '</label><textarea id="source" readonly>' + esc(source) + '</textarea>'
      + '<label for="target">' + esc(t("translateTo")) + '</label><select id="target">'
      + '<option value="ar"' + (currentTarget === "ar" ? ' selected' : '') + '>' + esc(t("optArabic")) + '</option>'
      + '<option value="en"' + (currentTarget === "en" ? ' selected' : '') + '>' + esc(t("optEnglish")) + '</option>'
      + '<option value="fr"' + (currentTarget === "fr" ? ' selected' : '') + '>' + esc(t("optFrench")) + '</option>'
      + '<option value="es"' + (currentTarget === "es" ? ' selected' : '') + '>' + esc(t("optSpanish")) + '</option>'
      + '<option value="de"' + (currentTarget === "de" ? ' selected' : '') + '>' + esc(t("optGerman")) + '</option>'
      + '<option value="pt"' + (currentTarget === "pt" ? ' selected' : '') + '>' + esc(t("optPortuguese")) + '</option>'
      + '<option value="it"' + (currentTarget === "it" ? ' selected' : '') + '>' + esc(t("optItalian")) + '</option>'
      + '<option value="tr"' + (currentTarget === "tr" ? ' selected' : '') + '>' + esc(t("optTurkish")) + '</option>'
      + '<option value="ru"' + (currentTarget === "ru" ? ' selected' : '') + '>' + esc(t("optRussian")) + '</option>'
      + '<option value="ja"' + (currentTarget === "ja" ? ' selected' : '') + '>' + esc(t("optJapanese")) + '</option>'
      + '<option value="zh"' + (currentTarget === "zh" ? ' selected' : '') + '>' + esc(t("optChinese")) + '</option>'
      + '</select>'
      + resultBlock
      + '<div class="row"><button id="translate">' + esc(t("btnTranslate")) + '</button>'
      + '<button id="copy" class="secondary"' + (!translated ? ' disabled' : '') + '>' + esc(t("btnCopy")) + '</button>'
      + '<button id="replace" class="secondary"' + (!translated ? ' disabled' : '') + '>' + esc(t("btnReplace")) + '</button></div>'
      + '<div id="status" role="status">' + esc(status || "") + '</div>'
      + (errorText ? '<p class="note">' + esc(errorText) + '</p>' : '')
      + '<p class="note">' + esc(t("qualityNote")) + '</p>'
      + '<script>'
      + 'function send(o){RawanIDEPanel.postMessage(JSON.stringify(o))}'
      + 'document.getElementById("target").addEventListener("change",function(){send({type:"target",value:this.value})});'
      + 'document.getElementById("translate").addEventListener("click",function(){send({type:"translate",value:document.getElementById("target").value})});'
      + copyScript
      + 'document.getElementById("replace").addEventListener("click",function(){send({type:"replace"})});'
      + '</script></body></html>';
  }

  rawanide.ui.registerPanel(PANEL_ID, {
    title: t("panelTitle"),
    placement: "sheet",
    icon: "translate",
    html: render("", "")
  });

  rawanide.commands.registerCommand("translate-selection.open", t("panelTitle"), function (ctx) {
    var selection = ctx && ctx.editor && ctx.editor.selection;
    var selectedText = selection && selection.text ? String(selection.text) : "";
    if (!selectedText.trim()) {
      rawanide.window.showWarningMessage(t("msgSelectFirst"));
      return;
    }
    pending = {
      text: selectedText,
      filePath: ctx.editor.filePath || "",
      start: Number(selection.start || 0),
      end: Number(selection.end || 0),
      original: selectedText
    };
    translated = "";
    currentTarget = "ar";
    
    // تحديث الواجهة واللغة في كل مرة تفتح فيها النافذة
    rawanide.ui.updatePanel(PANEL_ID, render("", ""));
    rawanide.ui.showPanel(PANEL_ID);
  });

  rawanide.ui.onMessage(PANEL_ID, function (message) {
    if (!message || typeof message !== "object") return;

    if (message.type === "target") {
      currentTarget = String(message.value || "ar");
      return;
    }

    if (message.type === "translate") {
      currentTarget = String(message.value || currentTarget || "ar");
      if (["ar", "en", "fr", "es", "de", "pt", "it", "tr", "ru", "ja", "zh"].indexOf(currentTarget) === -1) {
        currentTarget = "ar";
      }
      if (!pending.text.trim()) {
        rawanide.ui.updatePanel(PANEL_ID, render(t("msgSelectFirst"), ""));
        return;
      }
      rawanide.ui.updatePanel(PANEL_ID, render(t("msgTranslating"), ""));
      try {
        var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" 
                  + currentTarget + "&dt=t&q=" + encodeURIComponent(pending.text);

        var response = rawanide.network.fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
            "Accept": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        var data = JSON.parse(response.text || "[]");
        var translatedText = "";
        
        if (Array.isArray(data) && Array.isArray(data[0])) {
          for (var i = 0; i < data[0].length; i++) {
            var segment = data[0][i];
            if (Array.isArray(segment) && typeof segment[0] === "string") {
              translatedText += segment[0];
            }
          }
        }

        if (!translatedText) {
          throw new Error(t("msgErrorTranslate"));
        }

        translated = translatedText;
        rawanide.ui.updatePanel(PANEL_ID, render(t("msgReady"), ""));
      } catch (error) {
        rawanide.ui.updatePanel(PANEL_ID, render(t("msgErrorTranslate"), String(error && error.message || error)));
      }
      return;
    }

    if (message.type === "replace") {
      if (!translated) {
        rawanide.ui.updatePanel(PANEL_ID, render(t("msgTranslateFirst"), ""));
        return;
      }
      if (!pending.filePath || pending.end < pending.start) {
        rawanide.ui.updatePanel(PANEL_ID, render(t("msgNoSource"), ""));
        return;
      }
      try {
        var editResult = rawanide.editor.applyEdits([{
          start: pending.start,
          end: pending.end,
          newText: translated,
          expected: pending.original
        }], { filePath: pending.filePath });
        // API 1.0 documents applyEdits as resolving { ok, error }; handle both
        // Promise-based builds and synchronous wrappers without assuming either.
        Promise.resolve(editResult).then(function (result) {
          if (result && result.ok) {
            rawanide.ui.updatePanel(PANEL_ID, render(t("msgReplaced"), ""));
          } else {
            rawanide.ui.updatePanel(PANEL_ID, render(t("msgNotReplaced"), result && result.error ? String(result.error) : ""));
          }
        }).catch(function (error) {
          rawanide.ui.updatePanel(PANEL_ID, render(t("msgNotReplaced"), String(error && error.message || error)));
        });
      } catch (error) {
        rawanide.ui.updatePanel(PANEL_ID, render(t("msgNotReplaced"), String(error && error.message || error)));
      }
    }
  });
})();
