// libraries
const express = require('express');
//const marked = require('marked');

const router = express.Router({mergeParams : true});

const DB_book = require('../Database/DB-book-api');

const adminAuth = require('../middlewares/auth').adminAuth;
// sub-routers

const loginRouter = require('./Admin/auth/login');
router.use('/login', loginRouter);

// Test route for debugging
router.get('/test', (req, res) => {
    console.log('TEST ROUTE HIT');
    console.log('req.admin:', req.admin);
    console.log('cookies:', req.cookies);
    res.json({ 
        message: 'Admin test route working', 
        admin: !!req.admin,
        adminDetails: req.admin,
        cookies: req.cookies
    });
});

// Debug route to test database queries
router.get('/debug-data', async (req, res) => {
    if(!req.admin) {
        return res.json({ error: 'Not logged in as admin' });
    }
    
    try {
        const DB_admin_stats = require('../Database/DB-admin-stats-api');
        const totalEarnings = await DB_admin_stats.getTotalEarnings();
        const orderStats = await DB_admin_stats.getOrderStats();
        const totalUsers = await DB_admin_stats.getTotalUsers();
        
        res.json({
            success: true,
            data: {
                totalEarnings,
                orderStats,
                totalUsers
            }
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

router.use(adminAuth);

const logoutRouter = require('./Admin/auth/logout');
const bookRouter = require('./Admin/adminBooks/adminBook');
const authorRouter = require('./Admin/adminAuthor/adminAuthor');
const publisherRouter = require('./Admin/adminPublisher/adminPublisher');
const orderRouter = require('./Admin/adminOrder/adminOrder');
const voucherRouter = require('./Admin/adminVoucher/adminVoucher');
const restockRouter = require('./Admin/adminRestock/adminRestock');
const notificationsRouter = require('./Admin/adminNotifications');
const usersRouter = require('./Admin/adminUsers/adminUsers');
// ROUTE: home page
router.get('/', require('./Admin/adminHome'));

// setting up sub-routers
console.log('=== SETTING UP ADMIN SUB-ROUTERS ===');
router.use('/logout', logoutRouter);
router.use('/book', bookRouter);
router.use('/author', authorRouter);
router.use('/publisher', publisherRouter);
router.use('/order', orderRouter);
console.log('=== REGISTERING VOUCHER ROUTER ===');
router.use('/voucher', voucherRouter);
router.use('/restock', restockRouter);
router.use('/notifications', notificationsRouter);
router.use('/users', usersRouter);







module.exports = router;