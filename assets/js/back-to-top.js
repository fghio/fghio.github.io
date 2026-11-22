window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  const button = document.getElementById("back-to-top");
  const footer = document.querySelector("footer.footer");

  // Check if the minimum screen width is 1088px
  if (window.innerWidth >= 1088) {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      button.style.display = "block";
      button.style.opacity = "1";

      // Calculate the distance between the button and the footer
      const buttonBottom = button.getBoundingClientRect().bottom;
      const footerTop = footer.getBoundingClientRect().top;
      const distanceToFooter = footerTop - buttonBottom;

      if (distanceToFooter < 20) {
        // Apply circular style when close to the footer
        button.classList.add("is-rounded");
      } else {
        // Remove circular style
        button.classList.remove("is-rounded");
      }
    } else {
      button.style.opacity = "0";
      button.style.bottom = "35px"; // Hide button with a smooth slide-down animation
      button.style.display = "none"; // Hide the button after animation
      button.classList.remove("is-rounded"); // Remove circular style when hidden
    }
  } else {
    // Hide the button when the screen width is less than 1088px
    button.style.opacity = "0";
    button.style.display = "none";
  }
}

document.getElementById("back-to-top").addEventListener("click", function () {
  scrollToTop();
});

function scrollToTop() {
  // Scorrimento nativo: una sola animazione, veloce anche su pagine lunghe.
  // (Il vecchio passo-passo con setInterval si sommava a "scroll-behavior:
  // smooth" del CSS e risultava lentissimo.)
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}
