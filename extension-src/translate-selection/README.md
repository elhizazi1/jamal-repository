# Translate Selection — RawanIDE Extension API 1.0

## Install and use
1. Import `me.elhizazi.jamal.github.repository.translate-selection-1.0.0.r1` in RawanIDE.
2. Review the permissions: `EDITOR_WRITE` is used to replace the selected text, and `NETWORK_ACCESS` is used to request translation.
3. Open a text file, select text, and choose **Translate** from the selection actions.
4. Choose a target language and tap **Translate**.
5. Copy the result or choose **Replace selection**. Replacement uses the original range and expected source text; if that source has changed, the extension refuses the replacement rather than overwriting different text.

## Privacy
The selected text is sent over HTTPS to `translate.googleapis.com` (Google Translate's unofficial web endpoint) to obtain a translation. This extension does not intentionally save selected text or translations persistently. Do not translate confidential source code or private text unless you are comfortable sending it to this external service. Availability and rate limits are controlled by the service and may change.

## API compatibility and testing
This package declares RawanIDE Extension API `1.0` and uses the documented `hosted-js` runtime, selection action, panel messaging, localization, network and editor-edit APIs. The package files and JSON syntax were checked after rebuilding. It has not been installed or exercised on a physical RawanIDE device in this environment, so verify opening the selection action, translation, copy, and safe replacement on your device before publishing.
