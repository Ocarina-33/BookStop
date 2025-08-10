// Database/DB-auth-api.js
const database = require('./database');

// Get user ID by email
async function getUserIDByEmail(email) {
  const sql = 
  `SELECT id 
  FROM app_user 
  WHERE email = $1`;
  const result = await database.execute(sql, [email]);
  return result.rows;
}

// Create a new user
async function createNewUser(user) {
  const sql = `
    INSERT INTO app_user(name, email, password, address, phone, dob)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  const values = [
    user.name,
    user.email,
    user.password,
    user.address || null,
    user.phone || null,
    user.dob || null
  ];
  const result = await database.execute(sql, values);
  return result.rows[0];
}

// Get login info by email (for login)
async function getLoginInfoByEmail(email) {
  const sql = `
    SELECT id, name, password, email, image
    FROM app_user
    WHERE email = $1
  `;
  const result = await database.execute(sql, [email]);
  return result.rows;
}

async function getLoginInfoByID(id) {
  const sql = `
    SELECT
      id,
      name AS NAME,
      email AS EMAIL,
      image AS IMAGE
    FROM app_user
    WHERE id = $1
  `;
  const binds = [id];
  const result = await database.execute(sql, binds);
  return result.rows;
}


module.exports = {
  getUserIDByEmail,
  createNewUser,
  getLoginInfoByEmail,
  getLoginInfoByID,
};
