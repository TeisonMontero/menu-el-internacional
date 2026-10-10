(() => {
  "use strict";

  const MENU = window.MENU || [];

  // Horario en hora de Utah (America/Denver). Índice 0 = domingo.
  const HOURS = [
    ["08:30", "23:00"],
    ["09:00", "21:00"],
    ["09:00", "21:00"],
    ["09:00", "21:00"],
    ["09:00", "21:00"],
    ["08:00", "23:00"],
    ["08:00", "23:00"],
  ];

  // Pares de color de cada portada (naranja, morado y magenta de la marca)
  const ACCENTS = [
    ["#ff9f1c", "#7c2ae8"],
    ["#e0158a", "#ff9f1c"],
    ["#7c2ae8", "#e0158a"],
    ["#ffd23f", "#ff7a00"],
    ["#ff7a00", "#7c2ae8"],
  ];

  const I18N = {
    es: {
      docTitle: "Menú · El Internacional",
      skip: "Saltar al menú",
      langBtn: "EN",
      langLabel: "View the menu in English",
      eyebrow: "Burger & Latin Food · Taylorsville, UT",
      title: "Nuestro <span>menú</span>",
      slogan: "One bite. <b>Full sabor.</b>",
      searchPh: "Buscar en el menú…",
      searchLabel: "Buscar en el menú",
      searchBtn: "Buscar en el menú",
      clear: "Borrar búsqueda",
      tabsLabel: "Categorías del menú",
      items: (n) => (n === 1 ? "1 plato" : `${n} platos`),
      soldOut: "Agotado",
      prev: "Anterior",
      next: "Siguiente",
      seeAll: "Ver todo",
      results: (n) => (n === 1 ? "1 resultado para" : `${n} resultados para`),
      noResults: "No encontramos platos con esa búsqueda. Prueba con otra palabra.",
      open: "Abierto ahora",
      closesAt: (t) => `cierra a las ${t}`,
      closed: "Cerrado",
      opensToday: (t) => `abre hoy a las ${t}`,
      opensTomorrow: (t) => `abre mañana a las ${t}`,
      am: "a. m.",
      pm: "p. m.",
      days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
      hours: "Horario",
      tz: "Hora de Utah (MT)",
      visit: "Restaurante",
      directions: "Cómo llegar",
      truckHours: "Martes a domingo · 5:00 p. m. – 12:00 a. m.",
      note: "Precios en USD, sujetos a cambio sin previo aviso.",
      order: "Ordenar en línea",
      reserve: "Reservar",
    },
    en: {
      docTitle: "Menu · El Internacional",
      skip: "Skip to menu",
      langBtn: "ES",
      langLabel: "Ver el menú en español",
      eyebrow: "Burger & Latin Food · Taylorsville, UT",
      title: "Our <span>menu</span>",
      slogan: "One bite. <b>Full sabor.</b>",
      searchPh: "Search the menu…",
      searchLabel: "Search the menu",
      searchBtn: "Search the menu",
      clear: "Clear search",
      tabsLabel: "Menu categories",
      items: (n) => (n === 1 ? "1 item" : `${n} items`),
      soldOut: "Sold out",
      prev: "Previous",
      next: "Next",
      seeAll: "See all",
      results: (n) => (n === 1 ? "1 result for" : `${n} results for`),
      noResults: "No dishes match that search. Try another word.",
      open: "Open now",
      closesAt: (t) => `closes at ${t}`,
      closed: "Closed",
      opensToday: (t) => `opens today at ${t}`,
      opensTomorrow: (t) => `opens tomorrow at ${t}`,
      am: "AM",
      pm: "PM",
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      hours: "Hours",
      tz: "Utah time (MT)",
      visit: "Restaurant",
      directions: "Directions",
      truckHours: "Tuesday to Sunday · 5:00 PM – 12:00 AM",
      note: "Prices in USD, subject to change without notice.",
      order: "Order online",
      reserve: "Reserve",
    },
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const tabsEl = $("#tabs");
  const indicator = $("#indicator");
  const panelsEl = $("#panels");
  const resultsEl = $("#results");
  const toolbar = $("#toolbar");
  const menuEl = $("#menu");
  const search = $("#search");
  const searchClear = $("#search-clear");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    lang: initialLang(),
    active: initialTab(),
    query: "",
  };

  const t = (key) => I18N[state.lang][key];

  // ---------- Utilidades ----------
  function storage(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
    return null;
  }

  function initialLang() {
    const param = new URLSearchParams(location.search).get("lang");
    if (param === "es" || param === "en") return param;
    const saved = storage("menu-lang");
    if (saved === "es" || saved === "en") return saved;
    return "es";
  }

  function initialTab() {
    const id = decodeURIComponent(location.hash.slice(1));
    const i = MENU.findIndex((c) => c.id === id);
    return i >= 0 ? i : 0;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  // Quita acentos manteniendo la misma longitud que el texto original (NFC)
  function fold(s) {
    return [...s.normalize("NFC")].map((ch) => ch.normalize("NFD").replace(/[̀-ͯ]/g, "") || ch).join("").toLowerCase();
  }

  const money = (n) => `$${n.toFixed(2)}`;
  const behavior = () => (reduceMotion.matches ? "auto" : "smooth");

  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';

  function sortedItems(cat) {
    return [...cat.items].sort((a, b) => Number(b.available) - Number(a.available));
  }

  function itemHTML(item, nameHTML) {
    const out = !item.available;
    const cls = ["item", out && "is-out", item.img && "has-img"].filter(Boolean).join(" ");
    return `<li class="${cls}">
      ${item.img ? `<img class="item__img" src="${esc(item.img)}" alt="" width="76" height="76" loading="lazy" decoding="async">` : ""}
      <div class="item__body">
        <div class="item__top">
          <span class="item__name">${nameHTML || esc(item.name)}${out ? `<span class="badge">${t("soldOut")}</span>` : ""}</span>
          <span class="item__lead" aria-hidden="true"></span>
          <span class="item__price">${money(item.price)}</span>
        </div>
        ${item.desc ? `<p class="item__desc">${esc(item.desc[state.lang])}</p>` : ""}
      </div>
    </li>`;
  }

  // ---------- Pestañas y paneles ----------
  function renderTabs() {
    $$(".tab", tabsEl).forEach((b) => b.remove());
    MENU.forEach((cat, i) => {
      const b = document.createElement("button");
      b.className = "tab";
      b.type = "button";
      b.id = `tab-${cat.id}`;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", `panel-${cat.id}`);
      b.textContent = cat.name;
      b.addEventListener("click", () => {
        if (state.query) clearSearch();
        select(i, { scrollPage: true });
      });
      tabsEl.appendChild(b);
    });
  }

  function renderPanels() {
    panelsEl.innerHTML = MENU.map((cat, i) => {
      const [a1, a2] = ACCENTS[i % ACCENTS.length];
      const prev = MENU[i - 1];
      const next = MENU[i + 1];
      return `<section class="panel" id="panel-${cat.id}" role="tabpanel" aria-labelledby="tab-${cat.id}" tabindex="0" hidden>
        <figure class="banner" style="--a1:${a1}66;--a2:${a2}66">
          ${cat.img ? `<img src="${esc(cat.img)}" alt="" loading="lazy" decoding="async">` : ""}
          <span class="banner__ghost" aria-hidden="true">${esc(cat.name)}</span>
          <span class="banner__stars" aria-hidden="true">${STAR.repeat(5)}</span>
          <figcaption class="banner__text">
            <span class="banner__count">${t("items")(cat.items.length)}</span>
            <h2>${esc(cat.name)}</h2>
            <p>${esc(cat.tagline[state.lang])}</p>
          </figcaption>
        </figure>
        <ul class="items">${sortedItems(cat).map((it) => itemHTML(it)).join("")}</ul>
        <div class="pager">
          ${prev ? `<button type="button" class="pager__prev" data-go="${i - 1}"><small>← ${t("prev")}</small><span>${esc(prev.name)}</span></button>` : ""}
          ${next ? `<button type="button" class="pager__next" data-go="${i + 1}"><small>${t("next")} →</small><span>${esc(next.name)}</span></button>` : ""}
        </div>
      </section>`;
    }).join("");

    $$(".banner img", panelsEl).forEach((img) => {
      const fig = img.closest(".banner");
      const done = () => fig.classList.add("is-loaded");
      if (img.complete && img.naturalWidth) done();
      img.addEventListener("load", done);
      img.addEventListener("error", () => img.remove());
    });

    $$("[data-go]", panelsEl).forEach((b) =>
      b.addEventListener("click", () => select(Number(b.dataset.go), { scrollPage: true, focusTab: true }))
    );

    showPanel(state.active, 0);
  }

  function showPanel(index, dir) {
    $$(".panel", panelsEl).forEach((p, i) => {
      p.hidden = i !== index;
      p.classList.remove("is-entering");
    });
    const panel = panelsEl.children[index];
    if (!panel) return;
    panel.style.setProperty("--dx", `${dir * 28}px`);
    panel.style.setProperty("--dy", dir ? "0px" : "8px");
    void panel.offsetWidth; // reinicia la animación
    panel.classList.add("is-entering");
  }

  function select(index, opts = {}) {
    if (index < 0 || index >= MENU.length) return;
    const dir = opts.dir !== undefined ? opts.dir : Math.sign(index - state.active);
    state.active = index;

    $$(".tab", tabsEl).forEach((b, i) => {
      const on = i === index;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    showPanel(index, dir);
    moveIndicator();
    centerTab(opts.instant);

    if (opts.focusTab) $$(".tab", tabsEl)[index].focus({ preventScroll: true });
    if (opts.scrollPage) alignMenu();

    if (!opts.instant) {
      try {
        history.replaceState(null, "", `#${MENU[index].id}`);
      } catch (e) { /* contextos sin historial */ }
    }
  }

  function moveIndicator() {
    const tab = $$(".tab", tabsEl)[state.active];
    if (!tab) return;
    indicator.style.width = `${tab.offsetWidth}px`;
    indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
  }

  function centerTab(instant) {
    const tab = $$(".tab", tabsEl)[state.active];
    if (!tab) return;
    const left = tab.offsetLeft - (tabsEl.clientWidth - tab.offsetWidth) / 2;
    tabsEl.scrollTo({ left, behavior: instant ? "auto" : behavior() });
  }

  // Si la barra ya está fija, sube al inicio de la categoría
  function alignMenu() {
    const top = menuEl.getBoundingClientRect().top;
    const bar = toolbar.offsetHeight;
    if (top < bar) window.scrollTo({ top: window.scrollY + top - bar, behavior: behavior() });
  }

  function updateFades() {
    const max = tabsEl.scrollWidth - tabsEl.clientWidth;
    tabsEl.style.setProperty("--fade-l", tabsEl.scrollLeft > 4 ? "28px" : "0px");
    tabsEl.style.setProperty("--fade-r", tabsEl.scrollLeft < max - 4 ? "28px" : "0px");
  }

  tabsEl.addEventListener("keydown", (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: "first", End: "last" };
    if (!(e.key in keys)) return;
    e.preventDefault();
    if (state.query) clearSearch();
    const k = keys[e.key];
    const i = k === "first" ? 0 : k === "last" ? MENU.length - 1 : Math.min(MENU.length - 1, Math.max(0, state.active + k));
    select(i, { focusTab: true });
  });
  tabsEl.addEventListener("scroll", updateFades, { passive: true });

  // Deslizar a izquierda/derecha para cambiar de categoría
  let touch = null;
  panelsEl.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return (touch = null);
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, { passive: true });
  panelsEl.addEventListener("touchend", (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    const quick = Date.now() - touch.t < 700;
    touch = null;
    if (quick && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) {
      const step = dx < 0 ? 1 : -1;
      select(state.active + step, { dir: step, scrollPage: true });
    }
  }, { passive: true });

  // ---------- Búsqueda ----------
  function highlight(text, q) {
    const i = fold(text).indexOf(q);
    if (i < 0 || !q) return esc(text);
    return `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`;
  }

  function renderResults() {
    const q = fold(state.query.trim());
    let total = 0;
    const groups = MENU.map((cat, ci) => {
      const catHit = fold(cat.name).includes(q);
      const hits = sortedItems(cat).filter((it) =>
        catHit || fold(it.name).includes(q) || (it.desc && fold(it.desc[state.lang]).includes(q))
      );
      total += hits.length;
      if (!hits.length) return "";
      return `<div class="results__group">
        <button type="button" class="results__head" data-cat="${ci}">
          <h3>${highlight(cat.name, q)}</h3><span>${t("seeAll")} →</span>
        </button>
        <ul class="items">${hits.map((it) => itemHTML(it, highlight(it.name, q))).join("")}</ul>
      </div>`;
    }).join("");

    resultsEl.innerHTML = total
      ? `<p class="results__summary">${t("results")(total)} “<strong></strong>”</p>${groups}`
      : `<p class="empty"></p>`;
    if (total) $(".results__summary strong", resultsEl).textContent = state.query.trim();
    else $(".empty", resultsEl).textContent = t("noResults");

    $$("[data-cat]", resultsEl).forEach((b) =>
      b.addEventListener("click", () => {
        clearSearch();
        select(Number(b.dataset.cat), { scrollPage: true, focusTab: true });
      })
    );
  }

  function applySearch() {
    const active = state.query.trim().length > 0;
    document.body.classList.toggle("is-searching", active);
    searchClear.hidden = !search.value;
    panelsEl.hidden = active;
    resultsEl.hidden = !active;
    if (active) renderResults();
    else resultsEl.innerHTML = "";
  }

  function clearSearch() {
    search.value = "";
    state.query = "";
    applySearch();
  }

  search.addEventListener("input", () => {
    state.query = search.value;
    applySearch();
  });
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clearSearch();
    if (e.key === "Enter") {
      search.blur();
      alignMenu();
    }
  });
  searchClear.addEventListener("click", () => {
    clearSearch();
    search.focus();
  });
  $("#search-jump").addEventListener("click", () => {
    search.scrollIntoView({ block: "center", behavior: behavior() });
    search.focus({ preventScroll: true });
  });

  // ---------- Horario y estado abierto/cerrado ----------
  const toMin = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  function fmtTime(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? t("am") : t("pm")}`;
  }

  function utahNow() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Denver",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
  }

  function renderStatus() {
    const el = $("#status");
    const text = $("#status-text");
    let now;
    try {
      now = utahNow();
    } catch (e) {
      el.hidden = true;
      return;
    }
    const [open, close] = HOURS[now.day];
    const isOpen = now.min >= toMin(open) && now.min < toMin(close);
    el.classList.toggle("is-open", isOpen);
    let detail;
    if (isOpen) detail = t("closesAt")(fmtTime(close));
    else if (now.min < toMin(open)) detail = t("opensToday")(fmtTime(open));
    else detail = t("opensTomorrow")(fmtTime(HOURS[(now.day + 1) % 7][0]));
    text.innerHTML = `<strong>${isOpen ? t("open") : t("closed")}</strong> · ${detail}`;
    renderHours(now.day);
  }

  function renderHours(today) {
    const days = t("days");
    const order = [1, 2, 3, 4, 5, 6, 0];
    const groups = [];
    order.forEach((d) => {
      const last = groups[groups.length - 1];
      if (last && HOURS[last.days[0]].join() === HOURS[d].join()) last.days.push(d);
      else groups.push({ days: [d] });
    });
    $("#hours").innerHTML = groups.map((g) => {
      const first = days[g.days[0]];
      const label = g.days.length > 1 ? `${first} – ${days[g.days[g.days.length - 1]]}` : first;
      const [o, c] = HOURS[g.days[0]];
      return `<li${g.days.includes(today) ? ' class="is-today"' : ""}><span>${label}</span><span>${fmtTime(o)} – ${fmtTime(c)}</span></li>`;
    }).join("");
  }

  // ---------- Idioma ----------
  function applyLang() {
    document.documentElement.lang = state.lang;
    document.title = t("docTitle");
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    $$("[data-i18n-attr]").forEach((el) =>
      el.dataset.i18nAttr.split(",").forEach((pair) => {
        const [attr, key] = pair.split(":");
        el.setAttribute(attr, t(key));
      })
    );
    renderPanels();
    renderStatus();
    if (state.query) renderResults();
  }

  $("#lang-toggle").addEventListener("click", () => {
    state.lang = state.lang === "es" ? "en" : "es";
    storage("menu-lang", state.lang);
    applyLang();
  });

  // ---------- Inicio ----------
  renderTabs();
  applyLang();
  select(state.active, { instant: true });
  updateFades();
  requestAnimationFrame(() => tabsEl.classList.add("is-ready"));

  const relayout = () => {
    moveIndicator();
    updateFades();
  };
  window.addEventListener("resize", relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    relayout();
    centerTab(true);
  });
  window.addEventListener("hashchange", () => {
    const i = initialTab();
    if (i !== state.active) select(i, { scrollPage: true });
  });
  setInterval(renderStatus, 60 * 1000);
})();
