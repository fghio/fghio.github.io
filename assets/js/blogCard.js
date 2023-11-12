$(document).ready(function () {
  const blogPreview = $('#blog-preview');
  const blogPost = $('#blog-post');
  const pagination = $('#pagination');
  const postsPerPage = 4; // Number of posts to display per page
  let currentPage = 1;
  let blogCards = []; // Array to store all blog cards sorted by lastUpdated

  function loadBlogCards() {
    const repoOwner = 'fghio'; // replace with your GitHub username
    const repoName = 'fghio.github.io'; // replace with your GitHub repository name
    const path = 'posts/blog';

    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

    $.ajax({
      url: apiUrl,
      success: function (data) {
        blogCards = data
          .filter(file => file.name.endsWith('.html'))
          .map(file => file.name);

        // Sort blogCards based on lastUpdated property (most recent to oldest)
        blogCards.sort(function (a, b) {
          const postTitleA = a.replace(/\.html$/, '');
          const postTitleB = b.replace(/\.html$/, '');
          const postContentA = loadIndividualBlogPost(postTitleA);
          const postContentB = loadIndividualBlogPost(postTitleB);
          const lastUpdatedA = extractLastUpdated(postContentA);
          const lastUpdatedB = extractLastUpdated(postContentB);
          return new Date(lastUpdatedB) - new Date(lastUpdatedA);
        });

        // Load and display the first page of blog cards
        loadBlogPosts(currentPage);
      }
    });
  }

  loadBlogCards();

  function generatePaginationLinks(totalPages, currentPage) {
    let paginationHTML = '';
    paginationHTML += `<li><a class="pagination-link 
    	${currentPage === 1 ? 'is-current' : ''}" href="#" data-page="1">1</a></li>`;
    for (let i = 2; i <= totalPages; i++) {
      if (i == currentPage) {
        paginationHTML += `<li><a class="pagination-link is-current" 
        	href="#" data-page="${i}">${i}</a></li>`;
      } else {
        paginationHTML += `<li><a class="pagination-link" 
        	href="#" data-page="${i}">${i}</a></li>`;
      }
    }
    return paginationHTML;
  }

  function updatePagination(totalPages, currentPage) {

    const pagination = $('.pagination');
    const paginationList = pagination.find('.pagination-list');
    paginationList.html(generatePaginationLinks(totalPages, currentPage));

    $(`.pagination-previous`).removeClass('is-invisible');
    $(`.pagination-next`).removeClass('is-invisible');

    if (currentPage == 1) {
      $(`.pagination-previous`).addClass('is-invisible');
    } else if (currentPage == totalPages) {
      $(`.pagination-next`).addClass('is-invisible');
    } 
    
    
    $('.pagination-link').on('click', function (e) {
      e.preventDefault();
      const newPage = parseInt($(this).data('page'));
      currentPage = newPage;
      // Add the "is-current" class to the current page link
      loadBlogPosts(currentPage);
      $(`.pagination-link[data-page="${currentPage}"]`).addClass('is-current');
      $('.pagination-link').not(`[data-page="${currentPage}"]`).removeClass('is-current');
    });

    $('.pagination-previous').on('click', function (e) {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage -= 1;
        loadBlogPosts(currentPage);
        updatePagination(totalPages, currentPage);
      }
    });

    $('.pagination-next').on('click', function (e) {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage += 1;
        loadBlogPosts(currentPage);
        updatePagination(totalPages, currentPage);
      }
    });
  }

  function loadBlogPosts(page) {
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const totalPages = Math.ceil(blogCards.length / postsPerPage);

    updatePagination(totalPages, page);

    // Display blog cards for the current page
    const currentBlogCards = blogCards.slice(startIndex, endIndex);

    blogPreview.empty();

    // create the preview
    currentBlogCards.forEach((val, i) => {
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

      const postRealTitle = extractRealTitle(postContent);

      if (Array.isArray(tags)) {
        const tagLinks = tags.map(tag => 
          `<a class="link-muted" rel="tag" href="tagArticles.html?tag=${tag}">${tag}</a>`);
        tagsHTML = tagLinks.join(';&nbsp;');
      }

      const cardHTML = `
        <div class="card" id="${postTitle}-card" 
          data-post-title="${postTitle}"
          style="transition: opacity 0.3s ease-out 0s, 
          transform 0.3s ease-out 0s, box-shadow 0.3s ease-in-out 0s; 
          opacity: 1; transform-origin: center top;">
          <article class="card-content article" role="article">
            <h1 class="title is-size-3" style="font-family: 'PT Sans Narrow', sans-serif">
              <a class="has-link-black-ter" href="blogPost.html?post=${postTitle}">
                ${postRealTitle}
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
      if (blogPreview.find('.card').length > 0) {
        cardHTMLInstance = '<div style="margin-top: 20px;">' + cardHTML + '</div>';
      } else {
        cardHTMLInstance = cardHTML;
      }

      blogPreview.append(cardHTMLInstance);
    });
  }

  // Load the initial blog cards
  loadBlogPosts(currentPage);
});
