const database = require('./database');

// 1. Get stats for current month
async function getMonthlyStats() {
    const sql = `
        SELECT 
            COALESCE(SUM(p.amount), 0) AS total_books_sold,
            COALESCE(SUM(b.price * p.amount), 0) AS total_earned_money
        FROM picked p
        JOIN book b ON p.book_id = b.id
        JOIN book_order bo ON p.cart_id = bo.cart_id
        WHERE 
            date_trunc('month', p.created_at) = date_trunc('month', CURRENT_DATE)
            AND bo.state = '5'
    `;
    const result = await database.execute(sql, []);
    // Ensure we always return at least one row with default values
    if (result.rows.length === 0 || result.rows[0].total_books_sold === null) {
        return [{ total_books_sold: 0, total_earned_money: 0 }];
    }
    return result.rows;
}

// 2. Get stats for current year
async function getYearlyStats() {
    const sql = `
        SELECT 
            COALESCE(SUM(p.amount), 0) AS total_books_sold,
            COALESCE(SUM(b.price * p.amount), 0) AS total_earned_money
        FROM picked p
        JOIN book b ON p.book_id = b.id
        JOIN book_order bo ON p.cart_id = bo.cart_id
        WHERE 
            date_trunc('year', p.created_at) = date_trunc('year', CURRENT_DATE)
            AND bo.state = '5'
    `;
    const result = await database.execute(sql, []);
    // Ensure we always return at least one row with default values
    if (result.rows.length === 0 || result.rows[0].total_books_sold === null) {
        return [{ total_books_sold: 0, total_earned_money: 0 }];
    }
    return result.rows;
}

// 3. Get last 30 days' earnings (by day)
async function getLastMonthEarnings() {
    const sql = `
        SELECT 
            COALESCE(SUM(b.price * p.amount), 0) AS total_earned,
            TO_CHAR(p.created_at, 'Mon') AS month,
            TO_CHAR(p.created_at, 'DD') AS day
        FROM picked p
        JOIN book b ON p.book_id = b.id
        JOIN book_order bo ON p.cart_id = bo.cart_id
        WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND bo.state = '5'
        GROUP BY TO_CHAR(p.created_at, 'Mon'), TO_CHAR(p.created_at, 'DD'), TO_CHAR(p.created_at, 'MM')
        ORDER BY TO_CHAR(p.created_at, 'MM'), TO_CHAR(p.created_at, 'DD')
    `;
    const result = await database.execute(sql, []);
    return result.rows;
}

// 4. Get last 12 months' earnings (by month)
async function getLastYearEarnings() {
    const sql = `
        SELECT 
            COALESCE(SUM(b.price * p.amount), 0) AS total_earned,
            TO_CHAR(p.created_at, 'Mon') AS month
        FROM picked p
        JOIN book b ON p.book_id = b.id
        JOIN book_order bo ON p.cart_id = bo.cart_id
        WHERE p.created_at >= CURRENT_DATE - INTERVAL '12 months'
            AND bo.state = '5'
        GROUP BY TO_CHAR(p.created_at, 'Mon'), TO_CHAR(p.created_at, 'MM')
        ORDER BY TO_CHAR(p.created_at, 'MM')::int
    `;
    const result = await database.execute(sql, []);
    return result.rows;
}

// 5. Get total earnings (all time)
async function getTotalEarnings() {
    const sql = `
        SELECT 
            COALESCE(SUM(b.price * p.amount), 0) AS total_earnings
        FROM picked p
        JOIN book b ON p.book_id = b.id
        JOIN book_order bo ON p.cart_id = bo.cart_id
        WHERE bo.state = '5'
    `;
    const result = await database.execute(sql, []);
    return result.rows[0] || { total_earnings: 0 };
}

// 6. Get total orders (completed and pending)
async function getOrderStats() {
    const sql = `
        SELECT 
            COUNT(*) AS total_orders,
            COUNT(CASE WHEN state = '5' THEN 1 END) AS completed_orders,
            COUNT(CASE WHEN state IN ('1', '2', '3', '4') THEN 1 END) AS pending_orders,
            COUNT(CASE WHEN state = '4' THEN 1 END) AS pending_deliveries
        FROM book_order
    `;
    const result = await database.execute(sql, []);
    return result.rows[0] || { total_orders: 0, completed_orders: 0, pending_orders: 0, pending_deliveries: 0 };
}

// 7. Get total registered users
async function getTotalUsers() {
    const sql = `SELECT COUNT(*) AS total_users FROM app_user`;
    const result = await database.execute(sql, []);
    return result.rows[0] || { total_users: 0 };
}

// 8. Get inventory stats
async function getInventoryStats() {
    const sql = `
        SELECT 
            COUNT(*) AS total_books,
            COUNT(DISTINCT author_id) AS total_authors,
            COUNT(DISTINCT publisher_id) AS total_publishers,
            COUNT(DISTINCT genre) AS total_genres,
            COUNT(CASE WHEN stock = 0 THEN 1 END) AS out_of_stock_books,
            COUNT(CASE WHEN stock <= 5 AND stock > 0 THEN 1 END) AS low_stock_books
        FROM book
    `;
    const result = await database.execute(sql, []);
    return result.rows[0] || { total_books: 0, total_authors: 0, total_publishers: 0, total_genres: 0, out_of_stock_books: 0, low_stock_books: 0 };
}

// 9. Get most ordered book of all time
async function getMostOrderedBook() {
    const sql = `
        SELECT 
            b.name,
            b.image,
            SUM(p.amount) AS total_ordered
        FROM picked p
        JOIN book b ON p.book_id = b.id
        JOIN book_order bo ON p.cart_id = bo.cart_id
        WHERE bo.state = '5'
        GROUP BY b.id, b.name, b.image
        ORDER BY total_ordered DESC
        LIMIT 1
    `;
    const result = await database.execute(sql, []);
    return result.rows[0] || { name: 'No orders yet', image: '/images/books/defaultbook.jpg', total_ordered: 0 };
}

// 10. Get new orders (pending approval)
async function getNewOrders(limit = 10) {
    const sql = `
        WITH numbered_orders AS (
            SELECT 
                bo.id,
                bo.name AS customer_name,
                bo.phone1,
                bo.total_price,
                bo.created_at,
                bo.state,
                au.id as user_id,
                ROW_NUMBER() OVER (ORDER BY bo.created_at ASC) as order_number
            FROM book_order bo
            LEFT JOIN cart c ON c.id = bo.cart_id
            LEFT JOIN app_user au ON au.id = c.user_id
        )
        SELECT * FROM numbered_orders
        WHERE state IN ('1', '2')
        ORDER BY order_number DESC
        LIMIT $1
    `;
    const result = await database.execute(sql, [limit]);
    return result.rows;
}

// 11. Get recently shipped orders
async function getRecentlyShippedOrders(limit = 10) {
    const sql = `
        WITH numbered_orders AS (
            SELECT 
                bo.id,
                bo.name AS customer_name,
                bo.total_price,
                bo.created_at,
                bo.state,
                au.id as user_id,
                ROW_NUMBER() OVER (ORDER BY bo.created_at ASC) as order_number
            FROM book_order bo
            LEFT JOIN cart c ON c.id = bo.cart_id
            LEFT JOIN app_user au ON au.id = c.user_id
        )
        SELECT * FROM numbered_orders
        WHERE state = '4'
        ORDER BY order_number DESC
        LIMIT $1
    `;
    const result = await database.execute(sql, [limit]);
    return result.rows;
}

// 12. Get cancelled orders
async function getCancelledOrders(limit = 10) {
    const sql = `
        WITH numbered_orders AS (
            SELECT 
                bo.id,
                bo.name AS customer_name,
                bo.total_price,
                bo.created_at,
                bo.state,
                au.id as user_id,
                ROW_NUMBER() OVER (ORDER BY bo.created_at ASC) as order_number
            FROM book_order bo
            LEFT JOIN cart c ON c.id = bo.cart_id
            LEFT JOIN app_user au ON au.id = c.user_id
        )
        SELECT * FROM numbered_orders
        WHERE state = '6'
        ORDER BY order_number DESC
        LIMIT $1
    `;
    const result = await database.execute(sql, [limit]);
    return result.rows;
}

// 13. Get daily order count for last 30 days
async function getDailyOrderCount() {
    const sql = `
        SELECT 
            DATE(created_at) AS order_date,
            COUNT(*) AS order_count
        FROM book_order
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY order_date
    `;
    const result = await database.execute(sql, []);
    return result.rows;
}

// 14. Get top 5 bestselling books
async function getTopBestsellingBooks(limit = 5) {
    const sql = `
        SELECT 
            b.name,
            b.image,
            b.price,
            SUM(p.amount) AS total_sold
        FROM picked p
        JOIN book b ON p.book_id = b.id
        JOIN book_order bo ON p.cart_id = bo.cart_id
        WHERE bo.state = '5'
        GROUP BY b.id, b.name, b.image, b.price
        ORDER BY total_sold DESC
        LIMIT $1
    `;
    const result = await database.execute(sql, [limit]);
    return result.rows;
}

// 15. Get books with low stock
async function getLowStockBooks(threshold = 5) {
    const sql = `
        SELECT 
            b.name,
            b.image,
            b.stock,
            b.price
        FROM book b
        WHERE b.stock <= $1 AND b.stock > 0
        ORDER BY b.stock ASC
        LIMIT 10
    `;
    const result = await database.execute(sql, [threshold]);
    return result.rows;
}

// 15b. Get books that are completely out of stock
async function getOutOfStockBooks(limit = 10) {
    const sql = `
        SELECT 
            b.id,
            b.name,
            b.image,
            b.stock,
            b.price
        FROM book b
        WHERE b.stock = 0
        ORDER BY b.name ASC
        LIMIT $1
    `;
    const result = await database.execute(sql, [limit]);
    return result.rows;
}

// 16. Get recent user signups
async function getRecentSignups(days = 7, limit = 10) {
    const sql = `
        SELECT 
            name,
            email,
            id AS user_id
        FROM app_user
        ORDER BY id DESC
        LIMIT $1
    `;
    const result = await database.execute(sql, [limit]);
    return result.rows;
}

// 17. Get recent payments
async function getRecentPayments(limit = 10) {
    const sql = `
        WITH numbered_orders AS (
            SELECT 
                bo.id AS order_id,
                bo.name AS customer_name,
                bo.total_price,
                bo.created_at AS payment_date,
                au.id as user_id,
                bo.state,
                ROW_NUMBER() OVER (ORDER BY bo.created_at ASC) as order_number
            FROM book_order bo
            LEFT JOIN cart c ON c.id = bo.cart_id
            LEFT JOIN app_user au ON au.id = c.user_id
        )
        SELECT * FROM numbered_orders
        WHERE state = '5'
        ORDER BY order_number DESC
        LIMIT $1
    `;
    const result = await database.execute(sql, [limit]);
    return result.rows;
}

module.exports = {
    getMonthlyStats,
    getYearlyStats,
    getLastMonthEarnings,
    getLastYearEarnings,
    getTotalEarnings,
    getOrderStats,
    getTotalUsers,
    getInventoryStats,
    getMostOrderedBook,
    getNewOrders,
    getRecentlyShippedOrders,
    getCancelledOrders,
    getDailyOrderCount,
    getTopBestsellingBooks,
    getLowStockBooks,
    getOutOfStockBooks,
    getRecentSignups,
    getRecentPayments
};
