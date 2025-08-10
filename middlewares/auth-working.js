const jwt = require('jsonwebtoken');
const DB_auth = require('../Database/DB-auth-api');

function auth(req, res, next) {
  req.user = null;
  res.locals.user = null;

  console.log(`\n🔥 [MULTI-USER AUTH] ${req.method} ${req.url}`);
  
  let token = null;
  let sessionId = null;

  // Check for active session first
  const activeSessionId = req.cookies.activeSession;
  const cookies = req.cookies || {};
  
  console.log(`🍪 [AUTH] Available cookies: ${Object.keys(cookies).join(', ')}`);
  console.log(`🎯 [AUTH] Active session: ${activeSessionId || 'none'}`);

  // If there's an active session, use that
  if (activeSessionId && cookies[`sessionToken_${activeSessionId}`]) {
    token = cookies[`sessionToken_${activeSessionId}`];
    sessionId = activeSessionId;
    console.log(`✅ [AUTH] Using active session: ${sessionId}`);
  } 
  // Otherwise, find the most recent session token
  else {
    let mostRecentTimestamp = 0;
    for (const cookieName in cookies) {
      if (cookieName.startsWith('sessionToken_')) {
        try {
          const tempToken = cookies[cookieName];
          const decoded = jwt.verify(tempToken, process.env.APP_SECRET);
          
          if (decoded.timestamp && decoded.timestamp > mostRecentTimestamp) {
            mostRecentTimestamp = decoded.timestamp;
            token = tempToken;
            sessionId = cookieName.replace('sessionToken_', '');
          }
        } catch (err) {
          console.log(`❌ [AUTH] Invalid token in ${cookieName}`);
        }
      }
    }
    
    if (token) {
      console.log(`🔄 [AUTH] Using most recent session: ${sessionId}`);
      // Set this as the active session
      res.cookie('activeSession', sessionId, {
        maxAge: 30 * 60 * 1000, // 30 minutes
        httpOnly: true,
        sameSite: 'lax'
      });
    }
  }

  // Fallback to legacy sessionToken
  if (!token && req.cookies.sessionToken) {
    token = req.cookies.sessionToken;
    sessionId = 'legacy';
    console.log(`🔄 [AUTH] Using legacy session token`);
  }

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
