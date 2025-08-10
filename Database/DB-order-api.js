const database = require('./database');

// Function to create order from cart
async function createOrderFromCart(userId, voucherId, name, phone1, phone2, address, pick) {
    try {
        const sql = `CALL create_order($1, $2, $3, $4, $5, $6, $7);`;
        const binds = [userId, voucherId, name, phone1, phone2, address, pick];
        await database.execute(sql, binds);
        
        // Get the most recent order for this user (the one we just created)
        const orderSql = `
            SELECT book_order.id
            FROM book_order
            JOIN cart ON cart.id = book_order.cart_id AND cart.user_id = $1
            ORDER BY book_order.id DESC
            LIMIT 1;
        `;
        const orderResult = await database.execute(orderSql, [userId]);
        
        // If no order was created, it likely means stock validation failed
        if (!orderResult.rows || orderResult.rows.length === 0) {
            throw new Error('Order creation failed. This may be due to insufficient stock or cart validation issues.');
        }
        
        return orderResult.rows[0];
    } catch (error) {
        // Re-throw the error with more context
        if (error.message.includes('Insufficient stock')) {
            throw error; // Pass through stock errors as-is
        } else {
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }
}

// Get all orders for a user
async function getAllOrderByUserId(userId) {
    const sql = `
        SELECT book_order.*
        FROM book_order
        JOIN cart ON cart.id = book_order.cart_id AND cart.user_id = $1
        ORDER BY book_order.created_at DESC, book_order.id DESC;
    `;
    const binds = [userId];
    return (await database.execute(sql, binds)).rows;
}

// Get all orders by status
async function getAllOrderByStatus(userId, status) {
    const sql = `
        SELECT book_order.*
        FROM book_order
        JOIN cart ON cart.id = book_order.cart_id AND cart.user_id = $1
        WHERE book_order.state = $2
        ORDER BY book_order.created_at DESC, book_order.id DESC;
    `;
    const binds = [userId, status];
    return (await database.execute(sql, binds)).rows;
}

// Get single order by order ID (user scoped) - includes items
async function getOrderById(userId, orderId) {
    const sql = `
        SELECT picked.id as picked_id, picked.cart_id, picked.book_id, picked.amount,
               book.name AS book_name, book.price, book.image, book.isbn,
               author.name AS author_name, book_order.id as order_id, book_order.user_order_number
        FROM book_order
        JOIN cart ON cart.id = book_order.cart_id AND cart.user_id = $1
        JOIN picked ON picked.cart_id = book_order.cart_id
        JOIN book ON book.id = picked.book_id
        JOIN author ON author.id = book.author_id
        WHERE book_order.user_order_number = $2
        ORDER BY picked.id
    `;
    const binds = [userId, orderId];
    return (await database.execute(sql, binds)).rows;
}

// Get single order by order ID with user order number (user scoped)
async function getOrderByIdWithSequentialNumber(userId, orderId) {
    const sql = `
        SELECT book_order.*
        FROM book_order
        JOIN cart ON cart.id = book_order.cart_id AND cart.user_id = $1
        WHERE book_order.id = $2;
    `;
    const binds = [userId, orderId];
    return (await database.execute(sql, binds)).rows;
}

// Admin version — no user check - includes items
async function getOrderByIdAdmin(orderId) {
    const sql = `
        SELECT picked.id as picked_id, picked.cart_id, picked.book_id, picked.amount,
               book.name AS book_name, book.price, book.image, book.isbn,
               author.name AS author_name, book_order.id as order_id, book_order.user_order_number
        FROM book_order
        JOIN picked ON picked.cart_id = book_order.cart_id
        JOIN book ON book.id = picked.book_id
        JOIN author ON author.id = book.author_id
        WHERE book_order.id = $1
        ORDER BY picked.id
    `;
    const binds = [orderId];
    return (await database.execute(sql, binds)).rows;
}

// Get order by cart ID
async function getOrderByCartId(userId, cartId) {
    const sql = `
        SELECT book_order.*
        FROM book_order
        JOIN cart ON cart.id = book_order.cart_id AND cart.user_id = $1
        WHERE book_order.cart_id = $2;
    `;
    const binds = [userId, cartId];
    return (await database.execute(sql, binds)).rows;
}

// Get all incomplete orders (state < 5) - Admin view with global order numbers
async function getAllUncompleteOrder() {
    const sql = `
        SELECT book_order.*, 
               COALESCE(app_user.name, 'Unknown User') as name,
               app_user.id as user_id
        FROM book_order
        LEFT JOIN cart ON cart.id = book_order.cart_id 
        LEFT JOIN app_user ON app_user.id = cart.user_id
        ORDER BY book_order.id ASC;
    `;
    const binds = [];
    return (await database.execute(sql, binds)).rows;
}

// Update order state
async function updateOrderState(orderId, state) {
    const sql = `
        UPDATE book_order
        SET state = $1
        WHERE id = $2;
    `;
    const binds = [state, orderId];
    await database.execute(sql, binds);
    return;
}

// Get all orders by specific status (Admin version) - Global order numbers
async function getAllOrderByStatusAdmin(status) {
    const sql = `
        SELECT book_order.*, 
               COALESCE(app_user.name, 'Unknown User') as name,
               app_user.id as user_id
        FROM book_order
        LEFT JOIN cart ON cart.id = book_order.cart_id 
        LEFT JOIN app_user ON app_user.id = cart.user_id
        WHERE book_order.state = $1
        ORDER BY book_order.id DESC;
    `;
    const binds = [status];
    return (await database.execute(sql, binds)).rows;
}

module.exports = {
    createOrderFromCart,
    getAllOrderByUserId,
    getOrderById,
    getOrderByIdWithSequentialNumber,
    getAllOrderByStatus,
    getAllUncompleteOrder,
    updateOrderState,
    getOrderByIdAdmin,
    getOrderByCartId,
    getAllOrderByStatusAdmin
};
