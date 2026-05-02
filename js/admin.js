const API = "http://localhost:3000";

// ── Check if logged in & Admin ──
var userData = localStorage.getItem("uj_filehub_user");
var user;
try {
  user = JSON.parse(userData);
} catch (e) {
  user = null;
}

if (!user || user.role !== "admin") {
  window.location.assign("index.html");
} else {
  var welcomeEl = document.getElementById("adminWelcomeName");
  var badgeEl = document.getElementById("adminUserBadge");
  if (welcomeEl) welcomeEl.textContent = user.full_name;
  if (badgeEl) badgeEl.textContent = "👋 " + user.full_name + " (Admin)";
}

// ── Logout ──
var adminLogoutBtn = document.getElementById("adminLogoutBtn");
if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("uj_filehub_user");
    window.location.assign("index.html");
  });
}

// ── Helpers ──
function escHtml(str) {
  var d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ── Load Pending Files ──
async function loadPendingFiles() {
  const grid = document.getElementById("pendingFilesGrid");
  const counter = document.getElementById("pendingCounter");
  if (!grid) return;

  try {
    const res = await fetch(API + "/api/files?status=pending");
    const data = await res.json();

    if (!data.success || !data.data.length) {
      grid.innerHTML = '<p class="empty-state">No files pending approval.</p>';
      if (counter) counter.textContent = "0 pending";
      return;
    }

    if (counter) counter.textContent = data.data.length + " pending";

    var html = "";
    for (var i = 0; i < data.data.length; i++) {
      var f = data.data[i];
      var date = new Date(f.uploaded_at).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      });

      html += '<div class="file-card">';
      html += '<span class="card-badge gradient-badge">' + escHtml(f.course_name) + '</span>';
      html += '<h3>' + escHtml(f.file_title) + '</h3>';
      html += '<p>' + escHtml(f.file_description || "") + '</p>';
      html += '<div class="file-meta">';
      html += '<span>By ' + escHtml(f.uploaded_by) + '</span>';
      html += '<span>' + date + '</span>';
      html += '</div>';
      html += '<div class="file-actions-admin">';
      html += '<a href="' + API + f.file_path + '" target="_blank" class="btn btn-light btn-sm" download>👁 View File</a>';
      html += '<button class="btn btn-approve" onclick="moderateFile(' + f.id + ', \'approved\')">Approve</button>';
      html += '<button class="btn btn-reject" onclick="deleteAdminFile(' + f.id + ', true)">Delete</button>';
      html += '</div>';
      html += '</div>';
    }
    grid.innerHTML = html;
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">Error loading pending files.</p>';
  }
}

// ── Load Approved Files ──
async function loadApprovedFiles() {
  const grid = document.getElementById("approvedFilesGrid");
  const counter = document.getElementById("approvedCounter");
  if (!grid) return;

  try {
    const res = await fetch(API + "/api/files?status=approved");
    const data = await res.json();

    if (!data.success || !data.data.length) {
      grid.innerHTML = '<p class="empty-state">No approved files yet.</p>';
      if (counter) counter.textContent = "0 approved";
      return;
    }

    if (counter) counter.textContent = data.data.length + " approved";

    var html = "";
    for (var i = 0; i < data.data.length; i++) {
      var f = data.data[i];
      var date = new Date(f.uploaded_at).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      });

      html += '<div class="file-card">';
      html += '<span class="card-badge gradient-badge">' + escHtml(f.course_name) + '</span>';
      html += '<h3>' + escHtml(f.file_title) + '</h3>';
      html += '<p>' + escHtml(f.file_description || "") + '</p>';
      html += '<div class="file-meta">';
      html += '<span>By ' + escHtml(f.uploaded_by) + '</span>';
      html += '<span>' + date + '</span>';
      html += '</div>';
      html += '<div class="file-actions-admin">';
      html += '<a href="' + API + f.file_path + '" target="_blank" class="btn btn-brand" download>Download</a>';
      html += '<button class="btn btn-reject" onclick="deleteAdminFile(' + f.id + ')">Delete</button>';
      html += '</div>';
      html += '</div>';
    }
    grid.innerHTML = html;
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">Error loading approved files.</p>';
  }
}

// ── Action: Moderate (Approve/Reject) File ──
async function moderateFile(fileId, status) {
  if (!user) return;

  try {
    const res = await fetch(API + "/api/files/" + fileId + "/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: status,
        admin_email: user.email
      })
    });
    const data = await res.json();

    if (data.success) {
      loadPendingFiles();
      loadApprovedFiles();
    } else {
      alert(data.message || "Failed to moderate file.");
    }
  } catch (err) {
    alert("Could not connect to the server.");
  }
}

// ── Action: Delete File as Admin ──
async function deleteAdminFile(fileId, isPending) {
  if (!user) return;

  if (!confirm("Are you sure you want to permanently delete this file?")) return;

  try {
    const url = API + "/api/files/" + fileId + "?user_email=" + encodeURIComponent(user.email);
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();

    if (data.success) {
      if (isPending) loadPendingFiles();
      else loadApprovedFiles();
    } else {
      alert(data.message || "Failed to delete file.");
    }
  } catch (err) {
    alert("Could not connect to the server.");
  }
}

// Make functions accessible globally
window.moderateFile = moderateFile;
window.deleteAdminFile = deleteAdminFile;

// ── Initial load ──
loadPendingFiles();
loadApprovedFiles();
