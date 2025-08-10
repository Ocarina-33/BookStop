const database = require('./database');

// --- Voucher functions ---
async function getVoucherByName(name) {
    const sql = `
        SELECT *
        FROM voucher
        WHERE name = $1
    `;
    const binds = [name];
    return (await database.execute(sql, binds)).rows;
}

async function getVoucherById(id) {
    const sql = `
        SELECT 
            id, name, discount, cap, to_char(validity, 'YYYY-MM-DD') AS validity
        FROM voucher
        WHERE id = $1
    `;
    const binds = [id];
    return (await database.execute(sql, binds)).rows;
}

async function createVoucher(name, discount, validity, cap) {
    const sql = `
        INSERT INTO voucher(name, discount, validity, cap)
        VALUES (UPPER($1), $2, $3::date, $4)
    `;
    const binds = [name, discount, validity, cap];
    await database.execute(sql, binds);
    return;
}

async function getAllVoucher() {
    const sql = `
        SELECT id, name, discount, cap, to_char(validity, 'YYYY-MM-DD') AS validity
        FROM voucher
    `;
    return (await database.execute(sql)).rows;
}

async function updateVoucher(id, name, discount, validity, cap) {
    const sql = `
        UPDATE voucher
        SET name = $2, discount = $3, validity = $4::date, cap = $5
        WHERE id = $1
    `;
    const binds = [id, name, discount, validity, cap];
    await database.execute(sql, binds);
    return;
}

// --- Wishlist functions ---
async function hasAdded(userId, bookId) {
    userId = Number(userId);
    bookId = Number(bookId);
    const sql = `SELECT 1 FROM wish_list WHERE user_id = $1 AND book_id = $2`;
    const binds = [userId, bookId];
    const result = await database.execute(sql, binds);
    return result.rows.length > 0;
}

async function addToWishlist(userId, bookId) {
    userId = Number(userId);
    bookId = Number(bookId);
    const sql = `INSERT INTO wish_list(user_id, book_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`;
    const binds = [userId, bookId];
    await database.execute(sql, binds);
}

async function removeFromList(userId, bookId) {
    userId = Number(userId);
    bookId = Number(bookId);
    const sql = `DELETE FROM wish_list WHERE user_id = $1 AND book_id = $2`;
    const binds = [userId, bookId];
    await database.execute(sql, binds);
}

async function getAllByUser(userId) {
    userId = Number(userId);
    const sql = `
        SELECT 
            b.id AS book_id, 
            b.name AS book_name, 
            b.price, 
            b.image,
            a.name AS author_name,
            p.name AS publisher_name
        FROM wish_list w
        JOIN book b ON w.book_id = b.id
        LEFT JOIN author a ON b.author_id = a.id
        LEFT JOIN publisher p ON b.publisher_id = p.id
        WHERE w.user_id = $1
        ORDER BY b.name
    `;
    const binds = [userId];
    return (await database.execute(sql, binds)).rows;
}

module.exports = {
    getVoucherByName,
    getVoucherById,
    createVoucher,
    getAllVoucher,
    updateVoucher,
    hasAdded,
    addToWishlist,
    removeFromList,
    getAllByUser
};
