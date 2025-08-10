// libraries
const express = require('express');
const DB_cart = require('../../Database/DB-cart-api');
const DB_Order = require('../../Database/DB-order-api');
const DB_Notification = require('../../Database/DB-notification-api');
const database = require('../../Database/database');
// creating router
const router = express.Router({mergeParams : true});



router.get('/', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }
    const userId = req.user.id;

    // Get unread notification count
    const unreadCount = await DB_Notification.getUnreadNotificationCount(userId);

    let status = 0
    if(req.query.orderStatus )
        status = req.query.orderStatus;
    let orderItems;

    if( status == 0 || status>7 )
        orderItems = await DB_Order.getAllOrderByUserId(userId);
    else
        orderItems = await DB_Order.getAllOrderByStatus(userId,status);

    res.render('layout.ejs', {
        user:req.user,
        body:['ordersPage'],
        title:'Orders',
        navbar:-1,
        unreadCount: unreadCount,
        _status: status,
        items:orderItems
    });
});

router.get('/track/:id', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }
    
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        
        // Get unread notification count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(userId);
        
        console.log('Tracking order - userId:', userId, 'orderId:', orderId);
        
        if (!orderId || orderId === 'undefined') {
            return res.redirect('/My-section/orders?error=Invalid order ID');
        }
        
        const orderItems = await DB_Order.getOrderById(userId, orderId);
        
        if (!orderItems || orderItems.length === 0) {
            return res.redirect('/My-section/orders?error=Order not found');
        }
        
        // Get order metadata
        const orderSql = `
            SELECT book_order.*
            FROM book_order
            JOIN cart ON cart.id = book_order.cart_id AND cart.user_id = $1
            WHERE book_order.user_order_number = $2
        `;
        const orderMetadata = await database.execute(orderSql, [userId, orderId]);
        
        res.render('layout.ejs', {
            user:req.user,
            body:['orderPage'],
            title:'Order Tracking',
            navbar:-1,
            unreadCount: unreadCount,
            items: orderMetadata.rows[0],
            books: orderItems  // orderItems now contains the actual books with quantities
        });
    } catch (error) {
        console.error('Error tracking order:', error);
        return res.redirect('/My-section/orders?error=Error tracking order');
    }
});

router.get('/delete/:bookID', async (req,res) =>{
    await DB_cart.deleteItemFromCart(req.user.id,req.params.bookID);
    console.log(req.user.id,req.params.bookID);
    return res.redirect('/cart');
});




module.exports = router;