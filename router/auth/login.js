const express = require('express');
const bcrypt = require('bcrypt');
const DB_auth = require('../../Database/DB-auth-api');
const authUtils = require('../../utils/auth-utils');

const router = express.Router();

// GET /login
router.get('/', (req, res) => {
  if (!req.user) {
    res.render('layout', {
      title:  'Login - Bookstore',
      body:   'login',
      user:   null,
      form:   { email: '', password: '' },
      errors: []
    });
  } else {
    res.redirect('/');
  }
});

// POST /login
router.post('/', async (req, res) => {
  if (!req.user) {
    const { email, password } = req.body;
    const errors = [];
    
    console.log(`\n=== LOGIN ATTEMPT ===`);
    console.log(`Email: ${email}`);
    console.log(`User-Agent: ${req.headers['user-agent']}`);
    console.log(`Existing user in session: ${req.user ? req.user.email : 'None'}`);
    
    const results = await DB_auth.getLoginInfoByEmail(email);

    if (results.length === 0) {
      errors.push('No such user found');
      console.log(`❌ User not found: ${email}`);
    } else {
      const match = await bcrypt.compare(password, results[0].password);
      if (match) {
        console.log(`✅ Login successful for: ${results[0].name} (${email}) - ID: ${results[0].id}`);
        await authUtils.loginUser(res, results[0].id, req);
        console.log(`🍪 Session token created for user ID: ${results[0].id}`);
      } else {
        errors.push('Wrong password');
        console.log(`❌ Wrong password for: ${email}`);
      }
    }

    if (errors.length > 0) {
      res.render('layout', {
        title:  'Login - Bookstore',
        body:   'login',
        user:   null,
        errors,
        form:   { email, password }
      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

module.exports = router;
