const express = require('express');
const router = express.Router();
const DB_cart = require('../../Database/DB-cart-api');
const DB_order = require('../../Database/DB-order-api');
const DB_book = require('../../Database/DB-book-api');
const database = require('../../Database/database');
const DB_Notification = require('../../Database/DB-notification-api');

// GET /cart
router.get('/', async (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  try {
    // Auto-create cart if user doesn't have one
    const userResult = await DB_cart.getUserCart(req.user.id);
    if (userResult.length === 0 || !userResult[0].cart_id) {
      await DB_cart.addNewCart(req.user.id);
    }
    
    const items = await DB_cart.getItemsInCart(req.user.id);
    let total = { price: 0, item: 0 };
    if (userResult.length > 0 && userResult[0].cart_id) {
      const totalResult = await DB_cart.getTotalPriceAndItem(userResult[0].cart_id);
      total = totalResult.length > 0 ? totalResult[0] : { price: 0, item: 0 };
    }
    
    // Get unread notification count
    const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
    
    res.render('layout', {
      title: 'Your Cart - Bookstore',
      body:  'cartPage',
      user:  req.user,
      items,
      total,
      unreadCount: unreadCount,
      navbar: -1
    });
  } catch (err) {
    next(err);
  }
});

// POST /cart/remove - must come before /:bookId route
router.post('/remove', async (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  try {
    await DB_cart.deleteItemFromCart(req.user.id, req.body.bookId);
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
});

// POST /cart/add
router.post('/add', async (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  try {
    // Auto-create cart if user doesn't have one
    const userResult = await DB_cart.getUserCart(req.user.id);
    if (userResult.length === 0 || !userResult[0].cart_id) {
      await DB_cart.addNewCart(req.user.id);
    }
    
    await DB_cart.addToCart(req.user.id, req.body.bookId, 1);
    res.redirect('/cart');
  } catch (err) {
    // Check if it's a stock-related error
    if (err.message.includes('out of stock') || err.message.includes('Book not found')) {
      // Redirect back to the book page with an error message
      return res.redirect(`/books/${req.body.bookId}?error=${encodeURIComponent(err.message)}`);
    }
    next(err);
  }
});

// POST /cart/update - Update cart item quantities
router.post('/update', async (req, res, next) => {
  console.log('=== CART UPDATE REQUEST ===');
  console.log('User ID:', req.user?.id);
  console.log('Request body:', req.body);
  
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const items = JSON.parse(req.body.items);
    console.log('Parsed items:', items);
    
    // Validate stock availability for each item before updating
    for (const item of items) {
      // Get current stock for this book
      const bookDetails = await DB_book.getBookByID(item.book_id);
      
      if (!bookDetails || bookDetails.length === 0) {
        return res.status(400).json({ error: `Book not found` });
      }
      
      const currentStock = bookDetails[0].stock;
      
      // Check if requested amount exceeds available stock
      if (item.amount > currentStock) {
        return res.status(400).json({ 
          error: `Insufficient stock. Only ${currentStock} units available for this item.`,
          bookId: item.book_id,
          availableStock: currentStock
        });
      }
      
      // Update the cart item amount
      await DB_cart.updateAmount(item.id, item.amount);
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Cart update error:', err);
    res.status(500).json({ error: 'Update failed: ' + err.message });
  }
});

// GET /cart/validate - Validate cart stock before checkout
router.get('/validate', async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const userResult = await DB_cart.getUserCart(req.user.id);
    if (userResult.length === 0 || !userResult[0].cart_id) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const DB_cartValidation = require('../../Database/DB-cart-validation-api');
    const validation = await DB_cartValidation.validateCartStock(userResult[0].cart_id);
    
    if (!validation.isValid) {
      return res.status(409).json({
        error: 'Stock validation failed',
        stockIssues: validation.stockIssues
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'All items are available',
      totalItems: validation.totalItems 
    });
  } catch (err) {
    console.error('Cart validation error:', err);
    res.status(500).json({ error: 'Validation failed: ' + err.message });
  }
});

// GET /cart/ship - Show order placement form
router.get('/ship', async (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  try {
    const userResult = await DB_cart.getUserCart(req.user.id);
    if (userResult.length === 0 || !userResult[0].cart_id) {
      return res.redirect('/cart');
    }
    
    const cartId = userResult[0].cart_id;
    const total = await DB_cart.getTotalPriceAndItem(cartId);
    
    if (!total || total.length === 0 || total[0].item === 0) {
      return res.redirect('/cart');
    }
    
    // Get unread notification count
    const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
    
    res.render('layout', {
      title: 'Place Order - Bookstore',
      body: 'placeOrder',
      user: req.user,
      cart: {
        cartId: cartId,
        price: total[0].price,
        item: total[0].item
      },
      unreadCount: unreadCount,
      navbar: -1,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    next(err);
  }
});

// POST /cart/confirmOrder - Create order from cart
router.post('/confirmOrder', async (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  try {
    const { voucherId, name, phone1, phone2, address, pick } = req.body;
    
    console.log('Order creation attempt:', {
      userId: req.user.id,
      voucherId,
      name,
      phone1,
      phone2,
      address,
      pick
    });
    
    // Validate required fields
    if (!name || !phone1 || !address) {
      console.log('Missing required fields:', { name, phone1, address });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user has items in cart
    const userResult = await DB_cart.getUserCart(req.user.id);
    if (userResult.length === 0 || !userResult[0].cart_id) {
      console.log('No cart found for user:', req.user.id);
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const cartId = userResult[0].cart_id;
    const cartItems = await DB_cart.getItemsInCart(req.user.id);
    if (!cartItems || cartItems.length === 0) {
      console.log('Cart is empty for user:', req.user.id);
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    console.log('Cart items found:', cartItems.length);

    // Handle voucherId properly - convert empty string to null, and string numbers to integers
    let voucher = null;
    if (voucherId && voucherId.trim() !== '') {
      voucher = parseInt(voucherId, 10);
      if (isNaN(voucher)) {
        voucher = null;
      }
    }
    
    const alternatePhone = phone2 || null;
    const pickupLocation = parseInt(pick, 10) || 1;
    
    // Get cart total before creating order
    const totalResult = await DB_cart.getTotalPriceAndItem(cartId);
    const orderAmount = totalResult[0]?.price || 0;
    
    console.log('Cart total:', orderAmount);
    
    console.log('Creating order with params:', {
      userId: req.user.id,
      voucher,
      name,
      phone1,
      alternatePhone,
      address,
      pickupLocation
    });
    
    try {
      const orderResult = await DB_order.createOrderFromCart(
        req.user.id,
        voucher,
        name,
        phone1,
        alternatePhone,
        address,
        pickupLocation
      );
      
      console.log('Order creation result:', orderResult);
      
      // Check if order was actually created
      if (!orderResult || !orderResult.id) {
        console.log('Order creation failed - no order ID returned');
        return res.status(400).json({ error: 'Failed to create order. This may be due to insufficient stock or cart validation issues.' });
      }
      
      // Get the created order ID
      const orderId = orderResult.id;
      
      console.log('Order created successfully with ID:', orderId);
      
      // Process welcome voucher for first-time buyers and send notifications
      const WelcomeVoucherService = require('../../utils/welcome-voucher-service');
      try {
        await WelcomeVoucherService.processFirstTimeBuyer(req.user.id, orderId, orderAmount);
        await WelcomeVoucherService.sendOrderConfirmationNotification(req.user.id, orderId, orderAmount);
      } catch (voucherError) {
        console.log('Welcome voucher service error (non-critical):', voucherError.message);
      }
      
      res.redirect('/My-section/orders?success=Order placed successfully');
      
    } catch (orderError) {
      console.error('Error creating order:', orderError);
      
      // Check if it's a stock-related error
      if (orderError.message && orderError.message.includes('Insufficient stock')) {
        // Check if this is an AJAX request
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return res.status(400).json({ 
            error: 'Sorry, one or more items in your cart are no longer available in the requested quantity. Please refresh your cart and try again.' 
          });
        } else {
          // For form submissions, redirect with error message
          return res.redirect('/cart/ship?error=' + encodeURIComponent('Sorry, one or more items in your cart are no longer available in the requested quantity. Please refresh your cart and try again.'));
        }
      }
      
      // Generic error for other issues
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ 
          error: 'Failed to create order. Please try again or contact support if the problem persists.' 
        });
      } else {
        return res.redirect('/cart/ship?error=' + encodeURIComponent('Failed to create order. Please try again or contact support if the problem persists.'));
      }
    }
  } catch (err) {
    console.error('General error in order process:', err);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ error: 'An unexpected error occurred: ' + err.message });
    } else {
      res.redirect('/cart/ship?error=' + encodeURIComponent('An unexpected error occurred. Please try again.'));
    }
  }
});

// GET /cart/voucher/:name - Check voucher validity
router.get('/voucher/:name', async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const DB_voucher = require('../../Database/DB-voucher-api');
    const voucherResult = await DB_voucher.getVoucherByName(req.params.name);
    
    if (voucherResult.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }
    
    const voucher = voucherResult[0];
    const today = new Date();
    const voucherDate = new Date(voucher.validity);
    
    if (voucherDate < today) {
      return res.status(400).json({ error: 'Voucher has expired' });
    }
    
    res.json({
      voucherId: voucher.id,
      discount: voucher.discount,
      cap: voucher.cap,
      name: voucher.name
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check voucher' });
  }
});

// POST /cart/:bookId - for AJAX calls from book pages (dynamic route must come last)
router.post('/:bookId', async (req, res, next) => {
  console.log('📝 Cart POST request - User:', req.user?.id, 'Book ID:', req.params.bookId);
  
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    // Auto-create cart if user doesn't have one
    const userResult = await DB_cart.getUserCart(req.user.id);
    console.log('📝 User cart result:', userResult);
    
    if (userResult.length === 0 || !userResult[0].cart_id) {
      console.log('📝 Creating new cart for user');
      await DB_cart.addNewCart(req.user.id);
    }
    
    // Check if this book is already in the user's cart
    const checkExistingSql = `
      SELECT picked.id, picked.amount 
      FROM picked 
      JOIN app_user ON app_user.cart_id = picked.cart_id 
      WHERE app_user.id = $1 AND picked.book_id = $2
    `;
    const existingResult = await database.execute(checkExistingSql, [req.user.id, req.params.bookId]);
    console.log('📝 Existing book check result:', existingResult.rows);
    
    if (existingResult.rows.length > 0) {
      // Book already exists in cart - return 409 to indicate "already in cart"
      console.log('📝 Book already in cart, returning 409');
      return res.status(409).json({ error: 'Already added in cart' });
    }
    
    // Get quantity from request body (for book page quantity selector)
    const quantity = parseInt(req.body.quantity) || 1;
    console.log('📝 Adding book to cart with quantity:', quantity);
    
    // Add to cart with specified quantity
    await DB_cart.addToCart(req.user.id, req.params.bookId, quantity);
    console.log('📝 Book added successfully');
    res.status(200).json({ success: true });
  } catch (err) {
    console.log('📝 Error in cart route:', err.message);
    // Check if it's a stock-related error
    if (err.message.includes('out of stock') || err.message.includes('Book not found')) {
      return res.status(400).json({ error: err.message });
    }
    console.log('📝 Passing error to next middleware');
    next(err);
  }
});

module.exports = router;
