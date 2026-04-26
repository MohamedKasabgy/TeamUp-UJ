const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("login-message");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    loginMessage.textContent = "Logging in...";
    loginMessage.style.color = "#51cf66";

    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("uj_filehub_user", JSON.stringify(result.user));
        loginMessage.textContent = "Login successful! Redirecting...";
        loginMessage.style.color = "#51cf66";
        setTimeout(function () {
          window.location.assign("file-library.html");
        }, 800);
      } else {
        loginMessage.textContent = result.message || "Login failed.";
        loginMessage.style.color = "#ff6b6b";
      }
    } catch (error) {
      loginMessage.textContent = "Could not connect to the server.";
      loginMessage.style.color = "#ff6b6b";
    }
  });
}