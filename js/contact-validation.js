const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contact-message");

if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (contactMessage) contactMessage.textContent = "Sending message...";
    if (contactMessage) contactMessage.style.color = "#51cf66";

    const fd = new FormData(contactForm);
    const body = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("http://localhost:3000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        if (contactMessage) {
          contactMessage.textContent = "Message sent successfully!";
          contactMessage.style.color = "#51cf66";
        }
        contactForm.reset();
      } else {
        if (contactMessage) {
          contactMessage.textContent = data.message || "Failed to send message.";
          contactMessage.style.color = "#ff6b6b";
        }
      }
    } catch {
      if (contactMessage) {
        contactMessage.textContent = "Could not connect to the server.";
        contactMessage.style.color = "#ff6b6b";
      }
    }
  });
}
