// // libraries
// const express = require('express');
// const DB_profile = require('../../Database/DB-profile-api');

// // creating router
// const router = express.Router({mergeParams : true});



// router.get('/', async (req, res) =>{
//     // if logged in, delete token from database
//     if(req.user === null){
//         return res.redirect('/login');
//     }
//     const userId = req.user.id;

//     const profileResult = await DB_profile.getProfile(userId);
//     res.render('layout.ejs', {
//         body:['profile'],
//         title:'Profile',
//         navbar:-1,
//         user:profileResult[0]
//     });
// });

// router.get('/edit', async (req, res) =>{
//     // if logged in, delete token from database
//     if(req.user === null){
//         return res.redirect('/login');
//     }
//     const userId = req.user.id;
//     const profileResult = await DB_profile.getProfile(userId);
//     res.render('layout.ejs', {
//         body:['profileEdit'],
//         title:'Profile',
//         navbar:-1,
//         user:profileResult[0]
//     });
// });

// router.post('/', async (req, res) =>{
//     // if logged in, delete token from database
//     if(req.user === null){
//         return res.redirect('/login');
//     }
//     const userId = req.user.id;

//     console.log(req.body);
//     const {name,dob,phone,email,image} = req.body;
//     const updateResult = await DB_profile.updateProfile(req.user.id,name,dob,phone,image);
//     return res.redirect('/my-section/profile');
//     res.render('layout.ejs', {
//         user:req.user,
//         body:['profile'],
//         title:'Profile',
//         navbar:-1
//     });
// });




// module.exports = router;

// routes/my-section/profile.js

const express = require('express');
const router = express.Router({ mergeParams: true });
const DB_profile = require('../../Database/DB-profile-api');
const DB_Notification = require('../../Database/DB-notification-api');

// GET profile page
router.get('/', async (req, res) => {
  console.log("req.user in /profile route:", req.user);
  console.log("Logged in user:", req.user);

  if (!req.user) {
    return res.redirect('/login');
  }

  const userId = req.user.id;
  const profileResult = await DB_profile.getProfile(userId);
  
  // Get unread notification count
  const unreadCount = await DB_Notification.getUnreadNotificationCount(userId);
  console.log('Profile route - unreadCount for user', userId, ':', unreadCount);

  res.render('layout.ejs', {
    body: ['profile'],
    title: 'Profile',
    navbar: -1,
    unreadCount: unreadCount,
    user: profileResult[0] // optional if you use res.locals.user in EJS
  });
});

// GET profile edit page
router.get('/edit', async (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  const userId = req.user.id;
  const profileResult = await DB_profile.getProfile(userId);
  
  // Get unread notification count
  const unreadCount = await DB_Notification.getUnreadNotificationCount(userId);

  res.render('layout.ejs', {
    body: ['profileEdit'],
    title: 'Edit Profile',
    navbar: -1,
    unreadCount: unreadCount,
    user: profileResult[0]
  });
});

// POST update profile
router.post('/', async (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  const userId = req.user.id;
  const { name, dob, phone, email, image } = req.body;

  console.log("Profile update form data:", req.body);

  await DB_profile.updateProfile(userId, name, dob, phone, image);

  return res.redirect('/My-section/profile');
});

module.exports = router;
