const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const navButtons = document.querySelector(".nav-buttons");

if (menuToggle && mobileMenu && navButtons) {
  menuToggle.addEventListener("click", function () {
    mobileMenu.classList.toggle("active");
    navButtons.classList.toggle("active");

    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", !isExpanded);
    menuToggle.textContent = isExpanded ? "☰" : "✕";
  });
}

console.log("TeamUp UJ Home Page Loaded");