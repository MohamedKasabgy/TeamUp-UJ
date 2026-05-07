const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signup-message");

if (signupForm) {
  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(signupForm);
    const data = Object.fromEntries(formData.entries());

    signupMessage.textContent = "Creating account...";
    signupMessage.style.color = "#51cf66";

    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("uj_filehub_user", JSON.stringify(result.user));
        signupMessage.textContent = "Account created! Logging you in...";
        signupMessage.style.color = "#51cf66";
        signupForm.reset();
        setTimeout(function () {
          window.location.assign("index.html");
        }, 1000);
      } else {
        signupMessage.textContent = result.message || "Account creation failed.";
        signupMessage.style.color = "#ff6b6b";
      }
    } catch (error) {
      signupMessage.textContent = "Could not connect to the server.";
      signupMessage.style.color = "#ff6b6b";
    }
  });
}