export const DOCS_STYLES = `
:root,
[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0b0f14;
  --bg-elevated: #121820;
  --bg-card: #151c26;
  --bg-input: #0e131a;
  --border: #243041;
  --border-subtle: #1a2330;
  --text: #e8eef6;
  --text-muted: #8fa3bc;
  --accent: #3dd68c;
  --accent-dim: rgba(61, 214, 140, 0.12);
  --accent-hover: #2fb872;
  --get: #61affe;
  --post: #49cc90;
  --patch: #fca130;
  --delete: #f93e3e;
  --public: #a29bfe;
  --session: #55efc4;
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  --code-bg: #0a0e13;
  --topbar-bg: rgba(11, 15, 20, 0.92);
}

[data-theme="light"] {
  color-scheme: light;
  --bg: #f4f7fb;
  --bg-elevated: #ffffff;
  --bg-card: #ffffff;
  --bg-input: #f8fafc;
  --border: #d8e0ea;
  --border-subtle: #e8edf4;
  --text: #1a2332;
  --text-muted: #5c6b7f;
  --accent: #0d9f6e;
  --accent-dim: rgba(13, 159, 110, 0.1);
  --accent-hover: #0b865d;
  --get: #2563eb;
  --post: #059669;
  --patch: #d97706;
  --delete: #dc2626;
  --public: #6366f1;
  --session: #0d9488;
  --shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  --code-bg: #f1f5f9;
  --topbar-bg: rgba(255, 255, 255, 0.92);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.55;
}

.docs-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-height: 100vh;
  width: 100%;
}

.docs-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── Top bar ── */
.docs-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
  background: var(--topbar-bg);
  backdrop-filter: blur(10px);
}

.docs-topbar__eyebrow {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  font-weight: 600;
}

.docs-topbar__title {
  margin: 0.15rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.docs-topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.docs-topbar__link {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.docs-topbar__link:hover { color: var(--accent); border-color: var(--accent); }

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.theme-toggle:hover { border-color: var(--accent); background: var(--accent-dim); }

.theme-toggle__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  line-height: 0;
}

.theme-icon {
  display: block;
  width: 18px;
  height: 18px;
  margin: auto;
}

[data-theme="dark"] .theme-toggle__icon--light { display: none; }
[data-theme="light"] .theme-toggle__icon--dark { display: none; }

.lang-switch {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-card);
}

.lang-switch__btn {
  min-width: 2.5rem;
  padding: 0.45rem 0.65rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.lang-switch__btn + .lang-switch__btn {
  border-left: 1px solid var(--border);
}

.lang-switch__btn:hover {
  color: var(--text);
  background: var(--accent-dim);
}

.lang-switch__btn--active {
  color: var(--accent);
  background: var(--accent-dim);
}

/* ── Sidebar ── */
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: var(--bg-elevated);
  overflow: hidden;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar__logo-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent), #1e8f5a);
  color: #fff;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar__logo { font-weight: 700; font-size: 0.95rem; line-height: 1.2; }
.sidebar__version { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem; }

.sidebar__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  padding: 0.75rem 0.75rem 0;
}

.sidebar-tab {
  padding: 0.55rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.sidebar-tab:hover { color: var(--text); border-color: var(--text-muted); }
.sidebar-tab--active {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}

.sidebar__panels {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.5rem 1.5rem;
}

.sidebar-panel { display: none; }
.sidebar-panel--active { display: block; }

.sidebar-panel__intro {
  margin: 0 0.5rem 1rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.45;
}

/* Nav groups */
.nav-group { margin-bottom: 1rem; }
.nav-group__title {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin: 0 0.5rem 0.4rem;
  font-weight: 700;
}
.nav-group__list { list-style: none; padding: 0; margin: 0; }

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.5rem;
  margin: 0.1rem 0.25rem;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.82rem;
  border: 1px solid transparent;
  transition: all 0.12s;
}
.nav-link:hover {
  color: var(--text);
  background: var(--accent-dim);
  border-color: var(--border-subtle);
}
.nav-link--active {
  color: var(--text);
  background: var(--accent-dim);
  border-color: var(--accent);
}

.nav-link__method {
  flex-shrink: 0;
  width: 3.1rem;
  text-align: center;
  padding: 0.12rem 0;
  border-radius: 4px;
  font-size: 0.62rem;
  font-weight: 800;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.02em;
}
.nav-link__method--get { background: rgba(97, 175, 254, 0.18); color: var(--get); }
.nav-link__method--post { background: rgba(73, 204, 144, 0.18); color: var(--post); }
.nav-link__method--patch { background: rgba(252, 161, 48, 0.18); color: var(--patch); }
.nav-link__method--delete { background: rgba(249, 62, 62, 0.18); color: var(--delete); }
.nav-link__text { line-height: 1.3; }

/* Seeds */
.seed-group { margin-bottom: 1.25rem; }
.seed-group__title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0.5rem 0.5rem;
  font-weight: 700;
}

.seed-item {
  margin: 0 0.25rem 0.65rem;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-card);
}
.seed-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.seed-item__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
  font-family: ui-monospace, monospace;
}
.seed-item__copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.seed-item__copy:hover { color: var(--accent); border-color: var(--accent); }
.seed-item__copy--done { color: var(--accent); border-color: var(--accent); background: var(--accent-dim); }
.seed-icon { width: 14px; height: 14px; }

.seed-item__value {
  margin: 0;
  padding: 0.45rem 0.5rem;
  background: var(--code-bg);
  border-radius: 6px;
  font-size: 0.72rem;
  font-family: ui-monospace, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 6rem;
  overflow-y: auto;
  color: var(--text);
}
.seed-item__description {
  margin: 0.4rem 0 0;
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* ── Main content ── */
.docs-main {
  flex: 1;
  width: 100%;
  padding: 1.5rem 2rem 4rem;
}

.docs-intro {
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}
.docs-intro__description { color: var(--text-muted); margin: 0 0 0.75rem; max-width: 72ch; }
.docs-intro__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}
.docs-intro__auth h3 { font-size: 0.85rem; margin: 0 0 0.4rem; }
.docs-intro__auth ul { margin: 0; padding-left: 1.2rem; color: var(--text-muted); font-size: 0.85rem; }

/* Test console */
.test-console {
  margin-bottom: 2rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow);
}
.test-console__title { margin: 0 0 0.25rem; font-size: 1.05rem; }
.test-console__subtitle { margin: 0 0 1rem; font-size: 0.85rem; color: var(--text-muted); }
.test-console__grid {
  display: grid;
  grid-template-columns: minmax(180px, 240px) 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}
.test-console__field { display: flex; flex-direction: column; gap: 0.35rem; }
.test-console__field--grow { min-width: 0; }
.test-console__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.test-console__hint {
  display: block;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--text-muted);
  font-size: 0.75rem;
  margin-top: 0.15rem;
}
.test-console__select,
.test-console__input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text);
  font-size: 0.875rem;
  font-family: inherit;
}
.test-console__input:focus,
.test-console__select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
.test-console__token-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}
.test-console__input--token { flex: 1; font-family: ui-monospace, monospace; font-size: 0.8rem; }
.test-console__btn {
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-elevated);
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}
.test-console__btn:hover { color: var(--text); border-color: var(--text-muted); }

/* Endpoints */
.endpoint-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow);
}

.endpoint-header__line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.endpoint-header__title { margin: 0 0 0.4rem; font-size: 1.2rem; scroll-margin-top: 5rem; }
.endpoint-header__description { color: var(--text-muted); margin: 0 0 0.65rem; font-size: 0.9rem; }
.endpoint-header__statuses { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.78rem; color: var(--text-muted); }

.method {
  display: inline-block;
  padding: 0.22rem 0.6rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  font-family: ui-monospace, monospace;
}
.method-get { background: rgba(97, 175, 254, 0.18); color: var(--get); }
.method-post { background: rgba(73, 204, 144, 0.18); color: var(--post); }
.method-patch { background: rgba(252, 161, 48, 0.18); color: var(--patch); }
.method-delete { background: rgba(249, 62, 62, 0.18); color: var(--delete); }

.badge {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.badge-public { background: rgba(108, 92, 231, 0.15); color: var(--public); }
.badge-session { background: rgba(0, 184, 148, 0.15); color: var(--session); }

.status {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-family: ui-monospace, monospace;
  font-weight: 700;
}
.status-2xx { background: rgba(73, 204, 144, 0.15); color: var(--post); }
.status-3xx { background: rgba(97, 175, 254, 0.15); color: var(--get); }
.status-4xx { background: rgba(252, 161, 48, 0.15); color: var(--patch); }
.status-5xx { background: rgba(249, 62, 62, 0.15); color: var(--delete); }

.inline-code, code {
  font-family: ui-monospace, monospace;
  font-size: 0.85em;
  background: var(--code-bg);
  padding: 0.12rem 0.4rem;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

/* Try it */
.try-it {
  margin: 1rem 0 1.25rem;
  padding: 1rem;
  border: 1px dashed var(--accent);
  border-radius: 10px;
  background: var(--accent-dim);
}
.try-it__header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.try-it__title {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}
.try-it__url-preview {
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  color: var(--text-muted);
  word-break: break-all;
}
.try-it__params {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.try-it__param { flex: 1; min-width: 140px; }
.try-it__param-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  font-family: ui-monospace, monospace;
}
.try-it__param-input,
.try-it__body {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text);
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  resize: vertical;
}
.try-it__body-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}
.try-it__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.btn-primary {
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.try-it__status {
  font-size: 0.82rem;
  font-weight: 600;
  font-family: ui-monospace, monospace;
}
.try-it__status--ok { color: var(--post); }
.try-it__status--error { color: var(--delete); }
.try-it__status--pending { color: var(--text-muted); }

.try-it__response {
  margin-top: 0.85rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--code-bg);
}
.try-it__response-meta {
  padding: 0.45rem 0.75rem;
  font-size: 0.72rem;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  word-break: break-all;
}
.try-it__response-body {
  margin: 0;
  padding: 0.85rem;
  overflow-x: auto;
  font-size: 0.78rem;
  line-height: 1.55;
  max-height: 320px;
  overflow-y: auto;
}

.code-block {
  margin: 1rem 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--code-bg);
}
.code-block__label {
  padding: 0.4rem 0.75rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}
.code-block pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: ui-monospace, monospace;
  font-size: 0.78rem;
  line-height: 1.6;
}

.schema-table, .error-table { margin: 1rem 0; }
.schema-table__title, .error-table__title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0 0 0.5rem;
  font-weight: 700;
}
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
th, td {
  text-align: left;
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: top;
}
th { color: var(--text-muted); font-weight: 600; font-size: 0.72rem; }
.field-required { color: var(--accent); font-size: 0.62rem; margin-left: 0.25rem; }
.field-optional { color: var(--text-muted); font-size: 0.62rem; margin-left: 0.25rem; }
.field-enum { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; font-family: ui-monospace, monospace; }

.docs-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 960px) {
  .docs-shell { grid-template-columns: 1fr; }
  .sidebar {
    position: relative;
    height: auto;
    max-height: 50vh;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .docs-main { padding: 1rem; }
  .docs-topbar { padding: 0.85rem 1rem; }
  .test-console__grid { grid-template-columns: 1fr; }
}
`;
