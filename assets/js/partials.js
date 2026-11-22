/* ==========================================================================
 * partials.js — caricamento delle parti comuni (navbar, colonne, footer)
 * con cache nel browser, così passando da una pagina all'altra compaiono
 * subito invece di "lampeggiare".
 *
 * - Prima visita: la parte viene scaricata (come prima con .load()).
 * - Visite successive (stessa scheda): viene inserita subito dalla cache di
 *   sessione e in background si scarica la versione aggiornata, che verrà
 *   usata dalla pagina successiva se è cambiata.
 * - Dopo il caricamento della pagina, le parti comuni non ancora in cache
 *   vengono pre-scaricate.
 *
 * Va incluso nel <head> dopo jQuery. Le chiamate a loadPartial() vanno messe
 * subito dopo i contenitori (non dentro $(function)), così l'inserimento
 * avviene prima che la pagina venga disegnata.
 * ======================================================================== */
(function ($) {
  var PREFIX = "partial:v3:";
  var COMMON = [
    "./common/navBar.html",
    "./common/leftPane.html",
    "./common/rightPane.html",
    "./common/footer.html"
  ];

  function read(url) {
    try { return sessionStorage.getItem(PREFIX + url); } catch (e) { return null; }
  }
  function write(url, html) {
    try { sessionStorage.setItem(PREFIX + url, html); } catch (e) {}
  }
  function fetchPartial(url) {
    return $.ajax({ url: url, dataType: "html", cache: false });
  }

  // Inserisce l'HTML e poi esegue gli eventuali <script> in modo asincrono
  // (jQuery.html() li scaricherebbe in modo sincrono, bloccando la pagina).
  function render(el, html) {
    var nodes = $.parseHTML(html, document, true) || [];
    var scripts = [];
    el.textContent = "";
    nodes.forEach(function (node) {
      if (node.nodeName === "SCRIPT") scripts.push(node);
      else el.appendChild(node);
    });
    scripts.forEach(function (old) {
      var s = document.createElement("script");
      if (old.src) { s.src = old.getAttribute("src"); s.async = false; }
      else s.text = old.text;
      el.appendChild(s);
    });
    renderTags(null, false);
    placeRightPane();
  }

  // Tag del blog nella colonna destra (e nella pagina Tags). L'elenco è
  // calcolato da tags.js e tenuto in sessionStorage: se c'è, lo si disegna
  // insieme alla colonna, così compare già nel primo fotogramma.
  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function renderTags(entries, force) {
    if (!entries) {
      try { entries = JSON.parse(sessionStorage.getItem("blogTags:v1")); } catch (e) {}
    }
    if (!Array.isArray(entries) || !entries.length) return;
    var html = entries.map(function (e) {
      return '<div class="control"><a class="tags has-addons" href="./tagArticles?tag=' +
        encodeURIComponent(e[0]) + '"><span class="tag">' + esc(e[0]) +
        '</span><span class="tag is-grey-lightest">' + esc(e[1]) + "</span></a></div>";
    }).join("");
    ["tagsLocation", "tagsLocationFull"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && (force || !el.children.length)) el.innerHTML = html;
    });
  }
  window.mxRenderTags = renderTags;

  // Sotto i 1280px la colonna destra non ci sta: il suo contenuto va in fondo
  // alla colonna sinistra (#leftStorageForRightPane). Va fatto subito, insieme
  // all'inserimento delle parti comuni, non a pagina caricata: altrimenti le
  // colonne cambiano forma quando la pagina è già visibile.
  function placeRightPane() {
    var storage = document.getElementById("leftStorageForRightPane");
    var right = document.querySelector(".column-right");
    if (!storage || !right) return;
    // si copia solo il contenuto (senza il contenitore e il suo id), e solo
    // quando la colonna destra è già stata riempita
    var content = right.querySelector("#rightPaneContainer") || right;
    if (window.innerWidth <= 1280) {
      if (content.innerHTML.trim() && storage.innerHTML !== content.innerHTML) storage.innerHTML = content.innerHTML;
      right.style.display = "none";
    } else {
      storage.innerHTML = "";
      right.style.display = "";
    }
  }
  window.mxPlaceRightPane = placeRightPane;

  window.loadPartial = function (selector, url) {
    var el = document.querySelector(selector);
    if (!el) return;
    var cached = read(url);

    if (cached !== null) {
      render(el, cached);
    }

    fetchPartial(url).done(function (html) {
      if (html === cached) return;
      write(url, html);
      // Se non c'era cache, la parte va mostrata adesso; se c'era ed è
      // cambiata, la nuova versione comparirà dalla prossima pagina
      // (evita un secondo "lampo" e di rieseguire gli script della parte).
      if (cached === null) render(el, html);
    });
  };

  $(window).on("load", function () {
    COMMON.forEach(function (url) {
      if (read(url) === null) {
        fetchPartial(url).done(function (html) { write(url, html); });
      }
    });
  });
})(jQuery);
