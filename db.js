const mySql = require("mysql2/promise");
require("dotenv").config();

const pool = mySql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "online_exam",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // port: 3306,
  // port: process.env.DB_PORT,
  timezone: "local",
  connectTimeout: 60000,
});

pool
  .getConnection()
  .then((conn) => {
    console.log("✅ MySQL pool connected!");
    // conn.release(); // release connection back to pool
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err);
  });

module.exports = pool;
