const API = "http://localhost:3000";

/* ── helpers ── */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("uj_filehub_user"));
  } catch {
    return null;
  }
}

function showMsg(el, text, isError) {
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "#ff6b6b" : "#51cf66";
}

/* ── auto-fill email fields & hide/show sections based on login ── */
const user = getUser();
const accountSection = document.getElementById("accountAccessSection");
const authUploadForms = document.getElementById("auth-upload-forms");

if (user) {
  // If logged in: Auto-fill emails, hide the login prompt, and show the forms
  document.querySelectorAll("#student-email, #session-email").forEach(function (el) {
    el.value = user.email;
  });

  if (accountSection) accountSection.style.display = "none";
  if (authUploadForms) authUploadForms.style.display = "block";
} else {
  // If NOT logged in: Show the login prompt, and hide the forms
  if (accountSection) accountSection.style.display = "block";
  if (authUploadForms) authUploadForms.style.display = "none";
}

/* ── Admin Configuration ── */
const ADMIN_EMAILS = [
  "2342932@uj.edu.sa",
  "2342943@uj.edu.sa",
  "2342945@uj.edu.sa"
];
const isAdmin = user && ADMIN_EMAILS.includes(user.email);

/* ── Tab Switching Logic ── */
const tabBrowse = document.getElementById("tab-browse");
const tabUpload = document.getElementById("tab-upload");
const tabSessions = document.getElementById("tab-sessions");

const btnBrowse = document.getElementById("btn-tab-browse");
const btnUpload = document.getElementById("btn-tab-upload");
const btnSessions = document.getElementById("btn-tab-sessions");

function switchTab(activeTab, activeBtn) {
  if(!tabBrowse) return; 
  
  // Hide all tabs
  tabBrowse.style.display = "none";
  tabUpload.style.display = "none";
  tabSessions.style.display = "none";
  
  // Reset all buttons to light gray
  btnBrowse.className = "btn btn-light";
  btnUpload.className = "btn btn-light";
  btnSessions.className = "btn btn-light";
  
  // Show active tab and highlight button
  activeTab.style.display = "block";
  activeBtn.className = "btn btn-brand";
}

if(btnBrowse) btnBrowse.addEventListener("click", function() { switchTab(tabBrowse, btnBrowse); });
if(btnUpload) btnUpload.addEventListener("click", function() { switchTab(tabUpload, btnUpload); });
if(btnSessions) btnSessions.addEventListener("click", function() { switchTab(tabSessions, btnSessions); });


/* ── Upload File form ── */
const uploadForm = document.getElementById("uploadForm");
const uploadMsg = document.getElementById("upload-message");

if (uploadForm) {
  uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMsg(uploadMsg, "Uploading...", false);

    try {
      const fd = new FormData(uploadForm);
      const res = await fetch(API + "/api/files/upload", {
        method: "POST",
        body: fd
      });
      const data = await res.json();

      if (data.success) {
        showMsg(uploadMsg, "File uploaded successfully!", false);
        uploadForm.reset();
        if (user) {
          var emailField = document.getElementById("student-email");
          if (emailField) emailField.value = user.email;
        }
        loadFiles();
      } else {
        showMsg(uploadMsg, data.message || "Upload failed.", true);
      }
    } catch (err) {
      showMsg(uploadMsg, "Could not connect to the server.", true);
    }
  });
}

/* ── Add Course form ── */
const courseForm = document.getElementById("courseForm");
const courseMsg = document.getElementById("course-message");

if (courseForm) {
  courseForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMsg(courseMsg, "Adding course...", false);

    const fd = new FormData(courseForm);
    const body = Object.fromEntries(fd.entries());

    try {
      const res = await fetch(API + "/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        showMsg(courseMsg, "Course added successfully!", false);
        courseForm.reset();
      } else {
        showMsg(courseMsg, data.message || "Failed to add course.", true);
      }
    } catch (err) {
      showMsg(courseMsg, "Could not connect to the server.", true);
    }
  });
}

/* ── Study Session form ── */
const sessionForm = document.getElementById("sessionForm");
const sessionMsg = document.getElementById("session-message");

if (sessionForm) {
  sessionForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMsg(sessionMsg, "Creating session...", false);

    const fd = new FormData(sessionForm);
    const body = Object.fromEntries(fd.entries());

    try {
      const res = await fetch(API + "/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        showMsg(sessionMsg, "Study session created!", false);
        sessionForm.reset();
        if (user) {
          var emailField = document.getElementById("session-email");
          if (emailField) emailField.value = user.email;
        }
        loadSessions();
      } else {
        showMsg(sessionMsg, data.message || "Failed to create session.", true);
      }
    } catch (err) {
      showMsg(sessionMsg, "Could not connect to the server.", true);
    }
  });
}

/* ── Delete helpers (two-click confirmation) ── */
var pendingDelete = {};

function deleteFile(fileId, btn) {
  if (!user) return;

  // First click: change button to "Confirm?"
  if (!pendingDelete["file-" + fileId]) {
    pendingDelete["file-" + fileId] = true;
    if (btn) {
      btn.textContent = "⚠ Confirm?";
      btn.classList.add("btn-confirm");
    }
    // Reset after 3 seconds if not confirmed
    setTimeout(function () {
      pendingDelete["file-" + fileId] = false;
      if (btn) {
        btn.textContent = "🗑 Delete";
        btn.classList.remove("btn-confirm");
      }
    }, 3000);
    return;
  }

  // Second click: actually delete
  pendingDelete["file-" + fileId] = false;
  var url = API + "/api/files/" + fileId + "?user_email=" + encodeURIComponent(user.email);
  fetch(url, { method: "DELETE" })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success) {
        loadFiles();
      }
    });
}

function deleteSession(sessionId, btn) {
  if (!user) return;

  if (!pendingDelete["session-" + sessionId]) {
    pendingDelete["session-" + sessionId] = true;
    if (btn) {
      btn.textContent = "⚠ Confirm?";
      btn.classList.add("btn-confirm");
    }
    setTimeout(function () {
      pendingDelete["session-" + sessionId] = false;
      if (btn) {
        btn.textContent = "🗑 Delete";
        btn.classList.remove("btn-confirm");
      }
    }, 3000);
    return;
  }

  pendingDelete["session-" + sessionId] = false;
  var url = API + "/api/study-sessions/" + sessionId + "?user_email=" + encodeURIComponent(user.email);
  fetch(url, { method: "DELETE" })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success) {
        loadSessions();
      }
    });
}

window.deleteFile = deleteFile;
window.deleteSession = deleteSession;

/* ── Load & display uploaded files ── */
var filesGrid = document.getElementById("filesGrid");

async function loadFiles(courseName) {
  if (!filesGrid) return;
  try {
    var url = API + "/api/files";
    if (courseName) url += "?course_name=" + encodeURIComponent(courseName);
    var res = await fetch(url);
    var data = await res.json();

    if (!data.success || !data.data.length) {
      filesGrid.innerHTML = '<p class="empty-state">No files uploaded yet.</p>';
      return;
    }

    var html = "";
    for (var i = 0; i < data.data.length; i++) {
      var f = data.data[i];
      var date = new Date(f.uploaded_at).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      });
      
      // ADMIN CHECK INJECTED HERE
      var isOwner = (user && user.email === f.uploader_email) || isAdmin;
      var deleteBtn = isOwner
        ? '<button class="btn btn-delete btn-sm" onclick="deleteFile(' + f.id + ', this)">🗑 Delete</button>'
        : "";

      html += '<div class="file-card">';
      html += '<span class="card-badge gradient-badge">' + escHtml(f.course_name) + '</span>';
      html += '<h3>' + escHtml(f.file_title) + '</h3>';
      html += '<p>' + escHtml(f.file_description || "") + '</p>';
      html += '<div class="file-meta">';
      html += '<span>By ' + escHtml(f.uploaded_by) + '</span>';
      html += '<span>' + date + '</span>';
      html += '</div>';
      html += '<div class="file-actions">';
      html += '<a href="' + API + f.file_path + '" target="_blank" class="btn btn-brand btn-sm" download>Download</a>';
      html += deleteBtn;
      html += '</div>';
      html += '</div>';
    }
    filesGrid.innerHTML = html;
  } catch (err) {
    filesGrid.innerHTML = '<p class="empty-state">Could not load files.</p>';
  }
}

/* ── Load & display study sessions ── */
var sessionsGrid = document.getElementById("sessionsGrid");

async function loadSessions(courseName) {
  if (!sessionsGrid) return;
  try {
    var url = API + "/api/study-sessions";
    if (courseName) url += "?course_name=" + encodeURIComponent(courseName);
    var res = await fetch(url);
    var data = await res.json();

    if (!data.success || !data.data.length) {
      sessionsGrid.innerHTML = '<p class="empty-state">No study sessions scheduled yet.</p>';
      return;
    }

    var html = "";
    for (var i = 0; i < data.data.length; i++) {
      var s = data.data[i];
      var dateStr = new Date(s.session_date).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      });
      var typeLabel = s.session_type === "online" ? "🌐 Online" : "🏫 On-Campus";
      var locationInfo = "";
      if (s.session_type === "online" && s.meeting_link) {
        locationInfo = '<a href="' + escHtml(s.meeting_link) + '" target="_blank" class="session-link">Join Meeting</a>';
      } else if (s.location) {
        locationInfo = '<span class="session-location">📍 ' + escHtml(s.location) + '</span>';
      }

      // ADMIN CHECK INJECTED HERE
      var isOwner = (user && user.email === s.creator_email) || isAdmin;
      var deleteBtn = isOwner
        ? '<button class="btn btn-delete btn-sm" onclick="deleteSession(' + s.id + ', this)">🗑 Delete</button>'
        : "";

      html += '<div class="session-card">';
      html += '<span class="card-badge gradient-badge">' + escHtml(s.course_name) + '</span>';
      html += '<div class="session-header">';
      html += '<span class="session-type-badge ' + s.session_type + '">' + typeLabel + '</span>';
      html += '</div>';
      html += '<div class="session-datetime">';
      html += '<span>📅 ' + dateStr + '</span>';
      html += '<span>⏰ ' + s.session_time + '</span>';
      html += '</div>';
      html += locationInfo;
      if (s.notes) html += '<p class="session-notes">' + escHtml(s.notes) + '</p>';
      html += '<div class="file-meta">';
      html += '<span>By ' + escHtml(s.created_by) + '</span>';
      html += deleteBtn;
      html += '</div>';
      html += '</div>';
    }
    sessionsGrid.innerHTML = html;
  } catch (err) {
    sessionsGrid.innerHTML = '<p class="empty-state">Could not load sessions.</p>';
  }
}

function escHtml(str) {
  var d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* ── Course filter ── */
var courseFilter = document.getElementById("courseFilter");
var clearFilterBtn = document.getElementById("clearFilter");
var filesSubtitle = document.getElementById("filesSubtitle");

function applyFilter() {
  var selected = courseFilter ? courseFilter.value : "";
  loadFiles(selected);
  loadSessions(selected);

  if (filesSubtitle) {
    filesSubtitle.textContent = selected
      ? "Showing files for: " + selected
      : "Files uploaded by students across all courses.";
  }

  if (clearFilterBtn) {
    clearFilterBtn.style.display = selected ? "inline-block" : "none";
  }
}

if (courseFilter) {
  courseFilter.addEventListener("change", applyFilter);
}

if (clearFilterBtn) {
  clearFilterBtn.addEventListener("click", function () {
    if (courseFilter) courseFilter.value = "";
    applyFilter();
  });
}

/* ── initial load ── */
applyFilter();