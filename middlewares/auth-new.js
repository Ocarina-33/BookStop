const jwt = require('jsonwebtoken');
const DB_auth = require('../Database/DB-auth-api');

function auth(req, res, next) {
  req.user = null;
  res.locals.user = null;

  console.log(`\n🔍 [AUTH] ${req.method} ${req.url}`);
  
  let token = null;
  let sessionId = null;
  let tokenSource = 'none';

  // Strategy: Try to find the most recent session token for this request
  // Check all sessionToken_* cookies and use the most recent one based on timestamp
  const cookies = req.cookies || {};
  let mostRecentSession = null;
  let mostRecentTimestamp = 0;
  
  console.log(`🍪 [AUTH] Available cookies: ${Object.keys(cookies).join(', ')}`);

  for (const cookieName in cookies) {
    if (cookieName.startsWith('sessionToken_')) {
      try {
        const tempToken = cookies[cookieName];
        const decoded = jwt.verify(tempToken, process.env.APP_SECRET);
        
        // Find the most recent session (highest timestamp)
        if (decoded.timestamp && decoded.timestamp > mostRecentTimestamp) {
          mostRecentTimestamp = decoded.timestamp;
          mostRecentSession = {
            token: tempToken,
            sessionId: cookieName.replace('sessionToken_', ''),
            timestamp: decoded.timestamp,
            userId: decoded.id
          };
        }
      } catch (err) {
        // Invalid token, skip it
        console.log(`❌ [AUTH] Invalid token in ${cookieName}: ${err.message}`);
      }
    }
  }

  // Use the most recent valid session
  if (mostRecentSession) {
    token = mostRecentSession.token;
    sessionId = mostRecentSession.sessionId;
    tokenSource = `most_recent_${sessionId}`;
    console.log(`🎯 [AUTH] Using most recent session: ${sessionId} (timestamp: ${mostRecentSession.timestamp})`);
  }

  // Fallback to legacy sessionToken if no session tokens found
  if (!token && req.cookies.sessionToken) {
    token = req.cookies.sessionToken;
    sessionId = 'legacy';
    tokenSource = 'legacy_token';
    console.log(`🔄 [AUTH] Using legacy session token`);
  }

  console.log(`🔑 [AUTH] Token source: ${tokenSource}`);

  if (!token) {
    console.log(`❌ [AUTH] No session token found`);
    return next();
  }

  // Verify and decode the token
  jwt.verify(token, process.env.APP_SECRET, async (err, decoded) => {
    if (err) {
      console.log(`❌ [AUTH] Token verification failed: ${err.message}`);
      // Clear invalid token
      if (sessionId !== 'legacy') {
        res.clearCookie(`sessionToken_${sessionId}`);
      } else {
        res.clearCookie('sessionToken');
      }
      return next();
    }

    if (!decoded || !decoded.id) {
      console.log(`❌ [AUTH] Invalid token payload`);
      return next();
    }

    try {
      // Get user info from database
      const results = await DB_auth.getLoginInfoByID(decoded.id);
      
      if (results && results.length > 0) {
        const user = results[0];
        req.user = {
          id: decoded.id,
          email: user.EMAIL,
          name: user.NAME,
          image: user.IMAGE,
          sessionId: sessionId
        };
        res.locals.user = req.user;
        
        console.log(`✅ [AUTH] User authenticated: ${user.NAME} (${user.EMAIL}) - Session: ${sessionId}`);
      } else {
        console.log(`❌ [AUTH] User not found in database for ID: ${decoded.id}`);
        // Clear invalid session
        if (sessionId !== 'legacy') {
          res.clearCookie(`sessionToken_${sessionId}`);
        } else {
          res.clearCookie('sessionToken');
        }
      }
    } catch (dbErr) {
      console.error(`❌ [AUTH] Database error:`, dbErr);
    }

    return next();
  });
}

// function to extract admin id from the admin session token
function extractAdminId(req) {
  const token = req.cookies.adminSessionToken;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.APP_SECRET);
    return payload.superid;
  } catch (error) {
    return null;
  }
}

async function adminAuth(req, res, next) {
  req.admin = null;
  res.locals.admin = null;

  const adminId = extractAdminId(req);
  if (adminId) {
    req.admin = { NAME: 'Admin' };
    res.locals.admin = req.admin;
  }

  return next();
}

module.exports = {
  auth,
  adminAuth,
  extractAdminId
};
