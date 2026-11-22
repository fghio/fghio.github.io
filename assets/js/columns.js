/* La colonna destra va in fondo alla sinistra sotto i 1280px.
 * Il posizionamento iniziale lo fa partials.js (subito, insieme alle parti
 * comuni); qui resta solo l'aggiornamento quando la finestra cambia misura. */
(function () {
  if (window.mxPlaceRightPane) window.mxPlaceRightPane();
  window.addEventListener("resize", function () {
    if (window.mxPlaceRightPane) window.mxPlaceRightPane();
  });
})();
