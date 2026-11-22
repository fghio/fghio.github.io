/* ==========================================================================
 * pflock.js — progetto "Personal Finance Spreadsheet" protetto da password.
 *
 * Le pagine e le immagini del progetto sono pubblicate solo cifrate
 * (AES-256-GCM, file .enc generati da tools/pf_encrypt.py). Qui il browser
 * ricava la chiave dalla password (PBKDF2-SHA256), la verifica, la tiene in
 * sessionStorage per la durata della scheda e decifra pagine e immagini.
 *
 * Uso:  PFLock.mount(elemento, "./posts/projects/spreadsheet.enc")
 * ======================================================================== */
(function () {
  var META_URL = "./assets/data/pf-lock.json";
  var KEY_STORE = "pf:key:v1";
  var IMG_ATTR = /\b(src|href)=(["'])([^"']*images\/spreadsheet\/[^"']+)\2/g;
  var cryptoKey = null;
  var blobs = {};

  function b64ToBytes(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function bytesToB64(buf) {
    var b = new Uint8Array(buf), s = "";
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function getBytes(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
      return r.arrayBuffer();
    });
  }
  function decrypt(key, data) {
    var b = new Uint8Array(data);
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, key, b.slice(12));
  }
  function importRaw(raw) {
    return crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["decrypt"]);
  }

  // chiave salvata in questa scheda (null se manca o non è più valida)
  function storedKey() {
    if (cryptoKey) return Promise.resolve(cryptoKey);
    var raw = null;
    try { raw = sessionStorage.getItem(KEY_STORE); } catch (e) {}
    if (!raw) return Promise.resolve(null);
    return importRaw(b64ToBytes(raw)).then(function (k) { return (cryptoKey = k); },
                                           function () { return null; });
  }

  function unlock(password) {
    return fetch(META_URL, { cache: "no-cache" }).then(function (r) { return r.json(); })
      .then(function (meta) {
        return crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"])
          .then(function (base) {
            return crypto.subtle.deriveKey(
              { name: "PBKDF2", hash: "SHA-256", salt: b64ToBytes(meta.salt), iterations: meta.iterations },
              base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
          })
          .then(function (key) {
            // password sbagliata -> la verifica non si decifra (eccezione)
            return decrypt(key, b64ToBytes(meta.check).buffer).then(function () { return key; });
          });
      })
      .then(function (key) {
        cryptoKey = key;
        return crypto.subtle.exportKey("raw", key).then(function (raw) {
          try { sessionStorage.setItem(KEY_STORE, bytesToB64(raw)); } catch (e) {}
          return key;
        });
      });
  }

  function forget() {
    cryptoKey = null;
    try {
      sessionStorage.removeItem(KEY_STORE);
      sessionStorage.removeItem("searchIndex:pf:v1");  // indice della ricerca decifrato
    } catch (e) {}
  }

  function imageUrl(key, path) {
    if (!blobs[path]) {
      var type = /\.png$/i.test(path) ? "image/png" : /\.jpe?g$/i.test(path) ? "image/jpeg" : "image/webp";
      blobs[path] = getBytes(path + ".enc")
        .then(function (data) { return decrypt(key, data); })
        .then(function (plain) { return URL.createObjectURL(new Blob([plain], { type: type })); });
    }
    return blobs[path];
  }

  function show(el, key, url) {
    return getBytes(url).then(function (data) { return decrypt(key, data); })
      .then(function (plain) {
        // le immagini non vanno richieste in chiaro: prima si spostano i link
        // in data-pf-*, poi si sostituiscono con le versioni decifrate
        var html = new TextDecoder().decode(plain).replace(IMG_ATTR, "data-pf-$1=$2$3$2");
        $(el).html(html);  // come prima: eventuali <script> dei post vengono eseguiti
        $(el).find("[data-pf-src], [data-pf-href]").each(function () {
          var node = this;
          ["src", "href"].forEach(function (attr) {
            var path = node.getAttribute("data-pf-" + attr);
            if (!path) return;
            imageUrl(key, path).then(function (u) { node.setAttribute(attr, u); });
          });
        });
      });
  }

  function form(el, url) {
    // dentro una card già esistente (projectArchive) non serve un'altra cornice
    var inCard = !!(el.closest && el.closest(".card"));
    el.innerHTML =
      (inCard ? '<div><div class="pf-lock">' : '<div class="card"><div class="card-content pf-lock">') +
      '<div class="pf-lock-icon"><i class="fas fa-lock"></i></div>' +
      '<h1 class="title is-size-4">Personal Finance Spreadsheet</h1>' +
      // come negli altri progetti: la cartella "projects" per tornare all'elenco
      '<div class="article-meta is-size-7 is-uppercase pf-lock-meta">' +
      '<i class="far fa-folder-open has-text-grey"></i>&nbsp; ' +
      '<a class="link-muted" href="./projects">projects</a></div>' +
      '<p>This project is password protected.</p>' +
      '<form class="pf-lock-form" autocomplete="off">' +
      '<input class="input" type="password" name="pw" placeholder="Password" aria-label="Password" required>' +
      '<button class="button is-primary" type="submit">Unlock</button>' +
      '</form><p class="pf-lock-error" role="alert"></p>' +
      '<p class="pf-lock-help">Need access? <a href="./contact">Get in touch</a>.</p>' +
      '</div></div>';
    var f = el.querySelector("form"), input = f.querySelector("input"),
        btn = f.querySelector("button"), err = el.querySelector(".pf-lock-error");
    input.focus();
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.textContent = "";
      btn.classList.add("is-loading");
      unlock(input.value)
        .then(function (key) { return show(el, key, url); })
        .catch(function () {
          btn.classList.remove("is-loading");
          err.textContent = "Wrong password.";
          input.select();
        });
    });
  }

  window.PFLock = {
    mount: function (el, url) {
      if (!el) return;
      if (!window.crypto || !crypto.subtle) {
        el.innerHTML = "<p>This project needs a recent browser over HTTPS.</p>";
        return;
      }
      storedKey().then(function (key) {
        if (!key) return form(el, url);
        return show(el, key, url).catch(function () { forget(); form(el, url); });
      });
    },
    forget: forget,
    // testo decifrato di un file .enc, oppure null se in questa scheda la
    // password non è ancora stata inserita (usato dalla ricerca)
    decryptText: function (url) {
      return storedKey().then(function (key) {
        if (!key) return null;
        return getBytes(url).then(function (data) { return decrypt(key, data); })
          .then(function (plain) { return new TextDecoder().decode(plain); });
      });
    }
  };
})();
