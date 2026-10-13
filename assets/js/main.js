(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- Menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("menu");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector("span").textContent = open ? "Fechar" : "Menu";
      document.body.style.overflow = open ? "hidden" : "";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) toggle.click();
    });
  }

  /* ---------- Tema ---------- */
  var themeBtn = document.querySelector("[data-theme-toggle]");
  try {
    var saved = localStorage.getItem("obs-theme");
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  } catch (e) {}
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function labelTheme() {
    if (themeBtn) themeBtn.setAttribute("aria-label", isDark() ? "Usar tema claro" : "Usar tema escuro");
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("obs-theme", next); } catch (e) {}
      labelTheme();
    });
  }
  labelTheme();

  /* ---------- Abas ---------- */
  function activate(tabsEl, tab, focus) {
    var tabs = tabsEl.querySelectorAll(":scope > .tablist > [role=tab]");
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute("aria-controls"));
      if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }
  document.querySelectorAll(".tabs").forEach(function (tabsEl) {
    var tabs = Array.prototype.slice.call(tabsEl.querySelectorAll(":scope > .tablist > [role=tab]"));
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        activate(tabsEl, t);
        if (t.dataset.hash && history.replaceState) history.replaceState(null, "", "#" + t.dataset.hash);
      });
      t.addEventListener("keydown", function (e) {
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        var n = tabs[(i + d + tabs.length) % tabs.length];
        activate(tabsEl, n, true);
      });
    });
  });
  function fromHash() {
    var h = location.hash.slice(1);
    if (!h) return;
    var t = document.querySelector('[role=tab][data-hash="' + h + '"]');
    if (t) {
      activate(t.closest(".tabs"), t);
      t.closest(".tabs").scrollIntoView({ block: "start" });
    }
  }
  fromHash();
  window.addEventListener("hashchange", fromHash);

  /* ---------- Grupos de seleção (camadas, organograma, fases) ---------- */
  document.querySelectorAll("[data-select]").forEach(function (group) {
    var target = document.getElementById(group.getAttribute("data-select"));
    var btns = group.querySelectorAll("[data-key]");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        if (!target) return;
        target.querySelectorAll("[data-panel]").forEach(function (p) {
          p.hidden = p.getAttribute("data-panel") !== b.getAttribute("data-key");
        });
      });
    });
  });

  /* ---------- Filtros por tipo (biblioteca, boas práticas) ---------- */
  var norm = function (s) { return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
  document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
    var filters = scope.querySelector("[data-filters]");
    var q = scope.querySelector("[data-lib-q]");
    var empty = scope.querySelector("[data-lib-empty]");
    var kind = "todos";
    function apply() {
      var t = q ? norm(q.value.trim()) : "", shown = 0;
      scope.querySelectorAll("[data-kind]").forEach(function (it) {
        var ok = (kind === "todos" || it.getAttribute("data-kind") === kind) && (!t || norm(it.getAttribute("data-text") || it.textContent).indexOf(t) !== -1);
        it.hidden = !ok; if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    }
    if (filters) filters.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        kind = b.getAttribute("data-filter");
        filters.querySelectorAll("button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        apply();
      });
    });
    if (q) q.addEventListener("input", apply);
  });

  /* ---------- Busca de municípios ---------- */
  var grid = document.querySelector("[data-mgrid]");
  if (grid) {
    var input = document.querySelector("[data-search]");
    var gf = document.querySelector("[data-group-filter]");
    var empty = document.querySelector("[data-empty]");
    var grp = "all";
    var apply = function () {
      var q = norm(input.value.trim()), shown = 0;
      grid.querySelectorAll("[data-mrow]").forEach(function (c) {
        var ok = norm(c.getAttribute("data-nome")).indexOf(q) !== -1 && (grp === "all" || c.getAttribute("data-grupo") === grp);
        c.hidden = !ok; if (ok) shown++;
      });
      empty.hidden = shown > 0;
    };
    input.addEventListener("input", apply);
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var first = grid.querySelector("[data-mrow]:not([hidden])");
      if (first) location.href = first.getAttribute("href");
    });
    gf.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        grp = b.getAttribute("data-g");
        gf.querySelectorAll("button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        apply();
      });
    });
    document.querySelector("[data-clear]").addEventListener("click", function () { input.value = ""; grp = "all"; gf.querySelector("button").click(); });
  }

  /* ---------- Ordenar tabela de municípios ---------- */
  var mbody = document.querySelector("[data-mbody]");
  if (mbody) {
    document.querySelectorAll("[data-sort]").forEach(function (h) {
      h.addEventListener("click", function () {
        var k = h.getAttribute("data-sort");
        var desc = h.classList.contains("on") ? !h.classList.contains("desc") : k !== "nome";
        document.querySelectorAll("[data-sort]").forEach(function (o) { o.classList.remove("on", "desc"); });
        h.classList.add("on"); if (desc) h.classList.add("desc");
        var rows = Array.prototype.slice.call(mbody.children);
        rows.sort(function (a, b) {
          var r = k === "nome" ? a.getAttribute("data-nome").localeCompare(b.getAttribute("data-nome"), "pt-BR") : parseFloat(a.getAttribute("data-" + k)) - parseFloat(b.getAttribute("data-" + k));
          return desc ? -r : r;
        });
        rows.forEach(function (r) { mbody.appendChild(r); });
      });
    });
  }

  /* ---------- Contadores ---------- */
  var nf = new Intl.NumberFormat("pt-BR");
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var t0 = null, dur = 1200;
    function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var v = end * (1 - Math.pow(1 - k, 3));
      el.textContent = nf.format(Math.round(v)) + suffix;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  /* ---------- Link que abre outra aba da mesma página ---------- */
  document.querySelectorAll("[data-goto-tab]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = document.querySelector('[role=tab][data-hash="' + a.getAttribute("data-goto-tab") + '"]');
      if (!t) return;
      e.preventDefault(); t.click(); t.closest(".tabs").scrollIntoView({ block: "start" });
    });
  });

  /* ---------- Mapa do Brasil ---------- */
  document.querySelectorAll("[data-br]").forEach(function (panel) {
    var f = function (k) { return panel.querySelector('[data-b="' + k + '"]'); };
    var ufs = panel.querySelectorAll(".uf");
    function show(p) {
      ufs.forEach(function (o) { o.classList.toggle("on", o === p); });
      var mt = p.getAttribute("data-uf") === "MT";
      f("regiao").textContent = p.getAttribute("data-regiao");
      f("nome").textContent = p.getAttribute("data-nome");
      f("txt").textContent = mt ? "13 perfis municipais publicados na Região Metropolitana do Vale do Rio Cuiabá." : "Perfis municipais em preparação. Indicadores nacionais já disponíveis.";
      f("go").hidden = !mt;
    }
    var def = panel.querySelector('.uf[data-uf="MT"]');
    ufs.forEach(function (p) {
      p.addEventListener("mouseenter", function () { show(p); });
      p.addEventListener("focus", function () { show(p); });
      var go = function () { show(p); if (p.getAttribute("data-uf") === "MT") location.href = "cidades.html"; };
      p.addEventListener("click", go);
      p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    panel.querySelector(".br-map").addEventListener("mouseleave", function () { if (def) show(def); });
    if (def) show(def);
  });

  /* ---------- Busca integrada ---------- */
  var omni = document.querySelector("[data-omni]");
  if (omni) {
    var oq = omni.querySelector("[data-omni-q]");
    var ores = omni.querySelector("[data-omni-res]");
    var idx = [];
    try { idx = JSON.parse(omni.querySelector("[data-omni-index]").textContent); } catch (e) {}
    var scope = "all", sel = -1;
    var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    function run() {
      var t = norm(oq.value.trim());
      sel = -1;
      if (!t) { ores.hidden = true; ores.innerHTML = ""; return; }
      var hits = idx.filter(function (it) {
        if (scope !== "all" && it.s.indexOf(scope) !== 0) return false;
        return norm(it.t + " " + it.k + " " + it.s).indexOf(t) !== -1;
      }).sort(function (a, b) { return (norm(a.t).indexOf(t) === 0 ? 0 : 1) - (norm(b.t).indexOf(t) === 0 ? 0 : 1); }).slice(0, 8);
      ores.innerHTML = hits.length ? hits.map(function (it) {
        return '<li><a href="' + esc(it.u) + '"><strong>' + esc(it.t) + '</strong><span>' + esc(it.s) + '</span></a></li>';
      }).join("") : '<li class="none">Nada encontrado. Tente outro termo ou busque em todas as seções.</li>';
      ores.hidden = false;
    }
    oq.addEventListener("input", run);
    oq.addEventListener("focus", run);
    oq.addEventListener("keydown", function (e) {
      var links = ores.querySelectorAll("a");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!links.length) return;
        e.preventDefault();
        sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        links.forEach(function (l, i) { l.classList.toggle("on", i === sel); });
      } else if (e.key === "Enter" && links.length) {
        e.preventDefault(); location.href = links[Math.max(sel, 0)].getAttribute("href");
      } else if (e.key === "Escape") { ores.hidden = true; }
    });
    document.addEventListener("click", function (e) { if (!omni.contains(e.target)) ores.hidden = true; });
    omni.querySelectorAll("[data-scope]").forEach(function (b) {
      b.addEventListener("click", function () {
        scope = b.getAttribute("data-scope");
        omni.querySelectorAll("[data-scope]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        oq.focus(); run();
      });
    });
    document.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag)) { e.preventDefault(); oq.focus(); }
    });
    if (location.hash === "#busca") setTimeout(function () { oq.focus(); }, 50);
  }

  /* ---------- Formulário de contribuição ---------- */
  var form = document.querySelector("[data-contrib]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (el) {
        var bad = !el.value.trim() || (el.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
        el.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });
      var msg = form.querySelector("[data-contrib-msg]");
      msg.hidden = false;
      msg.textContent = ok ? "Obrigado. O envio online será ativado em breve. Até lá, a contribuição pode ser feita pelo contato do PPGAU UNIVAG." : "Preencha nome, um e-mail válido e a mensagem.";
    });
  }
})();
