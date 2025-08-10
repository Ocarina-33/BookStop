const database = require('./database');

async function insertReview(userId, bookId, star, review) {
    const sql = `
        CALL review_book($1, $2, $3, $4);
    `;
    const binds = [bookId, userId, star, review];
    await database.execute(sql, binds);
    return;
}

async function editReview(userId, bookId, reviewId, star, review) {
    const sql = `
        UPDATE rates
        SET review = $1, stars = $2
        WHERE user_id = $3 AND id = $4 AND book_id = $5
    `;
    const binds = [review, star, userId, reviewId, bookId];
    await database.execute(sql, binds);
    return;
}

async function getAllReviewsByBook(bookId) {
    const sql = `
        SELECT 
            rates.id, rates.review AS "REVIEW", rates.stars AS "STARS", 
            rates.created_at AS "CREATED_AT", rates.user_id,
            app_user.name AS "NAME", app_user.image AS "IMAGE"
        FROM 
            rates
        JOIN app_user ON rates.user_id = app_user.id
        WHERE 
            book_id = $1
        ORDER BY rates.created_at DESC
    `;
    const binds = [bookId];
    const result = await database.execute(sql, binds);
    return result.rows;
}

async function getAllReviewsByUser(userId) {
    const sql = `
        SELECT 
            rates.*,
            book.id AS book_id, book.name AS book_name, book.image,
            author.name AS author_name
        FROM 
            rates
        JOIN book ON book.id = rates.book_id
        JOIN author ON author.id = book.author_id
        WHERE 
            user_id = $1
    `;
    const binds = [userId];
    const result = await database.execute(sql, binds);
    return result.rows;
}

async function getAllUnreviewedBooksByUser(userId) {
    const sql = `
        SELECT DISTINCT
            book.id AS "BOOK_ID", book.name AS "BOOK_NAME", book.image AS "IMAGE",
            author.name AS "AUTHOR_NAME"
        FROM book
        JOIN author ON book.author_id = author.id
        JOIN picked ON picked.book_id = book.id
        JOIN cart ON cart.id = picked.cart_id AND cart.user_id = $1
        JOIN book_order ON book_order.cart_id = cart.id AND book_order.state = '5'

        EXCEPT

        SELECT
            book.id AS "BOOK_ID", book.name AS "BOOK_NAME", book.image AS "IMAGE",
            author.name AS "AUTHOR_NAME"
        FROM rates
        JOIN book ON book.id = rates.book_id
        JOIN author ON author.id = book.author_id
        WHERE user_id = $1
    `;
    const binds = [userId];
    const result = await database.execute(sql, binds);
    return result.rows;
}

async function hasBookOrdered(userId, bookId) {
    console.log('hasBookOrdered - userId:', userId, 'type:', typeof userId);
    console.log('hasBookOrdered - bookId:', bookId, 'type:', typeof bookId);
    
    userId = Number(userId);
    bookId = Number(bookId);
    
    console.log('hasBookOrdered - After conversion - userId:', userId, 'type:', typeof userId);
    console.log('hasBookOrdered - After conversion - bookId:', bookId, 'type:', typeof bookId);
    
    const sql = `
        SELECT picked.id FROM picked
        JOIN cart ON cart.id = picked.cart_id AND cart.user_id = $1
        JOIN book_order ON book_order.cart_id = cart.id AND book_order.state = '5'
        WHERE book_id = $2
    `;
    const binds = [userId, bookId];
    console.log('hasBookOrdered - SQL binds:', binds, 'types:', binds.map(b => typeof b));
    
    const result = await database.execute(sql, binds);
    return result.rows.length > 0;
}

async function hasReviewedBook(userId, bookId) {
    userId = Number(userId);
    bookId = Number(bookId);
    
    const sql = `
        SELECT * FROM rates
        WHERE user_id = $1 AND book_id = $2
    `;
    const binds = [userId, bookId];
    const result = await database.execute(sql, binds);
    return result.rows.length > 0;
}

module.exports = {
    insertReview,
    editReview,
    getAllReviewsByBook,
    getAllReviewsByUser,
    hasBookOrdered,
    hasReviewedBook,
    getAllUnreviewedBooksByUser
};
