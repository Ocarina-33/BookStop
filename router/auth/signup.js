const express = require('express');
const bcrypt = require('bcrypt');
const DB_auth = require('../../Database/DB-auth-api');
const DB_cart = require('../../Database/DB-cart-api');
const authUtils = require('../../utils/auth-utils');

const router = express.Router();

// GET /signup
router.get('/', (req, res) => {
  if (!req.user) {
    res.render('layout', {
      title:  'Sign Up - Bookstore',
      body:   'signup',
      user:   null,
      errors: [],
      form:   {}
    });
  } else {
    res.redirect('/');
  }
});

// POST /signup
router.post('/', async (req, res) => {
  if (!req.user) {
    const { name, email, password, password2 } = req.body;
    const errors = [];

    const existing = await DB_auth.getUserIDByEmail(email);
    if (existing.length > 0) errors.push('Email already registered');
    if (password !== password2)   errors.push('Password confirmation mismatch');
    if (password.length < 6)      errors.push('Password must be at least 6 characters');

    if (errors.length > 0) {
      res.render('layout', {
        title:  'Sign Up - Bookstore',
        body:   'signup',
        user:   null,
        errors,
        form:   { name, email }
      });
    } else {
      const hash = await bcrypt.hash(password, 8);
      await DB_auth.createNewUser({ name, email, password: hash });

      const result = await DB_auth.getLoginInfoByEmail(email);
      const newUserId = result[0].id;
      
      await DB_cart.addNewCart(newUserId);
      
      // Send welcome notification to new user
      const WelcomeVoucherService = require('../../utils/welcome-voucher-service');
      await WelcomeVoucherService.processNewUserRegistration(newUserId);
      
      await authUtils.loginUser(res, newUserId);
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

module.exports = router;
