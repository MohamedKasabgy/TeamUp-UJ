/* ── Mobile menu toggle ── */
var menuToggle = document.getElementById("menuToggle");
var mobileMenu = document.getElementById("mobileMenu");
var navButtons = document.querySelector(".nav-buttons");

if (menuToggle && mobileMenu && navButtons) {
  menuToggle.addEventListener("click", function () {
    mobileMenu.classList.toggle("active");
    navButtons.classList.toggle("active");

    var isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.textContent = isExpanded ? "☰" : "✕";
  });
}

/* ── Navbar: show user status when logged in ── */
(function updateNav() {
  var userData = localStorage.getItem("uj_filehub_user");
  if (!userData) return;

  var user;
  try {
    user = JSON.parse(userData);
  } catch (e) {
    return;
  }
  if (!user || !user.full_name) return;

  var nb = document.querySelector(".nav-buttons");
  if (!nb) return;

  // Replace Login/Sign Up with user greeting + logout
  var adminLink = user.role === "admin" ? '<a href="admin.html" class="btn btn-light" style="margin-right: 0.5rem;">Admin Dashboard</a>' : '';
  nb.innerHTML =
    adminLink +
    '<span class="btn btn-light nav-user-name" style="margin-right: 0.5rem;">👋 ' + user.full_name + '</span>' +
    '<a href="#" class="btn btn-brand" id="logoutBtn">Logout</a>';

  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("uj_filehub_user");
      window.location.assign("index.html");
    });
  }
})();