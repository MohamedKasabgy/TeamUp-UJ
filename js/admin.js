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

// ── Dynamic Course Dropdowns for Admin ──
async function loadAdminCourseDropdowns() {
  try {
    const res = await fetch(API + "/api/courses");
    const data = await res.json();

    if (data.success && data.data) {
      const pFilter = document.getElementById("pendingCourseFilter");
      const aFilter = document.getElementById("approvedCourseFilter");

      function populate(dropdown) {
        if (!dropdown) return;
        const current = dropdown.value; 
        dropdown.innerHTML = '<option value="">All Courses</option>';
        data.data.forEach(course => {
          dropdown.innerHTML += `<option value="${course.course_name}">${course.course_name}</option>`;
        });
        dropdown.value = current;
      }

      populate(pFilter);
      populate(aFilter);
    }
  } catch (err) {
    console.error("Failed to fetch courses for admin filters:", err);
  }
}

// ── Load Pending Files (with optional course filter) ──
async function loadPendingFiles(courseName = "") {
  const grid = document.getElementById("pendingFilesGrid");
  const counter = document.getElementById("pendingCounter");
  if (!grid) return;

  try {
    let url = API + "/api/files?status=pending";
    if (courseName) url += "&course_name=" + encodeURIComponent(courseName);

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.data.length) {
      grid.innerHTML = `
        <div class="empty-state-card" style="padding: 40px 20px;">
          <span class="empty-state-icon" style="font-size: 2.5rem;">✨</span>
          <h3>All caught up!</h3>
          <p>There are no files waiting for your approval right now.</p>
        </div>
      `;
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

// ── Load Approved Files (with optional course filter) ──
async function loadApprovedFiles(courseName = "") {
  const grid = document.getElementById("approvedFilesGrid");
  const counter = document.getElementById("approvedCounter");
  if (!grid) return;

  try {
    let url = API + "/api/files?status=approved";
    if (courseName) url += "&course_name=" + encodeURIComponent(courseName);

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.data.length) {
      grid.innerHTML = `
        <div class="empty-state-card" style="padding: 40px 20px;">
          <span class="empty-state-icon" style="font-size: 2.5rem;">📂</span>
          <h3>No approved files</h3>
          <p>You haven't approved any files yet for this course.</p>
        </div>
      `;
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


/* ── Search & Filter Logic: PENDING SECTION ── */
const pendingSearch = document.getElementById("pendingSearch");
const pendingCourseFilter = document.getElementById("pendingCourseFilter");
const clearPendingBtn = document.getElementById("clearPendingFilter");

function applyPendingSearchFilter() {
  const searchText = pendingSearch ? pendingSearch.value.toLowerCase() : "";
  const fileCards = document.querySelectorAll("#pendingFilesGrid .file-card");
  
  fileCards.forEach(function(card) {
    const title = card.querySelector("h3") ? card.querySelector("h3").textContent.toLowerCase() : "";
    const desc = card.querySelector("p") ? card.querySelector("p").textContent.toLowerCase() : "";
    if (title.includes(searchText) || desc.includes(searchText)) {
      card.style.display = "flex"; // file-cards use flexbox
    } else {
      card.style.display = "none";
    }
  });

  const selected = pendingCourseFilter ? pendingCourseFilter.value : "";
  if (clearPendingBtn) {
    clearPendingBtn.style.display = (selected || searchText) ? "inline-block" : "none";
  }
}

async function applyPendingDBFilter() {
  const selected = pendingCourseFilter ? pendingCourseFilter.value : "";
  await loadPendingFiles(selected);
  applyPendingSearchFilter();
}

if (pendingCourseFilter) pendingCourseFilter.addEventListener("change", applyPendingDBFilter);
if (pendingSearch) pendingSearch.addEventListener("input", applyPendingSearchFilter);
if (clearPendingBtn) {
  clearPendingBtn.addEventListener("click", function () {
    if (pendingCourseFilter) pendingCourseFilter.value = "";
    if (pendingSearch) pendingSearch.value = "";
    applyPendingDBFilter();
  });
}


/* ── Search & Filter Logic: APPROVED SECTION ── */
const approvedSearch = document.getElementById("approvedSearch");
const approvedCourseFilter = document.getElementById("approvedCourseFilter");
const clearApprovedBtn = document.getElementById("clearApprovedFilter");

function applyApprovedSearchFilter() {
  const searchText = approvedSearch ? approvedSearch.value.toLowerCase() : "";
  const fileCards = document.querySelectorAll("#approvedFilesGrid .file-card");
  
  fileCards.forEach(function(card) {
    const title = card.querySelector("h3") ? card.querySelector("h3").textContent.toLowerCase() : "";
    const desc = card.querySelector("p") ? card.querySelector("p").textContent.toLowerCase() : "";
    if (title.includes(searchText) || desc.includes(searchText)) {
      card.style.display = "flex"; 
    } else {
      card.style.display = "none";
    }
  });

  const selected = approvedCourseFilter ? approvedCourseFilter.value : "";
  if (clearApprovedBtn) {
    clearApprovedBtn.style.display = (selected || searchText) ? "inline-block" : "none";
  }
}

async function applyApprovedDBFilter() {
  const selected = approvedCourseFilter ? approvedCourseFilter.value : "";
  await loadApprovedFiles(selected);
  applyApprovedSearchFilter();
}

if (approvedCourseFilter) approvedCourseFilter.addEventListener("change", applyApprovedDBFilter);
if (approvedSearch) approvedSearch.addEventListener("input", applyApprovedSearchFilter);
if (clearApprovedBtn) {
  clearApprovedBtn.addEventListener("click", function () {
    if (approvedCourseFilter) approvedCourseFilter.value = "";
    if (approvedSearch) approvedSearch.value = "";
    applyApprovedDBFilter();
  });
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
      // Re-run the filters so the view stays accurate after approving a file
      applyPendingDBFilter();
      applyApprovedDBFilter();
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
      // Re-run the specific filter depending on where they deleted it from
      if (isPending) applyPendingDBFilter();
      else applyApprovedDBFilter();
    } else {
      alert(data.message || "Failed to delete file.");
    }
  } catch (err) {
    alert("Could not connect to the server.");
  }
}

// ── Load Contact Messages ──
async function loadContactMessages() {
  const grid = document.getElementById("messagesGrid");
  const counter = document.getElementById("messagesCounter");
  if (!grid) return;

  try {
    const res = await fetch(API + "/api/messages");
    const data = await res.json();

    if (!data.success || !data.data.length) {
      grid.innerHTML = `
        <div class="empty-state-card" style="padding: 40px 20px;">
          <span class="empty-state-icon" style="font-size: 2.5rem;">✉️</span>
          <h3>No messages yet</h3>
          <p>Your inbox is currently empty. New contact inquiries will appear here.</p>
        </div>
      `;
      if (counter) counter.textContent = "0 messages";
      return;
    }

    if (counter) counter.textContent = data.data.length + " messages";

    var html = "";
    for (var i = 0; i < data.data.length; i++) {
      var m = data.data[i];
      var date = new Date(m.created_at).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });

      html += '<div class="file-card">';
      html += '<span class="card-badge gradient-badge">' + escHtml(m.language) + '</span>';
      html += '<h3>' + escHtml(m.first_name + " " + m.last_name) + '</h3>';
      html += '<p><strong>Email:</strong> ' + escHtml(m.email) + '<br><strong>Mobile:</strong> ' + escHtml(m.mobile) + '</p>';
      html += '<p style="margin-top: 10px; border-top: 1px solid var(--border); padding-top: 10px;">' + escHtml(m.message) + '</p>';
      html += '<div class="file-meta">';
      html += '<span>Sent on ' + date + '</span>';
      html += '</div>';
      html += '</div>';
    }
    grid.innerHTML = html;
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">Error loading messages.</p>';
  }
}

// Make functions accessible globally
window.moderateFile = moderateFile;
window.deleteAdminFile = deleteAdminFile;

// ── Initial load ──
loadAdminCourseDropdowns().then(() => {
  applyPendingDBFilter();
  applyApprovedDBFilter();
  loadContactMessages();
});