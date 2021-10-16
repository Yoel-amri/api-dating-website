const mysql = require('mysql2/promise');
const { SqlError } = require('./dbErrors');



const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "password",
    database: process.env.DB_NAME || "matcha_db",
    waitForConnections: true,
    connectionLimit: process.env.DB_CONN_LIMIT || 2,
    queueLimit: 0,
    debug: process.env.DB_DEBUG || false
});

async function query(sql, params) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } catch (e) {
    console.log(process.env.DB_PASS);
    throw new Error(e);
  }
}

module.exports = {
  query,
}