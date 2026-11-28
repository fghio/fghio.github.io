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

  // Function to generate the tags widget HTML
  function generateTagsWidget() {

    // Target the location by ID
    const tagsLocation = $('#tagsLocation').add('#tagsLocationFull');

    // Loop through the tags and counts, and add them to the widget
    tagsMap.forEach((count, tag) => {
      const tagElement = $(`
        <div class="control">
          <a class="tags has-addons" id=${tag}>
            <span class="tag">${tag}</span>
            <span class="tag is-grey-lightest">${count}</span>
          </a>
        </div>
     `);
      tagsLocation.append(tagElement);
    });
    
    // Add click event handler to tag links
    $('.control .tags').on('click', function () {
      const tagId = $(this).attr('id'); // Get the id attribute
      displayBlogCardsByTag(tagId);
    });

  }
  
  function displayBlogCardsByTag(tagId) {
    // Redirect to the new page with the tag as a URL parameter
    window.location.href = `./tagArticles?tag=${tagId}`;
  }

  // I tag vengono calcolati scaricando tutti gli articoli: il risultato viene
  // tenuto in cache per la sessione, così cambiando pagina compaiono subito.
  // pagina Tags aperta senza ricaricare (router.js): l'elenco completo va
  // riempito qui, la colonna destra è già a posto
  document.addEventListener('mx:navigate', function () {
    const full = $('#tagsLocationFull');
    if (!full.length || full.children('.control').length || tagsMap.size === 0) return;
    tagsMap.forEach((count, tag) => {
      full.append(`
        <div class="control">
          <a class="tags has-addons" id=${tag}>
            <span class="tag">${tag}</span>
            <span class="tag is-grey-lightest">${count}</span>
          </a>
        </div>`);
    });
    full.find('.control .tags').on('click', function () {
      displayBlogCardsByTag($(this).attr('id'));
    });
  });

  const CACHE_KEY = 'blogTags:v1';
  let cachedTags = null;
  try { cachedTags = JSON.parse(sessionStorage.getItem(CACHE_KEY)); } catch (e) {}

  if (Array.isArray(cachedTags)) {
    cachedTags.forEach(([tag, count]) => tagsMap.set(tag, count));
    generateTagsWidget();
  } else {
    loadBlogCards()
      .then(() => loadTags())
      .then(() => {
        if (tagsMap.size === 0) return; // non salvare un risultato vuoto (es. rete assente)
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify([...tagsMap])); } catch (e) {}
      })
      .catch(() => {});
  }

});

