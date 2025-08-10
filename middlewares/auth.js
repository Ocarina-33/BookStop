const jwt = require('jsonwebtoken');
const DB_auth = require('../Database/DB-auth-api');

function auth(req, res, next) {
  req.user = null;
  res.locals.user = null;

  const token = req.cookies.sessionToken;
  if (!token) return next();

  jwt.verify(token, process.env.APP_SECRET, async (err, decoded) => {
    if (err || !decoded?.id) {
      console.log("ERROR verifying token:", err?.message);
      return next();
    }

    try {
      const results = await DB_auth.getLoginInfoByID(decoded.id);
      if (results && results.length > 0) {
        const user = results[0];
        req.user = {
          id: decoded.id,
          email: user.email,
          name: user.name,
          image: user.image
        };
        res.locals.user = req.user;
      }
    } catch (dbErr) {
      console.error("Auth middleware DB error:", dbErr);
    }

    return next();
  });
}

function adminAuth(req, res, next) {
  req.admin = null;
  res.locals.admin = null;

  const token = req.cookies.adminSessionToken;
  if (!token) return next();

  jwt.verify(token, process.env.APP_SECRET, async (err, decoded) => {
    if (err) {
      console.log("ERROR verifying admin token:", err.message);
      return next();
    }

    const superid = decoded.superid;
    if (superid === 7) {
      req.admin = { NAME: 'Admin' };
      res.locals.admin = req.admin;
    }

    return next();
  });
}

module.exports = {
  auth,
  adminAuth
};

