function getQueryParam(parameter) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(parameter);
}

function extractPostDate(postContent) {
  const articleElement = $(postContent).find('article');
  const metadata = JSON.parse(articleElement.attr('data-metadata'));
  const creationDate = metadata.creationDate;
  return creationDate;
}

function extractLastUpdated(postContent) {
  const articleElement = $(postContent).find('article');
  const metadata = JSON.parse(articleElement.attr('data-metadata'));
  const lastModificationDate = metadata.lastModificationDate;
  return lastModificationDate;
}

function extractReadTime(postContent) {
  const articleElement = $(postContent).find('article');
  const metadata = JSON.parse(articleElement.attr('data-metadata'));
  const readTime = metadata.readTime;
  return readTime;
}

function extractWordCount(postContent) {
  const articleElement = $(postContent).find('article');
  const metadata = JSON.parse(articleElement.attr('data-metadata'));
  const wordCount = metadata.wordCount;
  return wordCount;
}

function extractTags(postContent) {
  const articleElement = $(postContent).find('article');
  const metadata = JSON.parse(articleElement.attr('data-metadata'));
  const tags = metadata.tags;
  return tags;
}

// Function to load individual blog post content
function loadIndividualBlogPost(postTitle) {
  return $.ajax({
    url: `./_posts/${postTitle}.html`,
    async: false, // Ensure synchronous execution for sorting
  }).responseText;
}


function formatDateToDDMMYYYY(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}


