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
  var PREFIX = "partial:v2:";
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
  }

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
