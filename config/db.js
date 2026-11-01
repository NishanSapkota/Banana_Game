/**
 * ====================================================================
 * THEME: INTEROPERABILITY & DATABASE ARCHITECTURE
 * File: config/db.js
 * Description:
 *   Configures MySQL connection pool using mysql2/promise.
 *   Enables interoperability between the Node.js application layer
 *   and the MySQL relational database server (bananagame2).
 * ====================================================================
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bananagame2',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test MySQL connection on initialization
let isConnected = false;

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    isConnected = true;
    console.log(`[Database] Successfully connected to MySQL database: ${process.env.DB_NAME || 'bananagame2'}`);
    connection.release();
  } catch (err) {
    isConnected = false;
    console.warn(`[Database Warning] Could not connect to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT}.`);
    console.warn(`[Database Tip] Ensure MySQL is running and you have created the database using database.sql.`);
    console.warn(`Error message: ${err.message}`);
  }
}

testConnection();

module.exports = {
  pool,
  isDbConnected: () => isConnected,
  testConnection
};
