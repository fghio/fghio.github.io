  function showSlides(slideshowId, n) {
    const slideshow = document.getElementById(slideshowId);
    if (!slideshow) {
      console.error(`Slideshow with id '${slideshowId}' not found.`);
      return;
    }

    let i;
    const slides = slideshow.getElementsByClassName("mySlides");
    let slideIndex = parseInt(slideshow.getAttribute("data-slide-index"));

    if (isNaN(slideIndex)) {
      slideIndex = 1;
    }

    slideIndex += n;

    if (slideIndex > slides.length) {
      slideIndex = 1;
    }

    if (slideIndex < 1) {
      slideIndex = slides.length;
    }

    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }

    slides[slideIndex - 1].style.display = "block";
    slideshow.setAttribute("data-slide-index", slideIndex);
  }

  // Initialize the slideshows
  showSlides('slideshow1', 0);
  showSlides('slideshow2', 0);
  showSlides('slideshow3', 0);
  showSlides('slideshow4', 0);
