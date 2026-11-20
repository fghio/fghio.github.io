/* eslint-disable node/no-unsupported-features/node-builtins */
(function($, moment, ClipboardJS, config) {
    $('.article img:not(".not-gallery-item")').each(function() {
        // wrap images with link and add caption if possible
        if ($(this).parent('a').length === 0) {
            $(this).wrap('<a class="gallery-item" href="' + $(this).attr('src') + '"></a>');
            if (this.alt) {
                $(this).after('<p class="has-text-centered is-size-6 caption">' + this.alt + '</p>');
            }
        }
    });

    if (typeof $.fn.lightGallery === 'function') {
        $('.article').lightGallery({ selector: '.gallery-item' });
    }
    if (typeof $.fn.justifiedGallery === 'function') {
        if ($('.justified-gallery > p > .gallery-item').length) {
            $('.justified-gallery > p > .gallery-item').unwrap();
        }
        $('.justified-gallery').justifiedGallery(
            {
                rowHeight: 240
            }
        );
    }

    // if (typeof moment === 'function') {
    //     $('.article-meta time').each(function() {
    //         $(this).text(moment($(this).attr('datetime')).fromNow());
    //     });
    // }

    $('.article > .content > table').each(function() {
        if ($(this).width() > $(this).parent().width()) {
            $(this).wrap('<div class="table-overflow"></div>');
        }
    });

    function adjustNavbar() {
        const navbarWidth = $('.navbar-main .navbar-start').outerWidth() + $('.navbar-main .navbar-end').outerWidth();
        if ($(document).outerWidth() < navbarWidth) {
            $('.navbar-main .navbar-menu').addClass('justify-content-start');
        } else {
            $('.navbar-main .navbar-menu').removeClass('justify-content-start');
        }
    }
    adjustNavbar();
    $(window).resize(adjustNavbar);

    function toggleFold(codeBlock, isFolded) {
        const $toggle = $(codeBlock).find('.fold i');
        !isFolded ? $(codeBlock).removeClass('folded') : $(codeBlock).addClass('folded');
        !isFolded ? $toggle.removeClass('fa-angle-right') : $toggle.removeClass('fa-angle-down');
        !isFolded ? $toggle.addClass('fa-angle-down') : $toggle.addClass('fa-angle-right');
    }

    function createFoldButton(fold) {
        return '<span class="fold">' + (fold === 'unfolded' ? '<i class="fas fa-angle-down"></i>' : '<i class="fas fa-angle-right"></i>') + '</span>';
    }

    $('figure.highlight table').wrap('<div class="highlight-body">');
    if (typeof config !== 'undefined'
        && typeof config.article !== 'undefined'
        && typeof config.article.highlight !== 'undefined') {

        $('figure.highlight').addClass('hljs');
        $('figure.highlight .code .line span').each(function() {
            const classes = $(this).attr('class').split(/\s+/);
            if (classes.length === 1) {
                $(this).addClass('hljs-' + classes[0]);
                $(this).removeClass(classes[0]);
            }
        });


        const clipboard = config.article.highlight.clipboard;
        const fold = config.article.highlight.fold.trim();

        $('figure.highlight').each(function() {
            if ($(this).find('figcaption').length) {
                $(this).find('figcaption').addClass('level is-mobile');
                $(this).find('figcaption').append('<div class="level-left">');
                $(this).find('figcaption').append('<div class="level-right">');
                $(this).find('figcaption div.level-left').append($(this).find('figcaption').find('span'));
                $(this).find('figcaption div.level-right').append($(this).find('figcaption').find('a'));
            } else {
                if (clipboard || fold) {
                    $(this).prepend('<figcaption class="level is-mobile"><div class="level-left"></div><div class="level-right"></div></figcaption>');
                }
            }
        });

        if (typeof ClipboardJS !== 'undefined' && clipboard) {
            $('figure.highlight').each(function() {
                const id = 'code-' + Date.now() + (Math.random() * 1000 | 0);
                const button = '<a href="javascript:;" class="copy" title="Copy" data-clipboard-target="#' + id + ' .code"><i class="fas fa-copy"></i></a>';
                $(this).attr('id', id);
                $(this).find('figcaption div.level-right').append(button);
            });
            new ClipboardJS('.highlight .copy'); // eslint-disable-line no-new
        }

        if (fold) {
            $('figure.highlight').each(function() {
                if ($(this).find('figcaption').find('span').length > 0) {
                    const span = $(this).find('figcaption').find('span');
                    if (span[0].innerText.indexOf('>folded') > -1) {
                        span[0].innerText = span[0].innerText.replace('>folded', '');
                        $(this).find('figcaption div.level-left').prepend(createFoldButton('folded'));
                        toggleFold(this, true);
                        return;
                    }
                }
                $(this).find('figcaption div.level-left').prepend(createFoldButton(fold));
                toggleFold(this, fold === 'folded');
            });

            $('figure.highlight figcaption .fold').click(function() {
                const $code = $(this).closest('figure.highlight');
                toggleFold($code.eq(0), !$code.hasClass('folded'));
            });
        }
    }

    const $toc = $('#toc');
    if ($toc.length > 0) {
        $toc.addClass('column-left is-sticky');
        const $mask = $('<div>');
        $mask.attr('id', 'toc-mask');

        $('body').append($mask);

        function toggleToc() { // eslint-disable-line no-inner-declarations
            $toc.toggleClass('is-active');
            $mask.toggleClass('is-active');
        }

        $toc.on('click', toggleToc);
        $mask.on('click', toggleToc);
        $('.navbar-main .catalogue').on('click', toggleToc);
    }
}(jQuery, window.moment, window.ClipboardJS, window.IcarusThemeSettings));





  
/* ---------------------------------------------------------------------------
 * Banner rotation for leftPane.html
 * ------------------------------------------------------------------------- */
// --- Banner rotation for leftPane.html ---
(function waitForBanner() {
  const imgEl = document.getElementById("banner-image");
  const linkEl = document.getElementById("banner-link");

  if (!imgEl || !linkEl) {
    // Retry every 200 ms until the left pane is loaded
    setTimeout(waitForBanner, 200);
    return;
  }

  const banners = [
    {
      img: "assets/images/viwoods.webp",
      link: "https://viwoods.com/?ref=FEDERICOGHIOLDI",
      title: "Recommended e-ink tablet",
      alt: "Recommended e-ink tablet"
    },
    {
      img: "assets/images/CinqueXMillePoliMi.webp",
      link: "https://www.polimi.it/",
      title: "Dona il tuo 5xMille al PoliMi",
      alt: "Dona il tuo 5xMille al PoliMi"
    }
  ];

  let current = 0;
  const fadeDuration = 850;
  const switchInterval = 6000;

  setInterval(() => {
    current = (current + 1) % banners.length;
    const b = banners[current];
    imgEl.style.opacity = 0;
    setTimeout(() => {
      imgEl.src = b.img;
      imgEl.title = b.title;
      imgEl.alt = b.alt;
      linkEl.href = b.link;
      imgEl.style.opacity = 1;
    }, fadeDuration);
  }, switchInterval);
})();



/* ---------------------------------------------------------------------------
 * Popup "Hire me" (bottone nella colonna sinistra, inserita via JS: per questo
 * il click è gestito a livello di documento)
 * ------------------------------------------------------------------------- */
(function () {
  var EMAIL = "federico.ghioldi@polimi.it";
  var modal = null, lastFocus = null;

  function build() {
    modal = document.createElement("div");
    modal.className = "mx-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "hire-title");
    modal.innerHTML =
      '<div class="mx-modal__panel">' +
      '  <div class="mx-modal__icon"><i class="fas fa-handshake" aria-hidden="true"></i></div>' +
      '  <h2 class="mx-modal__title" id="hire-title">Let\'s collaborate</h2>' +
      '  <p class="mx-modal__text">As long as I have a contract with Politecnico, ' +
      '  we can only collaborate. Send me an email!</p>' +
      '  <div class="mx-modal__actions">' +
      '    <a class="button is-primary mx-modal__email" href="mailto:' + EMAIL +
      '?subject=%5BFGH.IO%5D%20-%20Collaboration">' +
      '      <i class="fas fa-envelope"></i>&nbsp;&nbsp;Send me an email</a>' +
      '    <button type="button" class="button mx-modal__close">Close</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener("mousedown", function (e) { if (e.target === modal) close(); });
    modal.querySelector(".mx-modal__close").addEventListener("click", close);
  }

  function open() {
    if (!modal) build();
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.querySelector(".mx-modal__email").focus();
  }

  function close() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest(".hire-me")) { e.preventDefault(); open(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();
