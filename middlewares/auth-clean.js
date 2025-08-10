const jwt = require('jsonwebtoken');
const DB_auth = require('../Database/DB-auth-api');

// Session timeout in minutes (30 minutes)
const SESSION_TIMEOUT_MINUTES = 30;

function auth(req, res, next) {
  req.user = null;
  res.locals.user = null;

  console.log(`\n🔥 [MULTI-USER AUTH] ${req.method} ${req.url}`);
  console.log(`🔍 [AUTH] Processing request with session timeout system`);
  
  let token = null;
  let sessionId = null;
  let tokenSource = 'none';

  // Strategy: Check for active session first, then fallback to most recent valid session
  const cookies = req.cookies || {};
  let validSessions = [];
  const now = Date.now();
  
  console.log(`🍪 [AUTH] Available cookies: ${Object.keys(cookies).join(', ')}`);

  // First, collect all valid (non-expired) sessions
  for (const cookieName in cookies) {
    if (cookieName.startsWith('sessionToken_')) {
      try {
        const tempToken = cookies[cookieName];
        const decoded = jwt.verify(tempToken, process.env.APP_SECRET);
        
        // Check if session has expired (30 minutes timeout)
        const sessionAge = now - decoded.timestamp;
        const sessionAgeMinutes = sessionAge / (1000 * 60);
        
        if (sessionAgeMinutes > SESSION_TIMEOUT_MINUTES) {
          console.log(`⏰ [AUTH] Session ${cookieName.replace('sessionToken_', '')} expired (${sessionAgeMinutes.toFixed(1)} minutes old)`);
          // Clear expired session
          res.clearCookie(cookieName);
          continue;
        }
        
        validSessions.push({
          token: tempToken,
          sessionId: cookieName.replace('sessionToken_', ''),
          timestamp: decoded.timestamp,
          userId: decoded.id,
          cookieName: cookieName
        });
        
        console.log(`✓ [AUTH] Valid session: ${cookieName.replace('sessionToken_', '')} (${sessionAgeMinutes.toFixed(1)} minutes old)`);
      } catch (err) {
        // Invalid token, clear it
        console.log(`❌ [AUTH] Invalid token in ${cookieName}: ${err.message}`);
        res.clearCookie(cookieName);
      }
    }
  }

  // Sort valid sessions by timestamp (most recent first)
  validSessions.sort((a, b) => b.timestamp - a.timestamp);

  // Check for active session cookie to determine which session to use
  const activeSessionId = req.cookies.activeSession;
  let selectedSession = null;

  if (activeSessionId && validSessions.length > 0) {
    // Look for the active session among valid sessions
    selectedSession = validSessions.find(session => session.sessionId === activeSessionId);
    if (selectedSession) {
      console.log(`🎯 [AUTH] Using active session: ${activeSessionId}`);
    } else {
      console.log(`⚠️ [AUTH] Active session ${activeSessionId} not found in valid sessions, using most recent`);
      selectedSession = validSessions[0];
    }
  } else if (validSessions.length > 0) {
    // No active session specified, use most recent valid session
    selectedSession = validSessions[0];
    console.log(`🎯 [AUTH] Using most recent valid session: ${selectedSession.sessionId}`);
  }

  // Use the selected session
  if (selectedSession) {
    token = selectedSession.token;
    sessionId = selectedSession.sessionId;
    tokenSource = `selected_${sessionId}`;
    
    // Set this as the active session if not already set
    if (!activeSessionId || activeSessionId !== sessionId) {
      res.cookie('activeSession', sessionId, { 
        httpOnly: true, 
        secure: false, 
        sameSite: 'lax',
        maxAge: SESSION_TIMEOUT_MINUTES * 60 * 1000 
      });
      console.log(`🔄 [AUTH] Set active session to: ${sessionId}`);
    }
  }

  // If still no token, check for old-style sessionToken
  if (!token && req.cookies.sessionToken) {
    token = req.cookies.sessionToken;
    sessionId = 'legacy';
    console.log(`🔄 [AUTH] Using legacy session token`);
  }

  if (!token) {
    console.log(`❌ [AUTH] No valid session token found`);
    // Clear any remaining invalid cookies
    const activeSessionId = req.cookies.activeSession;
    if (activeSessionId) {
      res.clearCookie('activeSession');
    }
    return next();
  }

  // Verify and decode the token
  jwt.verify(token, process.env.APP_SECRET, async (err, decoded) => {
    if (err) {
      console.log(`❌ [AUTH] Token verification failed: ${err.message}`);
      // Clear invalid token
      if (sessionId !== 'legacy') {
        res.clearCookie(`sessionToken_${sessionId}`);
        if (req.cookies.activeSession === sessionId) {
          res.clearCookie('activeSession');
        }
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
          sessionId: sessionId,
          timestamp: decoded.timestamp
        };
        res.locals.user = req.user;
        
        console.log(`✅ [MULTI-USER AUTH] User authenticated: ${user.NAME} (${user.EMAIL}) - Session: ${sessionId}`);
      } else {
        console.log(`❌ [AUTH] User not found in database for ID: ${decoded.id}`);
        // Clear invalid session
        if (sessionId !== 'legacy') {
          res.clearCookie(`sessionToken_${sessionId}`);
          if (req.cookies.activeSession === sessionId) {
            res.clearCookie('activeSession');
          }
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
