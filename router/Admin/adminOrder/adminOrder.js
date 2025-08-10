// libraries
const express = require('express');
// creating router
const router = express.Router({mergeParams : true});

const DB_order = require('../../../Database/DB-order-api');
const DB_cart = require('../../../Database/DB-cart-api');
const database = require('../../../Database/database');

router.get('/', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        // Add pagination support for sequential numbering
        let limits = 50;
        let offsetPage = 1;
        if( req.query.page ) offsetPage = req.query.page;
        let offset = (offsetPage-1)*limits;
        
        // Add state filtering
        const state = req.query.state || 'all';
        let orderResult;
        
        if (state === 'all') {
            orderResult = await DB_order.getAllUncompleteOrder();
        } else if (state === 'cancelled') {
            orderResult = await DB_order.getAllOrderByStatusAdmin(6); // Cancelled orders
        } else {
            orderResult = await DB_order.getAllOrderByStatusAdmin(parseInt(state));
        }
        
        res.render('adminLayout.ejs', {
            title:'Orders',
            page:'adminOrderAll',
            orders:orderResult,
            start:offset,
            currentPage:offsetPage,
            pages:Math.ceil(orderResult.length/limits),
            currentState: state
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.render('adminLayout.ejs', {
            title:'Orders',
            page:'adminOrderAll',
            orders:[],
            start:0,
            currentPage:1,
            pages:1,
            currentState: req.query.state || 'all',
            error: 'Error fetching orders'
        });
    }
});
router.get('/:id', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        console.log('Fetching order details for ID:', req.params.id);
        const orderItems = await DB_order.getOrderByIdAdmin(req.params.id);
        
        if (!orderItems || orderItems.length === 0) {
            return res.redirect('/admin/order?error=Order not found');
        }
        
        console.log('Order items found:', orderItems.length);
        
        // Get order metadata
        const orderSql = `SELECT * FROM book_order WHERE id = $1`;
        const orderMetadata = await database.execute(orderSql, [req.params.id]);
        
        res.render('adminLayout.ejs', {
            title:'Order Details',
            page:'adminOrderShow',
            items: orderMetadata.rows[0],
            books: orderItems  // orderItems now contains the actual books with quantities
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        return res.redirect('/admin/order?error=Error fetching order details');
    }
});
router.post('/update', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        console.log('Order update request body:', req.body);
        const {orderId, orderStatus} = req.body;
        
        if (!orderId || !orderStatus) {
            console.log('Missing orderId or orderStatus:', {orderId, orderStatus});
            return res.redirect('/admin/order?error=Missing order ID or status');
        }
        
        console.log('Updating order:', orderId, 'to status:', orderStatus);
        await DB_order.updateOrderState(orderId, orderStatus);
        console.log('Order update successful');
        return res.redirect('/admin/order?success=Order status updated successfully');
    } catch (error) {
        console.error('Error updating order:', error);
        return res.redirect('/admin/order?error=Error updating order status');
    }
});
module.exports = router;