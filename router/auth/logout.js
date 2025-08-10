const express = require('express');
const router = express.Router();

// POST /logout
router.post('/', (req, res) => {
  if (req.user) {
    // If this is a multi-session user, clear the specific session
    if (req.user.sessionId) {
      const sessionCookieName = `sessionToken_${req.user.sessionId}`;
      res.clearCookie(sessionCookieName);
      res.clearCookie('activeSession');
      console.log(`🚪 Logged out user session: ${req.user.sessionId}`);
    }
    
    // Also clear old-style session token for backward compatibility
    res.clearCookie('sessionToken');
  }
  res.redirect('/login');
});

module.exports = router;
