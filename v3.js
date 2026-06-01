import { createClient } from "@supabase/supabase-js";

const app = document.querySelector("#v3-app");

const ADMIN_EMAIL = "lyl549439629@gmail.com";
const REPORT_STATE_ID = "current";
const ASSET_BUCKET = "report-assets";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null;

const defaultTheme = {
  background: {
    url: "/images/gopark-background.jpg",
    opacity: 0.65,
  },
  cards: {},
};

const state = {
  baseReport: null,
  report: null,
  theme: structuredClone(defaultTheme),
  loading: true,
  error: "",
  isAdminMode: new URLSearchParams(window.location.search).get("admin") === "1",
  session: null,
  isAdmin: false,
  authMessage: "",
  editorOpen: false,
  draft: null,
  saving: false,
  uploading: "",
  activeDetailKey: "",
};

const progressKeys = ["hacking_progress", "plaster_progress", "clp_draw_pit"];
const contentKeys = ["fountain_programme", "additional_works", "defect"];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function clone(value) {
  return structuredClone(value);
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isEmptyObject(value) {
  return isObject(value) && Object.keys(value).length === 0;
}

function mergeTheme(theme) {
  return {
    ...clone(defaultTheme),
    ...(isObject(theme) ? theme : {}),
    background: {
      ...defaultTheme.background,
      ...(isObject(theme?.background) ? theme.background : {}),
    },
    cards: {
      ...(isObject(theme?.cards) ? theme.cards : {}),
    },
  };
}

function sectionByKey(key, report = state.report) {
  return report?.sections?.find((section) => section.section_key === key);
}

function metric(section, label) {
  return section?.metrics?.find((item) => item.label === label)?.value || "";
}

function progressPercent(section) {
  const value = metric(section, "Progress");
  const match = value.match(/[0-9.]+/);
  return match ? Math.min(100, Number(match[0])) : 0;
}

function sectionCardTheme(section) {
  return state.theme.cards?.[section.section_key] || {};
}

function readableTextColor(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return "";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.58 ? "#17181c" : "#f7f8f8";
}

function cardStyle(section) {
  const card = sectionCardTheme(section);
  if (!card.background) return "";
  const ink = readableTextColor(card.background);
  return ` style="--card-bg: ${escapeAttr(card.background)}; ${ink ? `--card-ink: ${ink}; --card-muted: ${ink}; --card-subtle: ${ink}; --card-tertiary: ${ink};` : ""}"`;
}

function applyTheme() {
  const background = state.theme.background || defaultTheme.background;
  document.documentElement.style.setProperty("--report-bg-url", `url("${background.url || defaultTheme.background.url}")`);
  document.documentElement.style.setProperty("--report-bg-opacity", String(background.opacity ?? defaultTheme.background.opacity));
}

async function init() {
  try {
    const response = await fetch("/data/report.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load report (${response.status}).`);
    state.baseReport = await response.json();
    state.report = clone(state.baseReport);

    if (supabase) {
      await initSupabase();
      await loadPublishedState();
    }
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    applyTheme();
    render();
  }
}

async function initSupabase() {
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  await refreshAdmin();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    await refreshAdmin();
    render();
  });
}

async function refreshAdmin() {
  state.isAdmin = false;
  if (!supabase || !state.session) return;

  const { data, error } = await supabase.rpc("is_report_admin");
  if (error) {
    state.authMessage = error.message;
    return;
  }
  state.isAdmin = Boolean(data);
}

async function loadPublishedState() {
  const { data, error } = await supabase
    .from("report_page_state")
    .select("report, theme")
    .eq("id", REPORT_STATE_ID)
    .maybeSingle();

  if (error) {
    state.authMessage = `Published edits unavailable: ${error.message}`;
    return;
  }

  if (data?.report && !isEmptyObject(data.report)) {
    state.report = data.report;
  }

  state.theme = mergeTheme(data?.theme);
}

function renderLoading() {
  app.innerHTML = `
    <main class="v3-boot">
      <p class="v3-eyebrow">Morning Meeting Report</p>
      <h1>Loading report</h1>
    </main>
  `;
}

function renderError() {
  app.innerHTML = `
    <main class="v3-boot">
      <section class="v3-alert">
        <p class="v3-eyebrow">Report unavailable</p>
        <h1>Unable to load report</h1>
        <p>${escapeHtml(state.error)}</p>
      </section>
    </main>
  `;
}

function renderMetaPills(report) {
  const header = report.report_header;
  return `
    <div class="v3-meta">
      <span>${escapeHtml(header.reporter)}</span>
      <span>${escapeHtml(header.date)}</span>
      <span>${escapeHtml(report.sourceFile)}</span>
    </div>
  `;
}

function renderRailItem(section) {
  const progress = metric(section, "Progress");
  const secondary =
    metric(section, "Remaining") ||
    metric(section, "Target") ||
    metric(section, "Forecast") ||
    metric(section, "As of");

  return `
    <a class="v3-rail-item" href="#${escapeAttr(section.section_key)}"${cardStyle(section)}>
      <span>${escapeHtml(section.title)}</span>
      <strong>${escapeHtml(progress || secondary)}</strong>
      ${secondary && progress ? `<small>${escapeHtml(secondary)}</small>` : ""}
    </a>
  `;
}

function renderRail(report) {
  const header = report.report_header;
  const railSections = progressKeys.map((key) => sectionByKey(key)).filter(Boolean);

  return `
    <aside class="v3-rail" aria-label="Report index">
      <div class="v3-rail-block">
        <p class="v3-eyebrow">Report date</p>
        <strong>${escapeHtml(header.date)}</strong>
        <span>${escapeHtml(header.reporter)}</span>
      </div>
      <div class="v3-rail-block">
        <p class="v3-eyebrow">Source</p>
        <span>${escapeHtml(report.sourceFile)}</span>
      </div>
      <nav class="v3-rail-list" aria-label="Progress sections">
        ${railSections.map(renderRailItem).join("")}
      </nav>
    </aside>
  `;
}

function renderFactList(section) {
  return `
    <dl class="v3-facts">
      ${(section.metrics || [])
        .filter((item) => item.label !== "Progress")
        .map(
          (item) => `
            <div class="v3-fact">
              <dt>${escapeHtml(item.label)}</dt>
              <dd>${escapeHtml(item.value)}</dd>
            </div>
          `,
        )
        .join("")}
    </dl>
  `;
}

function renderMediaPreview(section) {
  const media = section.media || [];
  if (!media.length) return "";
  return `
    <div class="v3-card-media" aria-hidden="true">
      <img src="${escapeAttr(media[0].url)}" alt="" loading="lazy" />
      ${media.length > 1 ? `<span>${media.length} images</span>` : ""}
    </div>
  `;
}

function renderProgressCard(section) {
  const percent = progressPercent(section);
  const progress = metric(section, "Progress");

  return `
    <article class="v3-progress-card" id="${escapeAttr(section.section_key)}" data-detail-key="${escapeAttr(section.section_key)}" role="button" tabindex="0"${cardStyle(section)}>
      ${renderMediaPreview(section)}
      <div class="v3-card-head">
        <div>
          <p class="v3-eyebrow">Slide ${escapeHtml(section.source_slide)}</p>
          <h3>${escapeHtml(section.title)}</h3>
          ${section.subtitle ? `<p>${escapeHtml(section.subtitle)}</p>` : ""}
        </div>
        ${progress ? `<strong class="v3-progress-number">${escapeHtml(progress)}</strong>` : ""}
      </div>
      ${
        progress
          ? `<div class="v3-progress-track" aria-label="Progress ${escapeHtml(progress)}"><span style="width: ${percent}%"></span></div>`
          : ""
      }
      ${renderFactList(section)}
    </article>
  `;
}

function renderChecklist(section) {
  return `
    <div class="v3-timeline">
      ${(section.checklist || [])
        .map(
          (item) => `
            <div class="v3-timeline-row ${item.checked ? "is-complete" : ""}">
              <span class="v3-check-dot" aria-hidden="true"></span>
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                ${item.status ? `<span>${escapeHtml(item.status)}</span>` : ""}
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTable(section) {
  return `
    <div class="v3-table" role="table">
      <div class="v3-table-row v3-table-head" role="row">
        <span role="columnheader">Works</span>
        <span role="columnheader">Status</span>
      </div>
      ${(section.table || [])
        .map(
          (row) => `
            <div class="v3-table-row" role="row">
              <span role="cell">${escapeHtml(row.works)}</span>
              <span role="cell">${row.status ? escapeHtml(row.status) : '<span class="v3-muted">blank / no status</span>'}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderContentSection(section) {
  const content = section.checklist ? renderChecklist(section) : renderTable(section);

  return `
    <article class="v3-panel" id="${escapeAttr(section.section_key)}" data-detail-key="${escapeAttr(section.section_key)}" role="button" tabindex="0"${cardStyle(section)}>
      ${renderMediaPreview(section)}
      <div class="v3-panel-head">
        <div>
          <p class="v3-eyebrow">Slide ${escapeHtml(section.source_slide)}</p>
          <h2>${escapeHtml(section.title)}</h2>
          ${section.subtitle ? `<p>${escapeHtml(section.subtitle)}</p>` : ""}
        </div>
      </div>
      ${content}
    </article>
  `;
}

function renderTopbar() {
  const adminControls = state.isAdminMode ? renderAdminControls() : "";
  return `
    <header class="v3-topbar">
      <a class="v3-brand" href="/" aria-label="Open Morning Meeting Report">
        <span class="v3-brand-mark"></span>
        <span>Morning Meeting Report</span>
      </a>
      <nav class="v3-actions" aria-label="Report actions">
        ${adminControls}
        <span>V3.2</span>
      </nav>
    </header>
  `;
}

function renderAdminControls() {
  if (!hasSupabaseConfig) return `<span>Supabase not configured</span>`;

  if (!state.session) {
    return `
      <form class="v3-admin-login" data-admin-login>
        <input name="email" type="email" value="${ADMIN_EMAIL}" aria-label="Admin email" required />
        <button type="submit">Email link</button>
      </form>
    `;
  }

  if (!state.isAdmin) {
    return `
      <span>Not authorized</span>
      <button type="button" data-action="logout">Logout</button>
    `;
  }

  return `
    <button type="button" data-action="open-editor">Edit</button>
    <button type="button" data-action="logout">Logout</button>
  `;
}

function renderAuthNotice() {
  if (!state.isAdminMode || !state.authMessage) return "";
  return `<div class="v3-admin-notice">${escapeHtml(state.authMessage)}</div>`;
}

function renderReport() {
  const report = state.report;
  const header = report.report_header;
  const progressSections = progressKeys.map((key) => sectionByKey(key)).filter(Boolean);
  const contentSections = contentKeys.map((key) => sectionByKey(key)).filter(Boolean);

  app.innerHTML = `
    ${renderTopbar()}
    ${renderAuthNotice()}
    <main class="v3-shell">
      ${renderRail(report)}
      <section class="v3-content">
        <section class="v3-hero">
          <p class="v3-eyebrow">${escapeHtml(header.scope)}</p>
          <h1>${escapeHtml(header.title)}</h1>
          <p>${escapeHtml(header.subject)}</p>
          ${renderMetaPills(report)}
        </section>

        <section class="v3-progress-overview" aria-label="Progress overview">
          <div class="v3-section-title">
            <p class="v3-eyebrow">Current progress</p>
            <h2>Progress Overview</h2>
          </div>
          <div class="v3-progress-grid">
            ${progressSections.map(renderProgressCard).join("")}
          </div>
        </section>

        <section class="v3-content-list" aria-label="Report details">
          ${contentSections.map(renderContentSection).join("")}
        </section>
      </section>
    </main>
    ${state.activeDetailKey ? renderDetailModal(sectionByKey(state.activeDetailKey)) : ""}
    ${state.editorOpen && state.draft ? renderEditor() : ""}
  `;
}

function renderDetailModal(section) {
  if (!section) return "";
  return `
    <div class="v3-modal-backdrop" data-action="close-detail">
      <section class="v3-detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button class="v3-icon-button" type="button" data-action="close-detail" aria-label="Close detail">×</button>
        <div>
          <p class="v3-eyebrow">Slide ${escapeHtml(section.source_slide)}</p>
          <h2 id="detail-title">${escapeHtml(section.title)}</h2>
          ${section.subtitle ? `<p>${escapeHtml(section.subtitle)}</p>` : ""}
        </div>
        ${renderDetailMedia(section)}
        ${section.metrics ? renderFactList(section) : ""}
        ${section.checklist ? renderChecklist(section) : ""}
        ${section.table ? renderTable(section) : ""}
      </section>
    </div>
  `;
}

function renderDetailMedia(section) {
  const media = section.media || [];
  if (!media.length) return `<p class="v3-empty-media">No images added</p>`;
  return `
    <div class="v3-detail-media">
      ${media
        .map(
          (item) => `
            <figure>
              <img src="${escapeAttr(item.url)}" alt="${escapeAttr(item.caption || section.title)}" />
              ${item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ""}
            </figure>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderEditor() {
  const draft = state.draft;
  const report = draft.report;
  const theme = draft.theme;

  return `
    <div class="v3-editor-backdrop">
      <aside class="v3-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div class="v3-editor-head">
          <div>
            <p class="v3-eyebrow">Admin editor</p>
            <h2 id="editor-title">Publish V3.2 edits</h2>
          </div>
          <button class="v3-icon-button" type="button" data-action="close-editor" aria-label="Close editor">×</button>
        </div>

        <div class="v3-editor-actions">
          <button type="button" data-action="save-editor" ${state.saving ? "disabled" : ""}>${state.saving ? "Saving..." : "Save / Publish"}</button>
          <button type="button" data-action="close-editor">Cancel</button>
        </div>

        ${state.uploading ? `<p class="v3-admin-notice">Uploading ${escapeHtml(state.uploading)}...</p>` : ""}
        ${state.authMessage ? `<p class="v3-admin-notice">${escapeHtml(state.authMessage)}</p>` : ""}

        <div class="v3-editor-scroll">
          ${renderThemeEditor(theme)}
          ${renderHeaderEditor(report.report_header)}
          ${(report.sections || []).map((section, index) => renderSectionEditor(section, index, theme)).join("")}
        </div>
      </aside>
    </div>
  `;
}

function renderField(label, value, attrs) {
  return `
    <label class="v3-field">
      <span>${escapeHtml(label)}</span>
      <input type="text" value="${escapeAttr(value)}" ${attrs} />
    </label>
  `;
}

function renderTextArea(label, value, attrs) {
  return `
    <label class="v3-field">
      <span>${escapeHtml(label)}</span>
      <textarea rows="3" ${attrs}>${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderThemeEditor(theme) {
  return `
    <section class="v3-editor-section">
      <h3>Background</h3>
      ${renderField("Background URL", theme.background?.url || "", 'data-edit="theme.background.url"')}
      <label class="v3-field">
        <span>Background opacity</span>
        <input type="number" min="0" max="1" step="0.05" value="${escapeAttr(theme.background?.opacity ?? 0.65)}" data-edit="theme.background.opacity" />
      </label>
      <label class="v3-file-field">
        <span>Upload background image</span>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload-background />
      </label>
    </section>
  `;
}

function renderHeaderEditor(header) {
  return `
    <section class="v3-editor-section">
      <h3>Report Header</h3>
      ${renderField("Scope", header.scope, 'data-header-field="scope"')}
      ${renderField("Title", header.title, 'data-header-field="title"')}
      ${renderTextArea("Subject", header.subject, 'data-header-field="subject"')}
      ${renderField("Reporter", header.reporter, 'data-header-field="reporter"')}
      ${renderField("Date", header.date, 'data-header-field="date"')}
    </section>
  `;
}

function renderSectionEditor(section, sectionIndex, theme) {
  const cardColor = theme.cards?.[section.section_key]?.background || "#f8fafc";
  return `
    <section class="v3-editor-section">
      <div class="v3-editor-section-title">
        <h3>${escapeHtml(section.title)}</h3>
        <label>
          <span>Card color</span>
          <input type="color" value="${escapeAttr(cardColor)}" data-card-color="${escapeAttr(section.section_key)}" />
        </label>
      </div>
      ${renderField("Title", section.title, `data-section-index="${sectionIndex}" data-section-field="title"`)}
      ${renderField("Subtitle", section.subtitle || "", `data-section-index="${sectionIndex}" data-section-field="subtitle"`)}
      ${section.metrics ? renderMetricEditor(section.metrics, sectionIndex) : ""}
      ${section.checklist ? renderChecklistEditor(section.checklist, sectionIndex) : ""}
      ${section.table ? renderTableEditor(section.table, sectionIndex) : ""}
      ${renderMediaEditor(section, sectionIndex)}
    </section>
  `;
}

function renderMetricEditor(metrics, sectionIndex) {
  return `
    <div class="v3-editor-group">
      <h4>Metrics</h4>
      ${metrics
        .map(
          (item, metricIndex) => `
            <div class="v3-editor-row">
              <input type="text" value="${escapeAttr(item.label)}" data-section-index="${sectionIndex}" data-metric-index="${metricIndex}" data-metric-field="label" aria-label="Metric label" />
              <input type="text" value="${escapeAttr(item.value)}" data-section-index="${sectionIndex}" data-metric-index="${metricIndex}" data-metric-field="value" aria-label="Metric value" />
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderChecklistEditor(checklist, sectionIndex) {
  return `
    <div class="v3-editor-group">
      <h4>Checklist</h4>
      ${checklist
        .map(
          (item, itemIndex) => `
            <div class="v3-editor-row is-check-row">
              <input type="checkbox" ${item.checked ? "checked" : ""} data-section-index="${sectionIndex}" data-check-index="${itemIndex}" data-check-field="checked" aria-label="Completed" />
              <input type="text" value="${escapeAttr(item.label)}" data-section-index="${sectionIndex}" data-check-index="${itemIndex}" data-check-field="label" aria-label="Checklist label" />
              <input type="text" value="${escapeAttr(item.status)}" data-section-index="${sectionIndex}" data-check-index="${itemIndex}" data-check-field="status" aria-label="Checklist status" />
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTableEditor(rows, sectionIndex) {
  return `
    <div class="v3-editor-group">
      <h4>Table</h4>
      ${rows
        .map(
          (row, rowIndex) => `
            <div class="v3-editor-row">
              <input type="text" value="${escapeAttr(row.works)}" data-section-index="${sectionIndex}" data-table-index="${rowIndex}" data-table-field="works" aria-label="Works" />
              <input type="text" value="${escapeAttr(row.status)}" data-section-index="${sectionIndex}" data-table-index="${rowIndex}" data-table-field="status" aria-label="Status" />
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderMediaEditor(section, sectionIndex) {
  const media = section.media || [];
  return `
    <div class="v3-editor-group">
      <h4>Images</h4>
      <label class="v3-file-field">
        <span>Upload section image</span>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload-section="${sectionIndex}" />
      </label>
      <div class="v3-editor-media-list">
        ${
          media.length
            ? media
                .map(
                  (item, mediaIndex) => `
                    <div>
                      <img src="${escapeAttr(item.url)}" alt="" />
                      <input type="text" value="${escapeAttr(item.caption || "")}" data-section-index="${sectionIndex}" data-media-index="${mediaIndex}" data-media-field="caption" aria-label="Image caption" />
                      <button type="button" data-action="remove-media" data-section-index="${sectionIndex}" data-media-index="${mediaIndex}">Remove</button>
                    </div>
                  `,
                )
                .join("")
            : '<p class="v3-empty-media">No images added</p>'
        }
      </div>
    </div>
  `;
}

async function sendMagicLink(form) {
  if (!supabase) return;
  const email = new FormData(form).get("email");
  state.authMessage = "Sending login email...";
  render();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}${window.location.pathname}?admin=1`,
      shouldCreateUser: true,
    },
  });

  state.authMessage = error ? error.message : `Login email sent to ${email}.`;
  render();
}

async function logout() {
  if (!supabase) return;
  await supabase.auth.signOut();
  state.session = null;
  state.isAdmin = false;
  state.editorOpen = false;
  state.draft = null;
  render();
}

function openEditor() {
  state.draft = {
    report: clone(state.report),
    theme: clone(state.theme),
  };
  state.editorOpen = true;
  render();
}

function closeEditor() {
  state.editorOpen = false;
  state.draft = null;
  state.saving = false;
  state.uploading = "";
  render();
}

async function saveEditor() {
  if (!supabase || !state.isAdmin || !state.draft) return;
  state.saving = true;
  state.authMessage = "";
  render();

  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("report_page_state").upsert({
    id: REPORT_STATE_ID,
    report: state.draft.report,
    theme: state.draft.theme,
    updated_by: userData.user?.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    state.authMessage = error.message;
    state.saving = false;
    render();
    return;
  }

  state.report = clone(state.draft.report);
  state.theme = mergeTheme(state.draft.theme);
  state.editorOpen = false;
  state.draft = null;
  state.saving = false;
  applyTheme();
  render();
}

function updateDraftFromInput(target) {
  if (!state.draft) return;

  const sectionIndex = Number(target.dataset.sectionIndex);

  if (target.dataset.edit === "theme.background.url") {
    state.draft.theme.background.url = target.value;
  } else if (target.dataset.edit === "theme.background.opacity") {
    state.draft.theme.background.opacity = Number(target.value);
  } else if (target.dataset.headerField) {
    state.draft.report.report_header[target.dataset.headerField] = target.value;
  } else if (target.dataset.sectionField) {
    state.draft.report.sections[sectionIndex][target.dataset.sectionField] = target.value;
  } else if (target.dataset.metricField) {
    const metricIndex = Number(target.dataset.metricIndex);
    state.draft.report.sections[sectionIndex].metrics[metricIndex][target.dataset.metricField] = target.value;
  } else if (target.dataset.tableField) {
    const tableIndex = Number(target.dataset.tableIndex);
    state.draft.report.sections[sectionIndex].table[tableIndex][target.dataset.tableField] = target.value;
  } else if (target.dataset.checkField) {
    const checkIndex = Number(target.dataset.checkIndex);
    const value = target.dataset.checkField === "checked" ? target.checked : target.value;
    state.draft.report.sections[sectionIndex].checklist[checkIndex][target.dataset.checkField] = value;
  } else if (target.dataset.mediaField) {
    const mediaIndex = Number(target.dataset.mediaIndex);
    state.draft.report.sections[sectionIndex].media[mediaIndex][target.dataset.mediaField] = target.value;
  } else if (target.dataset.cardColor) {
    const key = target.dataset.cardColor;
    state.draft.theme.cards ||= {};
    state.draft.theme.cards[key] = { ...(state.draft.theme.cards[key] || {}), background: target.value };
  }
}

async function uploadAsset(file, folder) {
  if (!supabase || !file || !state.isAdmin) return null;
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = file.name.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`.replace(`.${extension}.${extension}`, `.${extension}`);

  const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl, caption: file.name };
}

async function uploadBackground(file) {
  try {
    state.uploading = file.name;
    render();
    const uploaded = await uploadAsset(file, "backgrounds");
    if (!uploaded) return;
    state.draft.theme.background.url = uploaded.url;
  } catch (error) {
    state.authMessage = error.message;
  } finally {
    state.uploading = "";
    render();
  }
}

async function uploadSectionImage(file, sectionIndex) {
  try {
    state.uploading = file.name;
    render();
    const section = state.draft.report.sections[sectionIndex];
    const uploaded = await uploadAsset(file, `sections/${section.section_key}`);
    if (!uploaded) return;
    section.media ||= [];
    section.media.push(uploaded);
  } catch (error) {
    state.authMessage = error.message;
  } finally {
    state.uploading = "";
    render();
  }
}

function removeMedia(sectionIndex, mediaIndex) {
  const section = state.draft?.report.sections[sectionIndex];
  if (!section?.media) return;
  section.media.splice(mediaIndex, 1);
  render();
}

function openDetail(key) {
  state.activeDetailKey = key;
  render();
}

function closeDetail() {
  state.activeDetailKey = "";
  render();
}

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-admin-login]");
  if (!form) return;
  event.preventDefault();
  sendMagicLink(form);
});

app.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  const action = actionElement?.dataset.action;

  if (action === "open-editor") openEditor();
  if (action === "close-editor") closeEditor();
  if (action === "save-editor") saveEditor();
  if (action === "logout") logout();
  if (action === "remove-media") {
    const button = event.target.closest("[data-action]");
    removeMedia(Number(button.dataset.sectionIndex), Number(button.dataset.mediaIndex));
  }
  if (action === "close-detail" && (event.target === actionElement || actionElement.tagName === "BUTTON")) {
    closeDetail();
  }

  const interactive = event.target.closest("a, button, input, textarea, select, label");
  const detailCard = event.target.closest("[data-detail-key]");
  if (!interactive && detailCard) {
    openDetail(detailCard.dataset.detailKey);
  }
});

app.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.activeDetailKey) closeDetail();
  const detailCard = event.target.closest("[data-detail-key]");
  if (detailCard && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openDetail(detailCard.dataset.detailKey);
  }
});

app.addEventListener("input", (event) => {
  updateDraftFromInput(event.target);
});

app.addEventListener("change", (event) => {
  updateDraftFromInput(event.target);
  if (event.target.matches("[data-upload-background]") && event.target.files?.[0]) {
    uploadBackground(event.target.files[0]);
  }
  if (event.target.matches("[data-upload-section]") && event.target.files?.[0]) {
    uploadSectionImage(event.target.files[0], Number(event.target.dataset.uploadSection));
  }
});

function render() {
  if (state.loading) {
    renderLoading();
    return;
  }

  if (state.error || !state.report) {
    renderError();
    return;
  }

  applyTheme();
  renderReport();
}

init();
