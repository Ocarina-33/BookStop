// Database/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL connection pool
const pool = new Pool({
  host:     process.env.PGHOST,
  user:     process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port:     process.env.PGPORT,
  max:                10,
  idleTimeoutMillis:  30000,
  connectionTimeoutMillis: 2000
});

// Startup: test connection
async function startup() {
  try {
    console.log('Starting PostgreSQL database...');
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL successfully.');
  } catch (err) {
    console.error('PostgreSQL startup failed:', err);
    throw err;
  }
}

// Shutdown
async function shutdown() {
  console.log('Shutting down PostgreSQL database...');
  try {
    await pool.end();
    console.log('PostgreSQL pool closed.');
  } catch (err) {
    console.error('Error closing PostgreSQL pool:', err);
  }
}

// Execute a single query
async function execute(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.error('Error executing SQL:', err);
    throw err;
  }
}

// Execute many in a transaction
async function executeMany(sql, bindsArray = []) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const binds of bindsArray) {
      await client.query(sql, binds);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in executeMany:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  startup,
  shutdown,
  execute,
  executeMany
};
