/* ==========================================================================
 * search.js — ricerca nel sito (lente in alto a destra, "/" o Ctrl/Cmd+K).
 *
 * Il sito è statico, quindi l'indice viene costruito dal browser alla prima
 * apertura della ricerca: scarica le pagine elencate qui sotto, ne estrae il
 * testo e lo tiene in cache per la sessione. Nuovi post del blog (index.json),
 * nuove tesi (thesis-card.html) e nuovi capitoli dei progetti (link nelle
 * pagine dei progetti) vengono trovati automaticamente.
 *
 * Un progetto NUOVO va aggiunto a PROJECTS (stesso id usato in
 * projectArchive.html).
 * ======================================================================== */
(function () {
  "use strict";

  var INDEX_KEY = "searchIndex:v2";
  var FUSE_URL = "https://cdnjs.cloudflare.com/ajax/libs/fuse.js/7.0.0/fuse.min.js";
  var MAX_RESULTS = 12;

  var PROJECTS = [
    { id: "PF", file: "spreadsheet" },
    { id: "WEB", file: "website" },
    { id: "OF", file: "CFDcourse" },
    { id: "PJ", file: "projet" }
  ];

  /* ---------------------------------------------------------------- util */
  function clean(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.text();
    });
  }

  function parse(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, noscript").forEach(function (n) { n.remove(); });
    return doc;
  }

  function text(node) { return node ? clean(node.textContent) : ""; }

  /* ------------------------------------------------------- sorgenti indice */
  function indexHome() {
    return getText("homePane.html").then(function (html) {
      var doc = parse(html), docs = [];
      doc.querySelectorAll("h2").forEach(function (h2) {
        var body = [], n = h2.nextElementSibling;
        while (n && n.tagName !== "H2") { body.push(text(n)); n = n.nextElementSibling; }
        docs.push({
          type: "Home", title: text(h2), text: clean(body.join(" ")),
          url: "./" + (h2.id ? "#" + encodeURIComponent(h2.id) : "")
        });
      });
      return docs;
    });
  }

  function indexCurriculum() {
    return getText("curriculum.html").then(function (html) {
      var doc = parse(html), docs = [], counts = {};
      doc.querySelectorAll("[id]").forEach(function (e) { counts[e.id] = (counts[e.id] || 0) + 1; });
      var section = { title: "Curriculum", id: "" };
      doc.querySelectorAll(".content h2, .content .cv-entry, .content > h4").forEach(function (e) {
        if (e.tagName === "H2") { section = { title: text(e), id: e.id }; return; }
        var right = e.querySelector(".right-column") || e;
        var left = e.querySelector(".left-column");
        var p = right.querySelector("p");
        var title = p ? clean(p.firstChild ? p.firstChild.textContent : text(p)) : text(right);
        if (!title) title = text(right).slice(0, 80);
        var h4 = right.querySelector("h4[id]") || (e.tagName === "H4" ? e : null);
        var anchor = h4 && counts[h4.id] === 1 ? h4.id : section.id;
        docs.push({
          type: "CV", title: title, section: section.title,
          text: clean((left ? text(left) + " · " : "") + text(right)),
          url: "curriculum" + (anchor ? "#" + encodeURIComponent(anchor) : "")
        });
      });
      return docs;
    });
  }

  function indexPublications() {
    return getText("pubs.html").then(function (html) {
      var doc = parse(html);
      return Array.prototype.map.call(doc.querySelectorAll(".cv-entry"), function (e) {
        var t = text(e);
        var m = t.match(/"([^"]+)"/);
        return {
          type: "Publication", title: m ? m[1] : t.slice(0, 90), text: t,
          url: "curriculum#Publications"
        };
      });
    });
  }

  function indexTheses() {
    return getText("thesis-card.html").then(function (html) {
      var doc = parse(html);
      return Array.prototype.map.call(doc.querySelectorAll(".card[data-status]"), function (c) {
        var title = text(c.querySelector("h2"));
        var status = c.getAttribute("data-status") || "";
        return {
          type: "Thesis", title: title,
          section: status === "open" ? "Open" : status === "in-progress" ? "In progress" : status,
          tags: clean((c.getAttribute("data-tags") || "") + " " + text(c.querySelector(".tags"))),
          text: text(c.querySelector(".thesis-description")),
          url: "thesis?q=" + encodeURIComponent(title)
        };
      });
    });
  }

  function indexContact() {
    return getText("contact.html").then(function (html) {
      var doc = parse(html);
      return [{
        type: "Contact", title: "Contact & how to reach my office",
        text: text(doc.querySelector(".column-main")), url: "contact"
      }];
    });
  }

  function indexBlog() {
    return getText("posts/blog/index.json").then(function (json) {
      var files = JSON.parse(json).map(function (f) { return f.name; })
        .filter(function (n) { return /\.html$/.test(n); });
      return Promise.all(files.map(function (name) {
        var slug = name.replace(/\.html$/, "");
        return getText("posts/blog/" + name).then(function (html) {
          var doc = parse(html), meta = {};
          var art = doc.querySelector("article[data-metadata]");
          try { meta = JSON.parse(art.getAttribute("data-metadata")); } catch (e) {}
          var title = meta.title ? parse(meta.title).body.textContent : text(doc.querySelector("h1"));
          return {
            type: "Blog", title: clean(title), section: meta.creationDate || "",
            tags: (meta.tags || []).join(" "),
            text: clean((meta.description || "") + " " + text(doc.querySelector(".content") || doc.body)),
            url: "blogPost?post=" + encodeURIComponent(slug)
          };
        }).catch(function () { return null; });
      }));
    });
  }

  function indexProjects() {
    return Promise.all(PROJECTS.map(function (p) {
      return getText("posts/projects/" + p.file + ".html").then(function (html) {
        var doc = parse(html);
        var projTitle = text(doc.querySelector("h1"));
        var docs = [{
          type: "Project", title: projTitle, text: text(doc.body),
          url: "projectArchive?id=" + p.id
        }];
        var seen = {};
        var links = Array.prototype.filter.call(doc.querySelectorAll('a[href^="projectPost.html?"], a[href^="projectPost?"]'), function (a) {
          var h = a.getAttribute("href");
          if (seen[h]) return false;
          seen[h] = true;
          return true;
        });
        return Promise.all(links.map(function (a) {
          var href = a.getAttribute("href");
          var q = new URLSearchParams(href.split("?")[1]);
          var src = "posts/projects/" + q.get("project") + "Posts/" + q.get("post") + ".html";
          return getText(src).then(function (h) {
            var d = parse(h);
            return {
              type: "Project", section: projTitle,
              title: text(d.querySelector("h1")) || text(a),
              text: text(d.querySelector(".content") || d.body),
              url: href.replace("projectPost.html?", "projectPost?")
            };
          }).catch(function () { return null; }); // capitolo non ancora pubblicato
        })).then(function (sub) { return docs.concat(sub); });
      }).catch(function () { return []; });
    })).then(function (lists) { return [].concat.apply([], lists); });
  }

  var indexPromise = null;
  function buildIndex() {
    if (indexPromise) return indexPromise;
    try {
      var cached = JSON.parse(sessionStorage.getItem(INDEX_KEY));
      if (Array.isArray(cached) && cached.length) return (indexPromise = Promise.resolve(cached));
    } catch (e) {}

    var sources = [indexHome, indexCurriculum, indexPublications, indexTheses,
      indexContact, indexBlog, indexProjects];
    indexPromise = Promise.all(sources.map(function (f) {
      return f().catch(function () { return []; }); // una sorgente rotta non blocca le altre
    })).then(function (lists) {
      var docs = [].concat.apply([], lists).filter(function (d) { return d && d.title; });
      try { sessionStorage.setItem(INDEX_KEY, JSON.stringify(docs)); } catch (e) {}
      return docs;
    });
    return indexPromise;
  }

  var fusePromise = null;
  function loadFuse() {
    if (window.Fuse) return Promise.resolve(window.Fuse);
    if (fusePromise) return fusePromise;
    fusePromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = FUSE_URL;
      s.onload = function () { resolve(window.Fuse); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return fusePromise;
  }

  var fuse = null;
  function ready() {
    return Promise.all([loadFuse(), buildIndex()]).then(function (r) {
      if (!fuse) {
        fuse = new r[0](r[1], {
          keys: [
            { name: "title", weight: 3 },
            { name: "tags", weight: 1.5 },
            { name: "section", weight: 1 },
            { name: "type", weight: 1 },
            { name: "text", weight: 1 }
          ],
          includeMatches: true,
          ignoreLocation: true,
          threshold: 0.3,
          minMatchCharLength: 2
        });
      }
      return fuse;
    });
  }

  /* ---------------------------------------------------------------- UI */
  var overlay, input, list, status, results = [], active = -1, lastFocus = null;

  function buildUI() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "mx-search";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Search");
    overlay.innerHTML =
      '<div class="mx-search__panel">' +
      '  <div class="mx-search__bar">' +
      '    <i class="fas fa-search" aria-hidden="true"></i>' +
      '    <input type="search" class="mx-search__input" placeholder="Search posts, projects, theses, CV…"' +
      '           autocomplete="off" spellcheck="false" aria-label="Search">' +
      '    <button type="button" class="mx-search__close" aria-label="Close">Esc</button>' +
      '  </div>' +
      '  <div class="mx-search__status" aria-live="polite"></div>' +
      '  <ul class="mx-search__results" role="listbox"></ul>' +
      '  <div class="mx-search__hint"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>' +
      '    <span><kbd>↵</kbd> open</span><span><kbd>/</kbd> or <kbd>Ctrl K</kbd> search</span></div>' +
      '</div>';
    document.body.appendChild(overlay);

    input = overlay.querySelector(".mx-search__input");
    list = overlay.querySelector(".mx-search__results");
    status = overlay.querySelector(".mx-search__status");

    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector(".mx-search__close").addEventListener("click", close);
    input.addEventListener("input", run);
    input.addEventListener("keydown", onKey);
    list.addEventListener("mousemove", function (e) {
      var li = e.target.closest("li[data-i]");
      if (li) setActive(+li.getAttribute("data-i"));
    });
  }

  function open() {
    buildUI();
    lastFocus = document.activeElement;
    overlay.classList.add("is-open");
    document.documentElement.classList.add("mx-search-open");
    input.focus();
    input.select();
    if (!fuse) status.textContent = "Building the index…";
    ready().then(function () {
      if (status.textContent === "Building the index…") status.textContent = "";
      run();
    }).catch(function () {
      status.textContent = "Search is not available right now (network error).";
    });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.documentElement.classList.remove("mx-search-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function isOpen() { return overlay && overlay.classList.contains("is-open"); }

  function words(q) {
    return q.toLowerCase().split(/\s+/).filter(function (w) { return w.length >= 2; });
  }

  function highlight(s, ws) {
    var out = esc(s);
    ws.forEach(function (w) {
      var re = new RegExp("(" + esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  function snippet(item, matches, ws) {
    var t = item.text || "";
    var pos = -1, lower = t.toLowerCase();
    ws.some(function (w) { pos = lower.indexOf(w); return pos >= 0; });
    if (pos < 0) {
      var m = (matches || []).filter(function (m) { return m.key === "text"; })[0];
      if (m && m.indices.length) pos = m.indices[0][0];
    }
    if (pos < 0) return t.slice(0, 140) + (t.length > 140 ? "…" : "");
    var start = Math.max(0, pos - 50);
    var s = t.slice(start, start + 160);
    if (start > 0) s = "…" + s.replace(/^\S*\s/, "");
    if (start + 160 < t.length) s += "…";
    return s;
  }

  function run() {
    if (!fuse) return;
    var q = input.value.trim();
    list.innerHTML = "";
    active = -1;
    if (q.length < 2) {
      results = [];
      status.textContent = q.length ? "" : "Type at least 2 characters.";
      return;
    }
    results = fuse.search(q, { limit: MAX_RESULTS });
    status.textContent = results.length ? "" : "No results for “" + q + "”.";
    var ws = words(q);
    list.innerHTML = results.map(function (r, i) {
      var it = r.item;
      var meta = [it.type, it.section].filter(Boolean).join(" · ");
      return '<li role="option" data-i="' + i + '"><a href="' + esc(it.url) + '">' +
        '<span class="mx-search__meta">' + esc(meta) + "</span>" +
        '<span class="mx-search__title">' + highlight(it.title, ws) + "</span>" +
        '<span class="mx-search__snippet">' + highlight(snippet(it, r.matches, ws), ws) + "</span>" +
        "</a></li>";
    }).join("");
    if (results.length) setActive(0);
  }

  function setActive(i) {
    var items = list.querySelectorAll("li");
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach(function (li, k) {
      li.classList.toggle("is-active", k === active);
      li.setAttribute("aria-selected", k === active ? "true" : "false");
    });
    items[active].scrollIntoView({ block: "nearest" });
  }

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Enter") {
      var a = list.querySelector("li.is-active a");
      if (a) { e.preventDefault(); close(); location.href = a.href; }
    }
  }

  /* ----------------------------------------------------- apertura/tasti */
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".navbar-item.search");
    if (t) { e.preventDefault(); open(); }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) { e.preventDefault(); close(); return; }
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); isOpen() ? close() : open(); }
    else if (e.key === "/" && !typing && !isOpen()) { e.preventDefault(); open(); }
  });

  // Pre-costruisce l'indice quando il browser è libero, così la prima
  // ricerca è immediata.
  window.addEventListener("load", function () {
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 1500); };
    idle(function () { buildIndex(); });
  });

  /* ------------------------------------------------- ancore caricate dopo */
  // Molte sezioni (homePane, pubblicazioni) sono caricate via JS, quindi il
  // browser non trova l'#ancora quando apre la pagina. Per qualche secondo
  // controlliamo che la sezione sia in cima e, se non lo è (non ancora
  // caricata, o spostata da immagini/parti caricate dopo), ci scrolliamo.
  // Ci si ferma appena l'utente scorre da solo.
  (function () {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var tries = 0, stop = false;
    function userScrolled() { stop = true; }
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
      window.addEventListener(ev, userScrolled, { once: true, passive: true });
    });
    var t = setInterval(function () {
      if (stop || ++tries > 40) { clearInterval(t); return; }
      var el = document.getElementById(id);
      if (!el) return;
      var offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      if (Math.abs(el.getBoundingClientRect().top - offset) > 4) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }, 100);
  })();
})();
