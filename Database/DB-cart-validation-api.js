const database = require('./database');

/**
 * Validate that all items in a cart have sufficient stock available
 * @param {number} cartId - The cart ID to validate
 * @returns {Object} - Validation result with success flag and details
 */
async function validateCartStock(cartId) {
    const sql = `
        SELECT 
            p.book_id,
            p.amount as requested_amount,
            b.stock as available_stock,
            b.name as book_name
        FROM picked p
        JOIN book b ON p.book_id = b.id
        WHERE p.cart_id = $1
    `;
    
    const result = await database.execute(sql, [cartId]);
    const items = result.rows;
    
    const stockIssues = [];
    
    for (const item of items) {
        if (item.requested_amount > item.available_stock) {
            stockIssues.push({
                bookId: item.book_id,
                bookName: item.book_name,
                requested: item.requested_amount,
                available: item.available_stock
            });
        }
    }
    
    return {
        isValid: stockIssues.length === 0,
        stockIssues: stockIssues,
        totalItems: items.length
    };
}

/**
 * Get real-time stock information for all books in a cart
 * @param {number} cartId - The cart ID
 * @returns {Array} - Array of cart items with current stock info
 */
async function getCartWithCurrentStock(cartId) {
    const sql = `
        SELECT 
            p.id as picked_id,
            p.book_id,
            p.amount as cart_amount,
            b.name as book_name,
            b.price,
            b.stock as current_stock,
            b.image,
            a.name as author_name
        FROM picked p
        JOIN book b ON p.book_id = b.id
        LEFT JOIN author a ON b.author_id = a.id
        WHERE p.cart_id = $1
        ORDER BY p.id
    `;
    
    const result = await database.execute(sql, [cartId]);
    return result.rows;
}

/**
 * Remove items from cart that are no longer available (stock = 0)
 * @param {number} cartId - The cart ID to clean
 * @returns {Array} - Array of removed items
 */
async function removeUnavailableItems(cartId) {
    const sql = `
        DELETE FROM picked 
        WHERE cart_id = $1 
        AND book_id IN (
            SELECT id FROM book WHERE stock = 0
        )
        RETURNING book_id
    `;
    
    const result = await database.execute(sql, [cartId]);
    return result.rows;
}

module.exports = {
    validateCartStock,
    getCartWithCurrentStock,
    removeUnavailableItems
};
