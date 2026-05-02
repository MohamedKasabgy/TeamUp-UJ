const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const { pool, testConnection } = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isEmpty(value) {
  return !value || String(value).trim() === "";
}

async function getCourseIdByName(courseName) {
  const [rows] = await pool.query(
    "SELECT id FROM courses WHERE course_name = ? LIMIT 1",
    [courseName]
  );
  return rows.length ? rows[0].id : null;
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "UJ FileHub backend is running."
  });
});

app.get("/api/courses", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, course_name, course_code, description FROM courses ORDER BY course_name ASC"
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load courses."
    });
  }
});

app.post("/api/courses", async (req, res) => {
  try {
    const { course_name, course_code, description } = req.body;

    if (isEmpty(course_name) || isEmpty(course_code) || isEmpty(description)) {
      return res.status(400).json({
        success: false,
        message: "Course name, code, and description are required."
      });
    }

    const [existingCourse] = await pool.query(
      "SELECT id FROM courses WHERE course_name = ? OR course_code = ? LIMIT 1",
      [course_name.trim(), course_code.trim()]
    );

    if (existingCourse.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This course already exists."
      });
    }

    await pool.query(
      "INSERT INTO courses (course_name, course_code, description) VALUES (?, ?, ?)",
      [course_name.trim(), course_code.trim(), description.trim()]
    );

    res.json({
      success: true,
      message: "Course added successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add course."
    });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      gender,
      mobile,
      date_of_birth,
      email,
      language,
      message
    } = req.body;

    if (
      isEmpty(first_name) ||
      isEmpty(last_name) ||
      isEmpty(gender) ||
      isEmpty(mobile) ||
      isEmpty(date_of_birth) ||
      isEmpty(email) ||
      isEmpty(language) ||
      isEmpty(message)
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format."
      });
    }

    if (!/^05\d{8}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be in the format 05XXXXXXXX."
      });
    }

    await pool.query(
      `INSERT INTO contact_messages
      (first_name, last_name, gender, mobile, date_of_birth, email, language, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name.trim(),
        last_name.trim(),
        gender.trim(),
        mobile.trim(),
        date_of_birth,
        email.trim(),
        language.trim(),
        message.trim()
      ]
    );

    res.json({
      success: true,
      message: "Contact message saved successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save contact message."
    });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { full_name, university_id, email, password } = req.body;

    if (
      isEmpty(full_name) ||
      isEmpty(university_id) ||
      isEmpty(email) ||
      isEmpty(password)
    ) {
      return res.status(400).json({
        success: false,
        message: "All registration fields are required."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR university_id = ? LIMIT 1",
      [email.trim(), university_id.trim()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or university ID."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (full_name, university_id, email, password)
       VALUES (?, ?, ?, ?)`,
      [
        full_name.trim(),
        university_id.trim(),
        email.trim(),
        hashedPassword
      ]
    );

    res.json({
      success: true,
      message: "Account created successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to register user."
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isEmpty(email) || isEmpty(password)) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const [users] = await pool.query(
      "SELECT id, full_name, university_id, email, password, role FROM users WHERE email = ? LIMIT 1",
      [email.trim()]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        full_name: user.full_name,
        university_id: user.university_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to log in."
    });
  }
});

app.post("/api/files/upload", upload.single("file_upload"), async (req, res) => {
  try {
    const {
      student_email,
      course_name,
      file_title,
      file_description
    } = req.body;

    if (
      isEmpty(student_email) ||
      isEmpty(course_name) ||
      isEmpty(file_title) ||
      !req.file
    ) {
      return res.status(400).json({
        success: false,
        message: "Email, course, file title, and file upload are required."
      });
    }

    if (!isValidEmail(student_email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format."
      });
    }

    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [student_email.trim()]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No account found with this email. Please register first."
      });
    }

    const userId = users[0].id;
    const courseId = await getCourseIdByName(course_name);

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Selected course was not found."
      });
    }

    const filePath = `/uploads/${req.file.filename}`;

    await pool.query(
      `INSERT INTO files
      (user_id, course_id, file_title, file_description, file_path)
      VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        courseId,
        file_title.trim(),
        file_description ? file_description.trim() : "",
        filePath
      ]
    );

    res.json({
      success: true,
      message: "File uploaded successfully.",
      file_path: filePath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload file."
    });
  }
});

app.get("/api/files", async (req, res) => {
  try {
    const { course_name, status } = req.query;

    let query = `
      SELECT
        files.id,
        files.file_title,
        files.file_description,
        files.file_path,
        files.status,
        files.uploaded_at,
        users.full_name AS uploaded_by,
        users.email AS uploader_email,
        courses.course_name,
        courses.course_code
      FROM files
      JOIN users ON files.user_id = users.id
      JOIN courses ON files.course_id = courses.id
    `;

    const params = [];
    const conditions = [];

    if (course_name && course_name.trim() !== "") {
      conditions.push("courses.course_name = ?");
      params.push(course_name.trim());
    }

    if (status && status.trim() !== "") {
      if (status !== "all") {
        conditions.push("files.status = ?");
        params.push(status.trim());
      }
    } else {
      conditions.push("files.status = 'approved'");
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY files.uploaded_at DESC";

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load files."
    });
  }
});

app.post("/api/study-sessions", async (req, res) => {
  try {
    const {
      student_email,
      course_name,
      session_date,
      session_time,
      session_type,
      location,
      meeting_link,
      notes
    } = req.body;

    if (
      isEmpty(student_email) ||
      isEmpty(course_name) ||
      isEmpty(session_date) ||
      isEmpty(session_time) ||
      isEmpty(session_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Email, course, date, time, and session type are required."
      });
    }

    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [student_email.trim()]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No account found with this email. Please register first."
      });
    }

    const userId = users[0].id;
    const courseId = await getCourseIdByName(course_name);

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Selected course was not found."
      });
    }

    await pool.query(
      `INSERT INTO study_sessions
      (user_id, course_id, session_date, session_time, session_type, location, meeting_link, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        courseId,
        session_date,
        session_time,
        session_type,
        location ? location.trim() : "",
        meeting_link ? meeting_link.trim() : "",
        notes ? notes.trim() : ""
      ]
    );

    res.json({
      success: true,
      message: "Study session created successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create study session."
    });
  }
});

app.get("/api/study-sessions", async (req, res) => {
  try {
    const { course_name } = req.query;

    let query = `
      SELECT
        study_sessions.id,
        study_sessions.session_date,
        study_sessions.session_time,
        study_sessions.session_type,
        study_sessions.location,
        study_sessions.meeting_link,
        study_sessions.notes,
        users.full_name AS created_by,
        users.email AS creator_email,
        courses.course_name
      FROM study_sessions
      JOIN users ON study_sessions.user_id = users.id
      JOIN courses ON study_sessions.course_id = courses.id
    `;

    const params = [];

    if (course_name && course_name.trim() !== "") {
      query += " WHERE courses.course_name = ? ";
      params.push(course_name.trim());
    }

    query += " ORDER BY study_sessions.session_date ASC, study_sessions.session_time ASC";

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load study sessions."
    });
  }
});

app.delete("/api/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user_email = req.query.user_email;

    if (!user_email) {
      return res.status(400).json({ success: false, message: "User email is required." });
    }

    const [users] = await pool.query("SELECT id, role FROM users WHERE email = ? LIMIT 1", [user_email.trim()]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    const user = users[0];

    let filesQuery = "SELECT id, file_path FROM files WHERE id = ? LIMIT 1";
    let queryParams = [id];

    if (user.role !== "admin") {
      filesQuery = "SELECT id, file_path FROM files WHERE id = ? AND user_id = ? LIMIT 1";
      queryParams = [id, user.id];
    }

    const [files] = await pool.query(filesQuery, queryParams);
    // REVERTED: Normal user must own the file (No Admin bypass)
    const [files] = await pool.query("SELECT id, file_path FROM files WHERE id = ? AND user_id = ? LIMIT 1", [id, userId]);
    
    if (files.length === 0) {
      return res.status(403).json({ success: false, message: "You do not have permission to delete this file." });
    }

    const filePath = path.join(__dirname, files[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query("DELETE FROM files WHERE id = ?", [id]);

    res.json({ success: true, message: "File deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete file." });
  }
});

app.put("/api/files/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_email } = req.body;

    if (!admin_email || !status) {
      return res.status(400).json({ success: false, message: "Admin email and status are required." });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const [users] = await pool.query("SELECT id, role FROM users WHERE email = ? LIMIT 1", [admin_email.trim()]);
    if (users.length === 0 || users[0].role !== "admin") {
      return res.status(403).json({ success: false, message: "Only administrators can moderate files." });
    }

    await pool.query("UPDATE files SET status = ? WHERE id = ?", [status, id]);

    res.json({ success: true, message: `File status updated to ${status} successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update file status." });
  }
});

app.delete("/api/study-sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user_email = req.query.user_email;

    if (!user_email) {
      return res.status(400).json({ success: false, message: "User email is required." });
    }

    const [users] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [user_email.trim()]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    const userId = users[0].id;

    // REVERTED: Normal user check (No Admin bypass)
    const [sessions] = await pool.query("SELECT id FROM study_sessions WHERE id = ? AND user_id = ? LIMIT 1", [id, userId]);
    
    if (sessions.length === 0) {
      return res.status(403).json({ success: false, message: "You can only delete your own sessions." });
    }

    await pool.query("DELETE FROM study_sessions WHERE id = ?", [id]);

    res.json({ success: true, message: "Study session deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete study session." });
  }
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await testConnection();
});