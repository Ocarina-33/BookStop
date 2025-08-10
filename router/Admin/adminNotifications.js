// libraries
const express = require('express');
const DB_Notification = require('../../Database/DB-notification-api');
const DB_Voucher = require('../../Database/DB-voucher-api');

// creating router
const router = express.Router({mergeParams : true});

// Route for notification management page
router.get('/', async (req, res) =>{
    try {
        // Get notification statistics
        const stats = await DB_Notification.getNotificationStats();
        
        // Get all vouchers for dropdown
        const vouchers = await DB_Voucher.getAllVoucher();
        
        // Get all users for voucher distribution
        const users = await DB_Notification.getAllUsersForVoucherDistribution();
        
        res.render('adminLayout.ejs', {
            body: ['adminNotifications'],
            title: 'Notification Management',
            stats: stats,
            vouchers: vouchers,
            users: users,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error fetching notification data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Send voucher to selected users
router.post('/send-voucher', async (req, res) => {
    try {
        const { voucherId, userIds, title, message } = req.body;
        
        if (!voucherId || !userIds || !title || !message) {
            return res.status(400).json({ error: 'Please fill all required fields' });
        }
        
        // Parse userIds if it's a string
        let selectedUserIds = Array.isArray(userIds) ? userIds : [userIds];
        selectedUserIds = selectedUserIds.map(id => parseInt(id));
        
        // Send voucher to selected users
        await DB_Notification.sendVoucherToUsers(selectedUserIds, voucherId, title, message);
        
        // If it's a JSON request, return JSON response
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ success: true, message: `Voucher sent to ${selectedUserIds.length} user(s)` });
        }
        
        // Otherwise redirect (for form submissions)
        res.redirect('/admin/notifications?success=' + encodeURIComponent(`Voucher sent to ${selectedUserIds.length} user(s) successfully!`));
    } catch (error) {
        console.error('Error sending voucher:', error);
        
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(500).json({ error: 'Failed to send voucher' });
        }
        
        res.redirect('/admin/notifications?error=' + encodeURIComponent('Failed to send voucher. Please try again.'));
    }
});

// API endpoint to get users for voucher distribution
router.get('/api/users', async (req, res) => {
    console.log('=== API USERS ROUTE HIT ===');
    console.log('Request headers:', req.headers.cookie);
    console.log('Admin object:', req.admin);
    
    try {
        console.log('Fetching users from database...');
        const { criteria } = req.query;
        let users = await DB_Notification.getAllUsersForVoucherDistribution();
        console.log('Users fetched from DB:', users.length);
        
        if (criteria === 'first-time') {
            users = users.filter(user => user.total_orders === 0 || user.total_orders === '0');
        } else if (criteria === 'regular') {
            users = users.filter(user => parseInt(user.total_orders) > 0);
        } else if (criteria === 'high-value') {
            users = users.filter(user => parseFloat(user.total_spent || 0) > 1000);
        }
        
        console.log('Filtered users:', users.length);
        res.json(users);
        
        // Original code (commented out for testing)
        /*
        console.log('Fetching users for voucher distribution...');
        const { criteria } = req.query;
        let users = await DB_Notification.getAllUsersForVoucherDistribution();
        console.log('Users fetched:', users.length);
        
        if (criteria === 'first-time') {
            users = users.filter(user => user.total_orders === 0 || user.total_orders === '0');
        } else if (criteria === 'regular') {
            users = users.filter(user => parseInt(user.total_orders) > 0);
        } else if (criteria === 'high-value') {
            users = users.filter(user => parseFloat(user.total_spent || 0) > 1000);
        }
        
        res.json(users);
        */
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Original send voucher route (keeping for backward compatibility)
router.post('/send-voucher-form', async (req, res) => {
    try {
        const { voucherId, userIds, title, message } = req.body;
        
        if (!voucherId || !userIds || !title || !message) {
            return res.redirect('/admin/notifications?error=Please fill all required fields');
        }
        
        // Parse userIds if it's a string
        let selectedUserIds = Array.isArray(userIds) ? userIds : [userIds];
        selectedUserIds = selectedUserIds.map(id => parseInt(id));
        
        // Send voucher to selected users
        await DB_Notification.sendVoucherToUsers(selectedUserIds, voucherId, title, message);
        
        res.redirect(`/admin/notifications?success=Voucher sent to ${selectedUserIds.length} user(s) successfully`);
    } catch (error) {
        console.error('Error sending voucher:', error);
        res.redirect('/admin/notifications?error=Error sending voucher');
    }
});

// Send welcome voucher to all users who haven't received one
router.post('/send-welcome-vouchers', async (req, res) => {
    try {
        const { voucherId, title, message } = req.body;
        
        if (!voucherId || !title || !message) {
            return res.redirect('/admin/notifications?error=Please fill all required fields');
        }
        
        // Get all users who haven't received welcome voucher
        const users = await DB_Notification.getAllUsersForVoucherDistribution();
        const eligibleUsers = [];
        
        for (const user of users) {
            const welcomeSent = await DB_Notification.wasWelcomeVoucherSent(user.id);
            if (!welcomeSent) {
                eligibleUsers.push(user.id);
            }
        }
        
        if (eligibleUsers.length === 0) {
            return res.redirect('/admin/notifications?error=No eligible users found for welcome vouchers');
        }
        
        // Send welcome vouchers
        await DB_Notification.sendVoucherToUsers(eligibleUsers, voucherId, title, message);
        
        // Mark welcome vouchers as sent
        for (const userId of eligibleUsers) {
            await DB_Notification.markWelcomeVoucherSent(userId);
        }
        
        res.redirect(`/admin/notifications?success=Welcome vouchers sent to ${eligibleUsers.length} user(s) successfully`);
    } catch (error) {
        console.error('Error sending welcome vouchers:', error);
        res.redirect('/admin/notifications?error=Error sending welcome vouchers');
    }
});

module.exports = router;
