const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "uj_filehub",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully.");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

module.exports = {
  pool,
  testConnection
};