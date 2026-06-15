export const docsClientScript = `
(function () {
  var STORAGE_THEME = 'sentinel-docs-theme';
  var STORAGE_BASE_URL = 'sentinel-docs-base-url';
  var STORAGE_TOKEN = 'sentinel-docs-auth-token';
  var STORAGE_LOCALE = 'sentinel-docs-locale';

  var configEl = document.getElementById('docs-client-config');
  var config = configEl ? JSON.parse(configEl.textContent || '{}') : {};
  var messages = config.messages || { en: {}, pt: {} };
  var currentLocale = document.documentElement.getAttribute('data-locale') || 'en';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function resolveLocale() {
    var stored;
    try { stored = localStorage.getItem(STORAGE_LOCALE); } catch (e) {}
    if (stored === 'pt' || stored === 'en') return stored;
    var nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('pt') ? 'pt' : 'en';
  }

  function translate(key, locale, params) {
    var loc = locale || currentLocale;
    var table = messages[loc] || messages.en || {};
    var text = table[key] || (messages.en && messages.en[key]) || key;
    if (params) {
      Object.keys(params).forEach(function (paramKey) {
        text = text.replace('{' + paramKey + '}', String(params[paramKey]));
      });
    }
    return text;
  }

  function applyLocale(locale) {
    currentLocale = locale;
    document.documentElement.lang = locale;
    document.documentElement.setAttribute('data-locale', locale);

    $all('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var paramsRaw = el.getAttribute('data-i18n-params');
      var params = paramsRaw ? JSON.parse(paramsRaw) : undefined;
      el.textContent = translate(key, locale, params);
    });

    $all('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = translate(key, locale);
    });

    $all('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (key) el.title = translate(key, locale);
    });

    $all('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', translate(key, locale));
    });

    $all('#docs-base-preset option[data-i18n]').forEach(function (option) {
      var key = option.getAttribute('data-i18n');
      if (key) option.textContent = translate(key, locale);
    });

    $all('.lang-switch__btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === locale;
      btn.classList.toggle('lang-switch__btn--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    var tokenToggle = document.getElementById('docs-token-toggle');
    var tokenInput = document.getElementById('docs-auth-token');
    if (tokenToggle && tokenInput) {
      var showKey = tokenInput.type === 'password' ? 'testConsole.show' : 'testConsole.hide';
      tokenToggle.textContent = translate(showKey, locale);
    }

    try { localStorage.setItem(STORAGE_LOCALE, locale); } catch (e) {}
  }

  function initLocale() {
    var locale = resolveLocale();
    applyLocale(locale);

    $all('.lang-switch__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-lang');
        if (lang === 'pt' || lang === 'en') applyLocale(lang);
      });
    });
  }

  function getBaseUrl() {
    var input = document.getElementById('docs-base-url');
    return input ? input.value.replace(/\\/$/, '') : '';
  }

  function getToken() {
    var input = document.getElementById('docs-auth-token');
    return input ? input.value.trim() : '';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_THEME, theme); } catch (e) {}
  }

  function initTheme() {
    var saved = 'dark';
    try { saved = localStorage.getItem(STORAGE_THEME) || 'dark'; } catch (e) {}
    applyTheme(saved === 'light' ? 'light' : 'dark');

    var toggle = document.getElementById('docs-theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  }

  function initSidebarTabs() {
    $all('.sidebar-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-tab');
        $all('.sidebar-tab').forEach(function (el) {
          el.classList.remove('sidebar-tab--active');
          el.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('sidebar-tab--active');
        tab.setAttribute('aria-selected', 'true');

        $all('.sidebar-panel').forEach(function (panel) {
          panel.classList.remove('sidebar-panel--active');
        });
        var panel = document.getElementById('sidebar-' + target);
        if (panel) panel.classList.add('sidebar-panel--active');
      });
    });
  }

  function initNavLinks() {
    $all('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        $all('.nav-link').forEach(function (el) {
          el.classList.remove('nav-link--active');
        });
        link.classList.add('nav-link--active');
      });
    });
  }

  function initBaseUrlControls() {
    var preset = document.getElementById('docs-base-preset');
    var urlInput = document.getElementById('docs-base-url');

    try {
      var savedUrl = localStorage.getItem(STORAGE_BASE_URL);
      if (savedUrl && urlInput) {
        urlInput.value = savedUrl;
        syncPresetFromUrl(savedUrl);
      }
    } catch (e) {}

    if (preset && urlInput) {
      preset.addEventListener('change', function () {
        var option = preset.options[preset.selectedIndex];
        var url = option.getAttribute('data-url') || '';
        if (preset.value === 'custom') {
          urlInput.removeAttribute('readonly');
          urlInput.focus();
        } else {
          urlInput.value = url;
          urlInput.setAttribute('readonly', 'readonly');
          persistBaseUrl(url);
        }
        updateAllUrlPreviews();
      });

      urlInput.addEventListener('input', function () {
        if (preset.value === 'custom') {
          persistBaseUrl(urlInput.value);
          updateAllUrlPreviews();
        }
      });

      if (preset.value !== 'custom') {
        urlInput.setAttribute('readonly', 'readonly');
      }
    }
  }

  function syncPresetFromUrl(url) {
    var preset = document.getElementById('docs-base-preset');
    if (!preset) return;
    var matched = false;
    $all('option', preset).forEach(function (option) {
      if (option.getAttribute('data-url') === url) {
        preset.value = option.value;
        matched = true;
      }
    });
    if (!matched) {
      preset.value = 'custom';
    }
  }

  function persistBaseUrl(url) {
    try { localStorage.setItem(STORAGE_BASE_URL, url); } catch (e) {}
  }

  function initTokenControls() {
    var tokenInput = document.getElementById('docs-auth-token');
    var toggleBtn = document.getElementById('docs-token-toggle');
    var clearBtn = document.getElementById('docs-token-clear');

    try {
      var saved = localStorage.getItem(STORAGE_TOKEN);
      if (saved && tokenInput) tokenInput.value = saved;
    } catch (e) {}

    if (tokenInput) {
      tokenInput.addEventListener('input', function () {
        try { localStorage.setItem(STORAGE_TOKEN, tokenInput.value); } catch (e) {}
      });
    }

    if (toggleBtn && tokenInput) {
      toggleBtn.addEventListener('click', function () {
        var isPassword = tokenInput.type === 'password';
        tokenInput.type = isPassword ? 'text' : 'password';
        toggleBtn.textContent = translate(isPassword ? 'testConsole.hide' : 'testConsole.show', currentLocale);
      });
    }

    if (clearBtn && tokenInput) {
      clearBtn.addEventListener('click', function () {
        tokenInput.value = '';
        try { localStorage.removeItem(STORAGE_TOKEN); } catch (e) {}
      });
    }
  }

  function buildUrl(path, tryItEl) {
    var resolved = path;
    $all('[data-path-param]', tryItEl).forEach(function (input) {
      var name = input.getAttribute('data-path-param');
      var value = input.value.trim();
      if (name && value) {
        resolved = resolved.replace(':' + name, encodeURIComponent(value));
      }
    });
    return getBaseUrl() + resolved;
  }

  function updateUrlPreview(tryItEl) {
    var preview = $('[data-url-preview]', tryItEl);
    if (preview) {
      preview.textContent = buildUrl(tryItEl.getAttribute('data-path') || '', tryItEl);
    }
  }

  function updateAllUrlPreviews() {
    $all('.try-it').forEach(updateUrlPreview);
  }

  function initTryItPanels() {
    $all('.try-it').forEach(function (tryItEl) {
      updateUrlPreview(tryItEl);

      $all('[data-path-param]', tryItEl).forEach(function (input) {
        input.addEventListener('input', function () {
          updateUrlPreview(tryItEl);
        });
      });

      var sendBtn = $('[data-send]', tryItEl);
      if (sendBtn) {
        sendBtn.addEventListener('click', function () {
          sendRequest(tryItEl, sendBtn);
        });
      }
    });
  }

  function sendRequest(tryItEl, sendBtn) {
    var method = tryItEl.getAttribute('data-method') || 'GET';
    var path = tryItEl.getAttribute('data-path') || '';
    var auth = tryItEl.getAttribute('data-auth') || 'public';
    var url = buildUrl(path, tryItEl);
    var statusEl = $('[data-status]', tryItEl);
    var responseEl = $('[data-response]', tryItEl);
    var responseMeta = $('[data-response-meta]', tryItEl);
    var responseBody = $('[data-response-body]', tryItEl);

    var headers = { Accept: 'application/json' };
    if (auth === 'session') {
      var token = getToken();
      if (!token) {
        if (statusEl) {
          statusEl.textContent = translate('client.bearerRequired', currentLocale);
          statusEl.className = 'try-it__status try-it__status--error';
        }
        return;
      }
      headers.Authorization = 'Bearer ' + token;
    }

    var options = { method: method, headers: headers };
    if (method !== 'GET' && method !== 'DELETE') {
      var bodyEl = $('.try-it__body', tryItEl);
      var raw = bodyEl ? bodyEl.value.trim() : '';
      if (raw) {
        try {
          JSON.parse(raw);
          headers['Content-Type'] = 'application/json';
          options.body = raw;
        } catch (e) {
          if (statusEl) {
            statusEl.textContent = translate('client.invalidJson', currentLocale);
            statusEl.className = 'try-it__status try-it__status--error';
          }
          return;
        }
      }
    }

    sendBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = translate('client.sending', currentLocale);
      statusEl.className = 'try-it__status try-it__status--pending';
    }

    fetch(url, options)
      .then(function (response) {
        return response.text().then(function (text) {
          return { response: response, text: text };
        });
      })
      .then(function (result) {
        var response = result.response;
        var text = result.text;
        var formatted = text;

        try {
          formatted = JSON.stringify(JSON.parse(text), null, 2);
        } catch (e) {}

        if (statusEl) {
          statusEl.textContent = response.status + ' ' + response.statusText;
          statusEl.className = 'try-it__status try-it__status--' + (response.ok ? 'ok' : 'error');
        }
        if (responseMeta) {
          var contentType = response.headers.get('content-type') || translate('client.noContentType', currentLocale);
          responseMeta.textContent = method + ' ' + url + ' · ' + contentType;
        }
        if (responseBody) {
          responseBody.textContent = formatted || translate('client.emptyBody', currentLocale);
        }
        if (responseEl) responseEl.hidden = false;
      })
      .catch(function (err) {
        if (statusEl) {
          statusEl.textContent = translate('client.networkError', currentLocale);
          statusEl.className = 'try-it__status try-it__status--error';
        }
        if (responseMeta) responseMeta.textContent = method + ' ' + url;
        if (responseBody) responseBody.textContent = String(err && err.message ? err.message : err);
        if (responseEl) responseEl.hidden = false;
      })
      .finally(function () {
        sendBtn.disabled = false;
      });
  }

  function initSeedCopy() {
    var seedMap = {};
    (config.seedGroups || []).forEach(function (group) {
      (group.items || []).forEach(function (item) {
        seedMap[item.id] = item.value;
      });
    });

    $all('.seed-item__copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-seed-id');
        var value = id ? seedMap[id] : '';
        if (!value) return;

        navigator.clipboard.writeText(value).then(function () {
          btn.classList.add('seed-item__copy--done');
          setTimeout(function () {
            btn.classList.remove('seed-item__copy--done');
          }, 1500);
        }).catch(function () {
          window.prompt(translate('client.copyPrompt', currentLocale), value);
        });
      });
    });
  }

  initLocale();
  initTheme();
  initSidebarTabs();
  initNavLinks();
  initBaseUrlControls();
  initTokenControls();
  initTryItPanels();
  initSeedCopy();
})();
`.trim();
