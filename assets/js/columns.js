window.onload = function () {
  const leftStorage = document.getElementById('leftStorageForRightPane');
  const rightColumn = document.querySelector('.column-right');

  function handleResize() {
    if (window.innerWidth <= 1280) {
      // Move content to left storage when the screen size is <= 1280px
      leftStorage.innerHTML = rightColumn.innerHTML;
      rightColumn.style.display = 'none';
    } else {
      // Show right column when the screen size is > 1280px
      leftStorage.innerHTML = '';
      rightColumn.style.display = 'block';
    }
  }

  // Initial setup on page load
  handleResize();

  // Check and update on window resize
  window.addEventListener('resize', handleResize);
};

