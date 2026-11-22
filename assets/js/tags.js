$(document).ready(function () {

  let blogCards = [];
  let blogCardsListHavingTag = [];
  const tagsMap = new Map(); // Use a Map to store tags and their counts

  function loadBlogCards() {
    // list of blog posts: add every new post to posts/blog/index.json
    const apiUrl = 'posts/blog/index.json';

    return new Promise((resolve, reject) => {
      $.ajax({
        url: apiUrl,
        dataType: 'json',
        success: function (data) {
          blogCards = data
            .filter(file => file.name.endsWith('.html'))
            .map(file => file.name);

          resolve();
        },
        error: function () {
          reject();
        }
      });
    });
  }

  function extractTags(postContent) {
    const articleElement = $(postContent).find('article');
    const metadata = JSON.parse(articleElement.attr('data-metadata'));
    const tags = metadata.tags;
    return tags;
  }

  async function loadTags() {
    for (const card of blogCards) {
      const postTitle = card.replace(/\.html$/, '');
      const url = `https://fghio.github.io/posts/blog/${postTitle}.html`;

      try {
        const postContent = await $.ajax({ url });
        const tags = extractTags(postContent);

        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            if (tagsMap.has(tag)) {
              tagsMap.set(tag, tagsMap.get(tag) + 1);
            } else {
              tagsMap.set(tag, 1);
            }
          });
        }
      } catch (error) {
        console.log('Error fetching tags:', error);
      }
    }

    // Generate tags widget
    generateTagsWidget();
  }

  // Il widget è disegnato da mxRenderTags (partials.js), che lo riempie anche
  // subito dalla cache quando la colonna destra viene inserita: qui va
  // ridisegnato solo se i tag sono stati appena calcolati.
  function generateTagsWidget() {
    if (window.mxRenderTags) window.mxRenderTags([...tagsMap], true);
  }

  // I tag vengono calcolati scaricando tutti gli articoli: il risultato viene
  // tenuto in cache per la sessione, così cambiando pagina compaiono subito.
  const CACHE_KEY = 'blogTags:v1';
  let cachedTags = null;
  try { cachedTags = JSON.parse(sessionStorage.getItem(CACHE_KEY)); } catch (e) {}

  if (Array.isArray(cachedTags)) {
    // già disegnati da partials.js; serve solo se il contenitore è vuoto
    if (window.mxRenderTags) window.mxRenderTags(cachedTags, false);
  } else {
    loadBlogCards()
      .then(() => loadTags())
      .then(() => {
        if (tagsMap.size === 0) return; // non salvare un risultato vuoto (es. rete assente)
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify([...tagsMap])); } catch (e) {}
        if (window.mxPlaceRightPane) window.mxPlaceRightPane();
      })
      .catch(() => {});
  }

});

