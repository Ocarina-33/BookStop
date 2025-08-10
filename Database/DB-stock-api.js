const database = require('./database');

// 1. Get all short stock books (stock < 50), with pagination
async function getAllShortStockBooks(offset, limit) {
    console.log('Fetching short stock books with offset:', offset, 'limit:', limit);
    const sql = `
        SELECT 
            b.id,
            b.name,
            b.image,
            b.stock,
            b.price,
            b.author_id,
            b.publisher_id,
            a.name as author_name,
            p.name as publisher_name
        FROM book b
        LEFT JOIN author a ON b.author_id = a.id
        LEFT JOIN publisher p ON b.publisher_id = p.id
        WHERE b.stock < 50
        ORDER BY b.name
        OFFSET $1 LIMIT $2
    `;
    const binds = [offset, limit];
    const result = await database.execute(sql, binds);
    console.log('Found', result.rows.length, 'books with low stock');
    return result.rows;
}

// 2. Get count of all books with stock < 50
async function getAllShortStockBooksCount() {
    const sql = `
        SELECT COUNT(*) AS cnt
        FROM book
        WHERE stock < 50
    `;
    return (await database.execute(sql, [])).rows;
}

// 3. Update stock for a specific book
async function updateStock(bookId, stock) {
    const sql = `
        UPDATE book
        SET stock = $1
        WHERE id = $2
    `;
    const binds = [stock, bookId];
    await database.execute(sql, binds);
}

module.exports = {
    getAllShortStockBooks,
    getAllShortStockBooksCount,
    updateStock
};
