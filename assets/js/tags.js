$(document).ready(function () {

  let blogCards = [];
  let blogCardsListHavingTag = [];
  const tagsMap = new Map(); // Use a Map to store tags and their counts

  function loadBlogCards() {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: 'https://fghio.github.io/posts/blog/',
        success: function (data) {
          blogCards = [];
          $(data)
            .find('a')
            .attr('href', function (i, val) {
              if (val.match(/\.(html)$/)) {
                blogCards.push(val);
              }
            });
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
      //console.log(tagId);
      displayBlogCardsByTag(tagId);
    });

  }
  
  function displayBlogCardsByTag(tagId) {
    // Redirect to the new page with the tag as a URL parameter
    window.location.href = `./tagArticles.html?tag=${tagId}`;
  }

  // Call the functions
  loadBlogCards().then(() => loadTags());

});

