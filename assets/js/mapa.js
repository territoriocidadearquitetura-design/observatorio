(function () {
  "use strict";
  // Fonte: IBGE (estimativa 2021, Censo 2010, PIB municipal 2018) e Atlas Brasil (IDHM 2010),
  // conforme compilado na proposta de implantação do Observatório.
  var DADOS = {
    "Acorizal": { g: "core", pop: 5309, pop10: 5516, idh: 0.628, pib: 77844.62, pc: 14351.88 },
    "Chapada dos Guimarães": { g: "core", pop: 22521, pop10: 17821, idh: 0.688, pib: 742826.04, pc: 37922.51 },
    "Cuiabá": { g: "core", pop: 623614, pop10: 551098, idh: 0.785, pib: 23705265.88, pc: 39043.32 },
    "Nossa Senhora do Livramento": { g: "core", pop: 13093, pop10: 11609, idh: 0.638, pib: 292519.45, pc: 22108.64 },
    "Santo Antônio do Leverger": { g: "core", pop: 17188, pop10: 18463, idh: 0.656, pib: 495172.68, pc: 30132.88 },
    "Várzea Grande": { g: "core", pop: 290383, pop10: 252596, idh: 0.734, pib: 7984209.54, pc: 28311.90 },
    "Barão de Melgaço": { g: "ent", pop: 8165, pop10: 7591, idh: 0.600, pib: 91427.37, pc: 10677.03 },
    "Jangada": { g: "ent", pop: 8420, pop10: 7696, idh: 0.630, pib: 178961.04, pc: 21391.47 },
    "Nobres": { g: "ent", pop: 15332, pop10: 15002, idh: 0.699, pib: 571477.00, pc: 43679.82 },
    "Nova Brasilândia": { g: "ent", pop: 3656, pop10: 4587, idh: 0.651, pib: 67871.50, pc: 17278.89 },
    "Planalto da Serra": { g: "ent", pop: 2637, pop10: 2726, idh: 0.656, pib: 29746.01, pc: 25408.68 },
    "Poconé": { g: "ent", pop: 33386, pop10: 31779, idh: 0.652, pib: 539826.62, pc: 16474.20 },
    "Rosário Oeste": { g: "ent", pop: 16999, pop10: 17679, idh: 0.650, pib: 315492.51, pc: 18303.21 }
  };
  var int = new Intl.NumberFormat("pt-BR");
  var dec3 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  var mi = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  function money(v) { // v em mil R$
    if (v >= 1e6) return "R$ " + mi.format(v / 1e6) + " bi";
    if (v >= 1e3) return "R$ " + mi.format(v / 1e3) + " mi";
    return "R$ " + int.format(Math.round(v)) + " mil";
  }
  function faixa(idh) { return idh >= 0.7 ? "alto" : idh >= 0.6 ? "médio" : "baixo"; }

  var METRICAS = {
    pop: { label: "População 2021", fmt: function (v) { return int.format(v); }, note: "Estimativa populacional IBGE 2021." },
    idh: { label: "IDHM 2010", fmt: function (v) { return dec3.format(v); }, note: "Índice de Desenvolvimento Humano Municipal, Atlas Brasil 2010. Escala de 0 a 1." },
    pib: { label: "PIB 2018", fmt: money, note: "Produto Interno Bruto municipal, IBGE 2018." },
    pc: { label: "PIB per capita", fmt: function (v) { return "R$ " + int.format(Math.round(v)); }, note: "PIB per capita municipal, IBGE 2018." },
    cres: { label: "Variação 2010–21", fmt: function (v) { return (v > 0 ? "+" : "") + mi.format(v) + "%"; }, note: "Variação entre o Censo 2010 e a estimativa 2021." }
  };
  Object.keys(DADOS).forEach(function (n) { var d = DADOS[n]; d.cres = (d.pop / d.pop10 - 1) * 100; });

  var maps = Array.prototype.slice.call(document.querySelectorAll(".rm-map"));
  var insp = document.querySelector("[data-inspector]");
  var bars = document.querySelector("[data-bars]");
  var current = null;

  function fillInspector(nome) {
    if (!insp) return;
    var d = DADOS[nome];
    if (!d) return;
    insp.querySelector("[data-i=grupo]").textContent = d.g === "core" ? "Região metropolitana" : "Entorno metropolitano";
    insp.querySelector("[data-i=nome]").textContent = nome;
    insp.querySelector("[data-i=pop]").textContent = int.format(d.pop);
    insp.querySelector("[data-i=idh]").textContent = dec3.format(d.idh) + " · " + faixa(d.idh);
    insp.querySelector("[data-i=pib]").textContent = money(d.pib);
    insp.querySelector("[data-i=pc]").textContent = "R$ " + int.format(Math.round(d.pc));
  }
  function select(nome) {
    current = nome;
    maps.forEach(function (svg) {
      svg.classList.toggle("has-active", !!nome);
      svg.querySelectorAll(".mun").forEach(function (p) {
        p.classList.toggle("active", p.getAttribute("data-nome") === nome);
      });
    });
    if (bars) bars.querySelectorAll(".bar-row").forEach(function (r) {
      r.classList.toggle("active", r.getAttribute("data-nome") === nome);
    });
    if (nome) fillInspector(nome);
  }

  maps.forEach(function (svg) {
    svg.querySelectorAll(".mun").forEach(function (p) {
      var n = p.getAttribute("data-nome");
      p.addEventListener("mouseenter", function () { select(n); });
      p.addEventListener("focus", function () { select(n); });
      var nav = svg.closest("[data-navigate]");
      var go = function () {
        if (!nav) { select(n); return; }
        location.href = "municipio-" + n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".html";
      };
      p.addEventListener("click", go);
      p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    svg.addEventListener("mouseleave", function () {
      if (!svg.matches(":focus-within")) select(insp && insp.dataset.default ? insp.dataset.default : null);
    });
  });

  /* ---------- Gráfico de barras ligado ao mapa ---------- */
  function renderBars(key) {
    if (!bars) return;
    var m = METRICAS[key];
    var nomes = Object.keys(DADOS).sort(function (a, b) { return DADOS[b][key] - DADOS[a][key]; });
    var vals = nomes.map(function (n) { return DADOS[n][key]; });
    var max = Math.max.apply(null, vals.map(Math.abs));
    var min = Math.min.apply(null, vals);
    bars.innerHTML = "";
    nomes.forEach(function (n) {
      var d = DADOS[n], v = d[key];
      var w = key === "idh" ? ((v - 0.55) / (max - 0.55)) * 100 : (Math.abs(v) / max) * 100;
      var row = document.createElement("button");
      row.type = "button";
      row.className = "bar-row " + d.g + (n === current ? " active" : "");
      row.setAttribute("data-nome", n);
      row.setAttribute("aria-label", n + ": " + m.fmt(v));
      row.innerHTML = '<span class="nm"></span><span class="tr"><span class="fl" style="width:0"></span></span><span class="vl"></span>';
      row.querySelector(".nm").textContent = n;
      row.querySelector(".vl").textContent = m.fmt(v);
      if (key === "cres" && v < 0) row.querySelector(".fl").style.opacity = ".45";
      bars.appendChild(row);
      row.addEventListener("mouseenter", function () { select(n); });
      row.addEventListener("focus", function () { select(n); });
      row.addEventListener("click", function () { select(n); });
      requestAnimationFrame(function () { row.querySelector(".fl").style.width = Math.max(1.5, w) + "%"; });
    });
    var note = document.querySelector("[data-bars-note]");
    if (note) note.textContent = m.note + (key === "idh" ? " O eixo começa em 0,55 para evidenciar diferenças." : "") + (min < 0 && key === "cres" ? " Barras claras indicam redução." : "");
  }
  var seg = document.querySelector("[data-metric]");
  if (seg) {
    seg.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        seg.querySelectorAll("button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        renderBars(b.getAttribute("data-k"));
      });
    });
    renderBars("pop");
  }
  /* ---------- Perfil municipal ---------- */
  var prof = document.querySelector("[data-profile]");
  var nomes = Object.keys(DADOS);
  var totalCore = 0, totalEnt = 0;
  nomes.forEach(function (n) { if (DADOS[n].g === "core") totalCore += DADOS[n].pop; else totalEnt += DADOS[n].pop; });
  function rank(n, key) {
    var s = nomes.slice().sort(function (a, b) { return DADOS[b][key] - DADOS[a][key]; });
    return s.indexOf(n) + 1;
  }
  function renderProfile(n) {
    if (!prof || !DADOS[n]) return;
    var d = DADOS[n];
    var sel = prof.querySelector("[data-profile-select]");
    if (sel.value !== n) sel.value = n;
    var grupo = d.g === "core" ? "Região metropolitana" : "Entorno metropolitano";
    var share = d.pop / (d.g === "core" ? totalCore : totalEnt) * 100;
    prof.querySelector("[data-p=grupo]").textContent = grupo;
    prof.querySelector("[data-p=nome]").textContent = n;
    prof.querySelector("[data-p=resumo]").textContent =
      n + " tem " + int.format(d.pop) + " habitantes, " + mi.format(share) + "% da população do " +
      (d.g === "core" ? "núcleo metropolitano" : "entorno") + ". Entre 2010 e 2021, a população " +
      (d.cres >= 0 ? "cresceu " : "diminuiu ") + mi.format(Math.abs(d.cres)) + "%.";
    var stats = [
      ["População 2021", int.format(d.pop), rank(n, "pop")],
      ["População 2010", int.format(d.pop10), null],
      ["Variação 2010–21", METRICAS.cres.fmt(d.cres), rank(n, "cres")],
      ["IDHM 2010", dec3.format(d.idh) + " · " + faixa(d.idh), rank(n, "idh")],
      ["PIB 2018", money(d.pib), rank(n, "pib")],
      ["PIB per capita", "R$ " + int.format(Math.round(d.pc)), rank(n, "pc")]
    ];
    prof.querySelector("[data-p=stats]").innerHTML = stats.map(function (s) {
      return '<dl class="stat"><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>' + (s[2] ? '<span class="rank">' + s[2] + 'º de 13</span>' : '') + '</dl>';
    }).join("");
  }
  if (prof) {
    var sel = prof.querySelector("[data-profile-select]");
    ["core", "ent"].forEach(function (g) {
      var og = document.createElement("optgroup");
      og.label = g === "core" ? "Região metropolitana" : "Entorno metropolitano";
      nomes.filter(function (n) { return DADOS[n].g === g; }).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); }).forEach(function (n) {
        var o = document.createElement("option"); o.value = n; o.textContent = n; og.appendChild(o);
      });
      sel.appendChild(og);
    });
    sel.addEventListener("change", function () { select(sel.value); });
    renderProfile("Cuiabá");
  }
  var baseSelect = select;
  select = function (n) { baseSelect(n); if (n) renderProfile(n); };

  if (insp && insp.dataset.default) select(insp.dataset.default);
})();
