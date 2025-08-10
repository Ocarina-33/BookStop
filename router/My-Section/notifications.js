// libraries
const express = require('express');
const DB_Notification = require('../../Database/DB-notification-api');

// creating router
const router = express.Router({mergeParams : true});

// Route for notifications page
router.get('/', async (req, res) =>{
    if(req.user === null){
        return res.redirect('/login');
    }
    
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        
        // Get notifications
        const notifications = await DB_Notification.getUserNotifications(userId, limit, offset);
        
        // Get unread count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(userId);
        
        // Get user's available vouchers
        const availableVouchers = await DB_Notification.getUserAvailableVouchers(userId);
        
        res.render('layout.ejs', {
            user: req.user,
            body: ['notificationsPage'],
            title: 'Notifications',
            navbar: -1,
            notifications: notifications,
            unreadCount: unreadCount,
            availableVouchers: availableVouchers,
            currentPage: page,
            hasMore: notifications.length === limit
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Mark notification as read
router.post('/mark-read/:id', async (req, res) => {
    if(req.user === null){
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        
        await DB_Notification.markNotificationAsRead(notificationId, userId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Mark all notifications as read
router.post('/mark-all-read', async (req, res) => {
    if(req.user === null){
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    try {
        const userId = req.user.id;
        
        await DB_Notification.markAllNotificationsAsRead(userId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    if(req.user === null){
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        
        await DB_Notification.deleteNotification(notificationId, userId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Get unread count (for navbar badge)
router.get('/unread-count', async (req, res) => {
    if(req.user === null){
        return res.json({ count: 0 });
    }
    
    try {
        const userId = req.user.id;
        const count = await DB_Notification.getUnreadNotificationCount(userId);
        
        res.json({ count: count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.json({ count: 0 });
    }
});

// Get user's available vouchers
router.get('/vouchers', async (req, res) => {
    if(req.user === null){
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    try {
        const userId = req.user.id;
        const vouchers = await DB_Notification.getUserAvailableVouchers(userId);
        
        res.json({ success: true, vouchers: vouchers });
    } catch (error) {
        console.error('Error getting user vouchers:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
