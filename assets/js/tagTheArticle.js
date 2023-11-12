$(document).ready(function () {

  function showPreview() {

    tagsPreview.empty();

    // create the preview
    blogCardsHavingThatTag.forEach((val, i) => {
      const postTitle = val.replace(/\.html$/, '');
      const postContent = loadIndividualBlogPost(postTitle);
      const postDate = extractPostDate(postContent);
      const lastUpdated = extractLastUpdated(postContent);
      
      const postDateDMY = formatDateToDDMMYYYY(postDate);
      const lastUpdatedDMY = formatDateToDDMMYYYY(lastUpdated);
      
      const readTime = extractReadTime(postContent);
      const wordCount = extractWordCount(postContent);

      let tagsHTML = '';
      const tags = extractTags(postContent);

      if (Array.isArray(tags)) {
        const tagLinks = tags.map(tag => 
          `<a class="link-muted" rel="tag" href="./tags/">${tag}</a>`);
        tagsHTML = tagLinks.join(';&nbsp;');
      }

      const cardHTML = `
        <div class="card" id="${postTitle}-card" 
          data-post-title="${postTitle}" style="opacity: 1;">
          <article class="card-content article" role="article">
            <h1 class="title is-size-3" style="font-family: 'PT Sans Narrow', sans-serif">
              <a class="has-link-black-ter" href="blogPost.html?post=${postTitle}">
                ${postTitle}
              </a>
            </h1>
            <div class="article-meta is-size-7 is-uppercase level is-mobile">
              <div class="level-left" style="margin-bottom: 0.50rem">
                <span class="level-item">
                  <i class="far fa-calendar-alt">&nbsp;</i>
                  <time datetime="${postDate}" title="${postDate}">
                    ${postDateDMY}
                  </time>
                </span>
                <span class="level-item is-hidden-mobile">
                  <i class="far fa-calendar-check">&nbsp;</i>
                  <time datetime="${lastUpdated}" title="${lastUpdated}">
                    ${lastUpdatedDMY}
                  </time>
                </span>
                <span class="level-item">
                  <i class="far fa-folder-open has-text-grey"></i>&nbsp;
                  <a class="link-muted" href="./blog">blog</a>
                </span>
                <span class="level-item">
                  <i class="far fa-clock"></i>&nbsp;Estimated read time: 
                    ${readTime} (About ${wordCount} words)
                </span>
              </div>
            </div>
            <div class="content" style="margin-top: 1.0rem">
              One of the Most Widely Used Estimation Methods
            </div>
            <hr style="height:1px;margin:1rem 0">
            <div class="level is-mobile is-flex">
              <div class="article-tags is-size-7 is-uppercase">
                <i class="fas fa-tag has-text-grey"
                  style="transform: translateY(20%);"></i>&nbsp&nbsp;
                <div>
                  ${tagsHTML}
                </div>
              </div>
              <a class="article-more button is-small is-size-7" 
                href="blogPost.html?post=${postTitle}">
                <i class="fas fa-book-reader has-text-grey"></i>&nbsp;&nbsp;Read more
              </a>
            </div>
          </article>
        </div>
      `;

      // Check if there are already cards and add margin-top if needed
      if (tagsPreview.find('.card').length > 0) {
        cardHTMLInstance = '<div style="margin-top: 20px;">' + cardHTML + '</div>';
      } else {
        cardHTMLInstance = cardHTML;
      }

      tagsPreview.append(cardHTMLInstance);
    });
  }

  function loadBlogCards() {
    $.ajax({
      url: './posts/blog/', // place where the blogCards are located
      success: function (data) {
        blogCardsHavingThatTag = [];
        $(data)
          .find('a')
          .attr('href', function (i, val) {
            if (val.match(/\.(html)$/)) {
              const postTitle = val.replace(/\.html$/, '');
              const postContent = loadIndividualBlogPost(postTitle);
              const tags = extractTags(postContent);

              if (Array.isArray(tags) && tags.includes(tagId)) {
                blogCardsHavingThatTag.push(val);
              }
            }
          });

        // Sort blogCards based on lastUpdated property (most recent to oldest)
        blogCardsHavingThatTag.sort(function (a, b) {
          const postTitleA = a.replace(/\.html$/, '');
          const postTitleB = b.replace(/\.html$/, '');
          const postContentA = loadIndividualBlogPost(postTitleA);
          const postContentB = loadIndividualBlogPost(postTitleB);
          const lastUpdatedA = extractLastUpdated(postContentA);
          const lastUpdatedB = extractLastUpdated(postContentB);
          return new Date(lastUpdatedB) - new Date(lastUpdatedA);
        });

        //console.log(blogCardsHavingThatTag);

        // Load and display the first page of blog cards
        showPreview();
      }
    });
  }

  // Retrieve the tag ID from the URL
  const tagId = getQueryParam('tag');

  // Display the tag breadcrumb
  const tagBreadcrumb = $('.breadcrumb .is-active-tag p');
  tagBreadcrumb.text(tagId);

  const tagsPreview = $('#tag-articles-preview');
  loadBlogCards();

});


