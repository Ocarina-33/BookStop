// libraries
const jwt = require('jsonwebtoken');

// function to log in a user (simple like SQuirreL)
async function loginUser(res, userId, req = null) {
  console.log(`\n🔐 [LOGIN] Starting login for user ID: ${userId}`);
  
  const payload = { 
    id: userId
  };

  const token = jwt.sign(payload, process.env.APP_SECRET, {
    expiresIn: '1d'
  });

  // Simple sessionToken cookie (exactly like SQuirreL)
  res.cookie('sessionToken', token, {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  console.log(`✅ [LOGIN] Created simple session for user ${userId}`);
}

// function to log in an admin (unchanged)
async function loginAdmin(res, userId) {
  const payload = { superid: userId };

  const token = jwt.sign(payload, process.env.APP_SECRET, {
    expiresIn: '1d'
  });

  res.cookie('adminSessionToken', token, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

module.exports = {
  loginUser,
  loginAdmin
};
