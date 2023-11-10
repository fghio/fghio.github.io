function generateTableOfContents() {
  const tableOfContents = document.getElementById('table-of-contents');
  const headerLinkElements = document.querySelectorAll('.content .headerlink');

  // Initialize variables to keep track of the current section and subsection numbers.
  let sectionNumber = 0;
  let subsectionNumber = 0;

  // Function to highlight the currently read section.
  function highlightCurrentSection() {
    const scrollPosition = window.scrollY;
    const sectionItems = tableOfContents.querySelectorAll('a.is-mobile');
    sectionItems.forEach((sectionItem) => {
      const sectionId = sectionItem.getAttribute('data-href').substring(1);
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement.offsetTop <= scrollPosition) {
        sectionItems.forEach((item) => item.classList.remove('is-active'));
        sectionItem.classList.add('is-active');
      }
    });
  }

  // Listen for scroll events to update the highlighted section.
  window.addEventListener('scroll', highlightCurrentSection);

  headerLinkElements.forEach((headerLink, index) => {
    const headerLevel = headerLink.parentNode.tagName.toLowerCase();
    const anchor = document.createElement('a');
    anchor.href = `#${headerLink.parentNode.id}`;
    anchor.textContent = headerLink.parentNode.textContent;

    if (headerLevel === 'h2') {
      sectionNumber++;
      subsectionNumber = 0;

      // Create a list item for sections.
      const sectionListItem = document.createElement('li');
      sectionListItem.innerHTML = `<a class="level is-mobile" href="#${headerLink.parentNode.id}" data-href="#${headerLink.parentNode.id}" style="margin-bottom: 0px;">
        <span class="level-left">
          <span class="level-item">${sectionNumber}</span>
          <span class="level-item">${anchor.textContent}</span>
        </span>
      </a>`;
      tableOfContents.appendChild(sectionListItem);
    } else if (headerLevel === 'h3') {
      subsectionNumber++;

      // Create a list item for subsections with a numbered format.
      const subsectionListItem = document.createElement('li');
      subsectionListItem.innerHTML = `<a class="level is-mobile" href="#${headerLink.parentNode.id}" data-href="#${headerLink.parentNode.id}">
        <span class="level-left">
          <span class="level-item">${sectionNumber}.${subsectionNumber}</span>
          <span class="level-item">${anchor.textContent}</span>
        </span>
      </a>`;
      
      // Check if the last item is a subsection, if not create a new section for subsections.
      const lastItem = tableOfContents.lastElementChild;
      if (lastItem && !lastItem.querySelector('ul')) {
        lastItem.innerHTML += `<ul class="menu-list"></ul>`;
      }
      lastItem.querySelector('ul').appendChild(subsectionListItem);
    }
  });

  // Call the function initially to highlight the section when the page loads.
  highlightCurrentSection();
}

// Call the function to generate the table of contents when the page loads.
generateTableOfContents();

