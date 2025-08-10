// E:\BookShop\Database\DB-userSite-stats-api.js

const database = require('./database');

/**
 * Top 10 books sold in a specific month/year
 */
async function getMostSoldBooksOfLastMonth(month, year) {
  const sql = `
    SELECT
      b.id,
      b.name,
      b.price,
      b.image,
      b.star,
      b.review_count,
      a.name AS author_name,
      SUM(picked.amount) AS total_sold
    FROM picked
    JOIN book_order 
      ON book_order.cart_id = picked.cart_id
    JOIN book b ON b.id = picked.book_id
    JOIN author a ON a.id = b.author_id
    WHERE
      EXTRACT(MONTH  FROM book_order.created_at) = $1
      AND EXTRACT(YEAR   FROM book_order.created_at) = $2
      AND book_order.state = '5'
    GROUP BY b.id, b.name, b.price, b.image, b.star, b.review_count, a.name
    ORDER BY total_sold DESC
    LIMIT 10
  `;
  const binds = [month, year];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

/**
 * Best seller books overall (books with highest total sales across all time)
 */
async function getBestSellerBooks() {
  const sql = `
    SELECT
      b.id,
      b.name,
      b.price,
      b.image,
      b.star,
      b.review_count,
      a.name AS author_name,
      SUM(picked.amount) AS total_sold
    FROM picked
    JOIN book_order 
      ON book_order.cart_id = picked.cart_id
    JOIN book b ON b.id = picked.book_id
    JOIN author a ON a.id = b.author_id
    WHERE book_order.state = '5'
    GROUP BY b.id, b.name, b.price, b.image, b.star, b.review_count, a.name
    ORDER BY total_sold DESC
    LIMIT 10
  `;
  const { rows } = await database.execute(sql, [], database.options);
  return rows;
}


/**
 * 10 most recently sold books (by last sale timestamp)
 */
async function getRecentlySoldBooks() {
  const sql = `
    SELECT  
      b.id,
      b.name,
      b.price,
      b.image,
      b.star,
      b.review_count,
      a.name          AS author_name, 
      MAX(p.created_at) AS last_sold_at
    FROM picked p
    JOIN book b        ON b.id       = p.book_id
    JOIN author a      ON a.id       = b.author_id
    JOIN book_order bo ON bo.cart_id = p.cart_id
    WHERE bo.state = '5'
    GROUP BY
      b.id, b.name, b.price, b.image, b.star, b.review_count, a.name
    ORDER BY last_sold_at DESC
    LIMIT 10
  `;
  const { rows } = await database.execute(sql, [], database.options);
  return rows;
}


/**
 * Top 10 authors by books sold in the last month
 */
async function getAuthorsWithMostSoldBooksByMonth() {
  const sql = `
    SELECT
      a.id   AS author_id,
      a.name AS author_name,
      SUM(p.amount) AS books_sold
    FROM picked p
    JOIN book b        ON b.id       = p.book_id
    JOIN author a      ON a.id       = b.author_id
    JOIN book_order bo ON bo.cart_id = p.cart_id
    WHERE
      bo.state = '5'
      AND p.created_at >= NOW() - INTERVAL '1 month'
    GROUP BY a.id, a.name
    ORDER BY books_sold DESC
    LIMIT 10
  `;
  const { rows } = await database.execute(sql, [], database.options);
  return rows;
}

/**
 * Top 10 sold books for a given author (all time)
 */
async function getTopSoldBooksByAuthor(authorId) {
  const sql = `
    SELECT
      b.id,
      b.name,
      b.image,
      b.price,
      b.star,
      b.review_count,
      a.id            AS author_id,
      a.name          AS author_name,
      SUM(p.amount)   AS books_sold
    FROM picked p
    JOIN book_order bo ON bo.cart_id = p.cart_id
    JOIN book b        ON b.id       = p.book_id
    JOIN author a      ON a.id       = b.author_id
    WHERE bo.state = '5'
      AND a.id = $1
    GROUP BY
      b.id, b.name, b.image, b.price, b.star, b.review_count,
      a.id, a.name
    ORDER BY books_sold DESC
    LIMIT 10
  `;
  const binds = [authorId];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}


/**
 * Most reviewed books overall (books with highest review count)
 */
async function getMostReviewedBooksByMonth(month, year) {
  const sql = `
    SELECT
      b.id,
      b.name,
      b.price,
      b.image,
      b.star,
      b.review_count,
      a.name AS author_name
    FROM book b
    JOIN author a ON a.id = b.author_id
    WHERE b.review_count > 0
    ORDER BY b.review_count DESC, b.star DESC
    LIMIT 10
  `;
  const { rows } = await database.execute(sql, [], database.options);
  return rows;
}

module.exports = {
  getMostSoldBooksOfLastMonth,
  getBestSellerBooks,
  getRecentlySoldBooks,
  getAuthorsWithMostSoldBooksByMonth,
  getTopSoldBooksByAuthor,
  getMostReviewedBooksByMonth
};
