/* ==========================================================================
 * router.js — passando da una pagina all'altra si sostituisce solo la colonna
 * centrale: navbar, colonne laterali e footer restano quelli già disegnati.
 *
 * - Ogni pagina resta un file a sé (link diretti, preferiti, Google e
 *   browser senza JavaScript funzionano come prima).
 * - Un clic su un link interno verso una pagina "gestita" scarica quella
 *   pagina, ne prende la colonna centrale e il titolo e li mette al posto di
 *   quelli attuali; l'indirizzo viene aggiornato (Indietro/Avanti funzionano).
 * - Gli script propri della pagina (quelli non comuni a tutte) vengono
 *   eseguiti di nuovo, come se la pagina fosse stata aperta.
 * - Per qualsiasi problema si ripiega sul caricamento normale della pagina.
 *
 * Pagine gestite: vedi PAGES (si allarga un passo alla volta).
 * ======================================================================== */
(function () {
  if (!window.fetch || !window.DOMParser || !history.pushState) return;

  var PAGES = { "/": 1, "/curriculum": 1, "/projects": 1, "/theses": 1, "/contact": 1 };

  // script comuni a tutte le pagine: già caricati, non vanno rieseguiti
  var COMMON = /(^|\/)(jquery[^\/]*|partials|columns|back-to-top|script|main|search|pflock|router|cookieconsent(\.min)?)\.js$/;

  function key(path) {
    path = path.replace(/\.html$/, "").replace(/\/index$/, "/");
    return path || "/";
  }
  function managed(loc) {
    return loc.origin === location.origin && PAGES[key(loc.pathname)] === 1;
  }

  // pagine già scaricate (anche in anticipo, al passaggio del mouse)
  var cache = {};
  function get(url) {
    var k = url.pathname + url.search;
    if (!cache[k]) {
      cache[k] = fetch(k, { credentials: "same-origin" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .catch(function (e) { delete cache[k]; throw e; });
    }
    return cache[k];
  }

  // esegue gli script uno dopo l'altro, nell'ordine (quelli esterni vengono
  // attesi prima di passare al successivo)
  function run(list) {
    return list.reduce(function (p, old) {
      return p.then(function () {
        return new Promise(function (done) {
          var s = document.createElement("script");
          for (var i = 0; i < old.attributes.length; i++) {
            var a = old.attributes[i];
            if (a.name !== "defer" && a.name !== "async") s.setAttribute(a.name, a.value);
          }
          if (old.src) {
            s.async = false;
            s.onload = s.onerror = function () { done(); };
          } else {
            s.text = old.text;
          }
          // script della colonna centrale: al suo posto; script della pagina:
          // in fondo al body (quelli del documento scaricato non sono nella pagina)
          if (old.ownerDocument === document && old.isConnected) old.parentNode.replaceChild(s, old);
          else document.body.appendChild(s);
          if (!old.src) done();
        });
      });
    }, Promise.resolve());
  }

  function pageScripts(doc, main) {
    return Array.prototype.filter.call(doc.body.querySelectorAll("script"), function (s) {
      if (main.contains(s)) return false;              // già nella colonna centrale
      if (s.id === "mx-partials") return false;         // parti comuni
      var src = s.getAttribute("src");
      if (src) return !COMMON.test(src.split("?")[0]);
      return s.text.indexOf("cookieconsent") === -1;    // banner cookie: una volta sola
    });
  }

  // torna alla posizione y; con Indietro il contenuto (es. le card delle tesi)
  // può arrivare dopo: si riprova finché la pagina è abbastanza lunga, per
  // al massimo 2 s e solo se nel frattempo non si è scrollato a mano
  var scrollTimer = 0;
  function scrollBack(y) {
    clearInterval(scrollTimer);
    window.scrollTo(0, y);
    if (!y) return;
    var t0 = Date.now(), last = window.scrollY;
    scrollTimer = setInterval(function () {
      if (Math.abs(window.scrollY - last) > 2 || Date.now() - t0 > 2000) return clearInterval(scrollTimer);
      window.scrollTo(0, y);
      last = window.scrollY;
      if (Math.abs(last - y) <= 1) clearInterval(scrollTimer);
    }, 50);
  }

  var busy = 0;
  var shown = location.pathname + location.search;      // pagina ora mostrata
  function navigate(url, push, y) {
    var ticket = ++busy;
    return get(url).then(function (html) {
      if (ticket !== busy) return;                      // nel frattempo un altro clic
      var doc = new DOMParser().parseFromString(html, "text/html");
      var fresh = doc.querySelector(".column-main");
      var main = document.querySelector(".column-main");
      if (!fresh || !main) throw new Error("no main");

      if (push) {
        history.replaceState({ mx: 1, y: window.scrollY }, "");
        history.pushState({ mx: 1, y: 0 }, "", url.href);
      }
      document.title = doc.title;
      shown = url.pathname + url.search;

      var node = document.importNode(fresh, true);
      var inner = Array.prototype.slice.call(node.querySelectorAll("script"));
      main.parentNode.replaceChild(node, main);

      // menu mobile aperto: si chiude
      document.querySelectorAll(".navbar-burger.is-active, .navbar-menu.is-active")
        .forEach(function (el) { el.classList.remove("is-active"); });

      var target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) target.scrollIntoView();
      else scrollBack(y || 0);

      return run(inner.concat(pageScripts(doc, fresh))).then(function () {
        document.dispatchEvent(new CustomEvent("mx:navigate", { detail: { url: url.href } }));
      });
    }).catch(function () {
      if (ticket === busy) location.href = url.href;    // ripiego: pagina normale
    });
  }

  function linkTarget(e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return null;
    if (a.target && a.target !== "_self") return null;
    if (a.hasAttribute("download")) return null;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(javascript|mailto|tel):/i.test(href)) return null;
    var url = new URL(a.href, location.href);
    if (!managed(url) || !managed(location)) return null;
    // stesso indirizzo con #sezione: lo gestisce il browser
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return null;
    return url;
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = linkTarget(e);
    if (!url) return;
    e.preventDefault();
    if (url.href === location.href) { window.scrollTo(0, 0); return; }
    navigate(url, true);
  });

  // scarica in anticipo la pagina sotto il mouse/dito
  function prefetch(e) {
    var url = linkTarget(e);
    if (url) get(url).catch(function () {});
  }
  document.addEventListener("mouseover", prefetch, { passive: true });
  document.addEventListener("touchstart", prefetch, { passive: true });

  window.addEventListener("popstate", function (e) {
    if (!managed(location)) { location.reload(); return; }
    // solo il #sezione è cambiato: niente da ricaricare
    if (location.pathname + location.search === shown) return;
    var st = e.state || {};
    navigate(new URL(location.href), false, st.y || 0);
  });

  if (managed(location)) {
    history.scrollRestoration = "manual";
    history.replaceState({ mx: 1, y: window.scrollY }, "");
  }
})();
