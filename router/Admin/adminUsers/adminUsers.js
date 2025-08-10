// libraries
const express = require('express');
// creating router
const router = express.Router({mergeParams : true});

const DB_profile = require('../../../Database/DB-profile-api');

// GET all users
router.get('/', async (req, res) => {
    // Check if admin is logged in
    if (req.admin == null) {
        return res.redirect('/admin/login');
    }
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 25;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';
        
        let users, totalUsers;
        
        if (searchTerm) {
            users = await DB_profile.searchUsers(searchTerm, offset, limit);
            totalUsers = await DB_profile.searchUsersCount(searchTerm);
        } else {
            users = await DB_profile.getAllUsers(offset, limit);
            totalUsers = await DB_profile.getAllUsersCount();
        }
        
        const totalPages = Math.ceil(totalUsers / limit);
        
        res.render('adminLayout.ejs', {
            title: 'User Management',
            page: 'adminUsersAll',
            users: users,
            currentPage: page,
            totalPages: totalPages,
            totalUsers: totalUsers,
            searchTerm: searchTerm,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.redirect('/admin?error=' + encodeURIComponent('Error fetching users'));
    }
});

// GET user details
router.get('/view/:id', async (req, res) => {
    if (req.admin == null) {
        return res.redirect('/admin/login');
    }
    
    try {
        const userId = req.params.id;
        const userDetails = await DB_profile.getUserDetails(userId);
        
        if (userDetails.length === 0) {
            return res.redirect('/admin/users?error=' + encodeURIComponent('User not found'));
        }
        
        res.render('adminLayout.ejs', {
            title: 'User Details',
            page: 'adminUserView',
            user: userDetails[0]
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.redirect('/admin/users?error=' + encodeURIComponent('Error fetching user details'));
    }
});

module.exports = router;
