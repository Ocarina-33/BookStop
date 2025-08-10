const database = require('./database');

async function getAllBooks(offset, limit) {
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const sql = `
    SELECT 
      b.id, b.name, b.image, b.language, b.isbn, b.page, b.publishing_year, 
      b.price, b.edition, b.stock, b.genre,
      a.name AS author_name, p.name AS publisher_name
    FROM book b
    LEFT JOIN author a ON b.author_id = a.id
    LEFT JOIN publisher p ON b.publisher_id = p.id
    ORDER BY b.name
    OFFSET $1 LIMIT $2
  `;
  const binds = [offset, limit];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getAllBooksCount() {
  const sql = `SELECT COUNT(*) AS cnt FROM book`;
  const { rows } = await database.execute(sql, [], database.options);
  return rows;
}

async function getBookByID(id) {
  if (id === undefined || isNaN(Number(id))) {
    // Return empty array instead of throwing
    return [];
  }
  const sql = `
    SELECT
      book.id, book.name, book.price, book.language, book.image, book.edition, book.isbn,
      book.page, book.publishing_year, book.star AS stars, book.review_count,
      book.genre, book.stock,
      author.id AS author_id, author.name AS author_name,
      author.description AS author_description, author.image AS author_image,
      publisher.id AS publisher_id, publisher.name AS publisher_name
    FROM book
    LEFT JOIN rates ON rates.book_id = book.id
    JOIN author ON author.id = book.author_id
    JOIN publisher ON publisher.id = book.publisher_id
    WHERE book.id = $1
  `;
  const binds = [id];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getBookByAuthorID(id, offset, limit) {
  if (id === undefined || isNaN(Number(id))) {
    return [];
  }
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const sql = `
    SELECT book.*
    FROM book
    WHERE book.author_id = $1
    ORDER BY book.name
    OFFSET $2 LIMIT $3
  `;
  const binds = [id, offset, limit];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getBookByAuthorIDCount(id) {
  if (id === undefined || isNaN(Number(id))) {
    return [{ cnt: 0 }];
  }
  const sql = `
    SELECT COUNT(*) AS cnt
    FROM book
    WHERE book.author_id = $1
  `;
  const binds = [id];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getBooksByPublisherID(id, offset, limit) {
  if (id === undefined || isNaN(Number(id))) {
    return [];
  }
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const sql = `
    SELECT
      book.*,
      author.id AS author_id, author.name AS author_name,
      author.description AS author_description, author.image AS author_image,
      publisher.name AS publisher_name
    FROM book
    JOIN author ON author.id = book.author_id
    JOIN publisher ON publisher.id = book.publisher_id
    WHERE book.publisher_id = $1
    ORDER BY book.name
    OFFSET $2 LIMIT $3
  `;
  const binds = [id, offset, limit];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getBookByPublisherIDCount(id) {
  if (id === undefined || isNaN(Number(id))) {
    return [{ cnt: 0 }];
  }
  const sql = `
    SELECT COUNT(*) AS cnt
    FROM book
    WHERE book.publisher_id = $1
  `;
  const binds = [id];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function searchBooks(keyword, offset, limit) {
  if (!keyword) {
    keyword = '';
  }
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const sql = `
    SELECT
      b.id, b.name, b.image, b.stock, b.price, b.star, b.review_count,
      a.name AS author_name
    FROM book b
    JOIN author a ON a.id = b.author_id
    JOIN publisher p ON p.id = b.publisher_id
    WHERE
      LOWER(b.name) LIKE '%' || LOWER($1) || '%' OR
      LOWER(a.name) LIKE '%' || LOWER($1) || '%' OR
      LOWER(p.name) LIKE '%' || LOWER($1) || '%' OR
      LOWER(b.genre) LIKE '%' || LOWER($1) || '%'
    ORDER BY b.name
    OFFSET $2 LIMIT $3
  `;
  const binds = [keyword, offset, limit];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function searchBooksCount(keyword) {
  if (!keyword) {
    keyword = '';
  }
  const sql = `
    SELECT COUNT(*) AS cnt
    FROM book b
    JOIN author a ON a.id = b.author_id
    JOIN publisher p ON p.id = b.publisher_id
    WHERE
      LOWER(b.name) LIKE '%' || LOWER($1) || '%' OR
      LOWER(a.name) LIKE '%' || LOWER($1) || '%' OR
      LOWER(p.name) LIKE '%' || LOWER($1) || '%' OR
      LOWER(b.genre) LIKE '%' || LOWER($1) || '%'
  `;
  const binds = [keyword];
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function editBook(id, image, page, year, price, edition, stock, genre) {
  if (id === undefined || isNaN(Number(id))) {
    return [];
  }
  const sql = `
    UPDATE book 
    SET image = $2, page = $3, publishing_year = $4, price = $5, edition = $6, stock = $7, genre = $8
    WHERE id = $1
    RETURNING id
  `;
  const binds = [id, image, page, year || null, price, edition, stock, genre];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function addBook(name, authorId, publisherId, image, language, isbn, page, year, price, edition, stock, genre, summary) {
  const sql = `
    INSERT INTO book (name, author_id, publisher_id, image, language, isbn, page, publishing_year, price, edition, stock, genre, summary)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id
  `;
  const binds = [
    name, 
    authorId || null, 
    publisherId || null, 
    image || '/images/books/defaultbook.jpg', 
    language || 'Bangla', 
    isbn || null, 
    page || null, 
    year || null, 
    price || 0, 
    edition || null, 
    stock || 0, 
    genre || null,
    summary || null
  ];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function getNewBooks() {
  const sql = `
    SELECT *
    FROM book
    ORDER BY id DESC
    LIMIT 10
  `;
  const { rows } = await database.execute(sql, [], database.options);
  return rows;
}

async function getAllBooksWithFilters(offset, limit, filterOptions = {}) {
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const { sortBy = 'rating_high', minPrice, maxPrice } = filterOptions;
  
  let sql = `
    SELECT 
      b.id, b.name, b.image, b.language, b.isbn, b.page, b.publishing_year, 
      b.price, b.edition, b.stock, b.genre, b.star, b.review_count,
      a.name AS author_name, p.name AS publisher_name
    FROM book b
    LEFT JOIN author a ON b.author_id = a.id
    LEFT JOIN publisher p ON b.publisher_id = p.id
  `;
  
  const conditions = [];
  const binds = [];
  let bindIndex = 1;
  
  // Add price filters
  if (minPrice !== null && minPrice !== undefined) {
    conditions.push(`CAST(b.price AS NUMERIC) >= $${bindIndex}`);
    binds.push(minPrice);
    bindIndex++;
  }
  
  if (maxPrice !== null && maxPrice !== undefined) {
    conditions.push(`CAST(b.price AS NUMERIC) <= $${bindIndex}`);
    binds.push(maxPrice);
    bindIndex++;
  }
  
  // Add WHERE clause if conditions exist
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }
  
  // Add sorting
  let orderBy = 'CAST(b.star AS NUMERIC) DESC'; // default to rating_high
  switch (sortBy) {
    case 'price_low':
      orderBy = 'CAST(b.price AS NUMERIC) ASC';
      break;
    case 'price_high':
      orderBy = 'CAST(b.price AS NUMERIC) DESC';
      break;
    case 'rating_high':
      orderBy = 'CAST(b.star AS NUMERIC) DESC';
      break;
    case 'rating_low':
      orderBy = 'CAST(b.star AS NUMERIC) ASC';
      break;
    default:
      orderBy = 'CAST(b.star AS NUMERIC) DESC'; // default to rating_high
      break;
  }
  
  sql += ` ORDER BY ${orderBy} OFFSET $${bindIndex} LIMIT $${bindIndex + 1}`;
  binds.push(offset, limit);
  
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getAllBooksCountWithFilters(filterOptions = {}) {
  const { minPrice, maxPrice } = filterOptions;
  
  let sql = `SELECT COUNT(*) AS cnt FROM book b`;
  
  const conditions = [];
  const binds = [];
  let bindIndex = 1;
  
  // Add price filters
  if (minPrice !== null && minPrice !== undefined) {
    conditions.push(`CAST(b.price AS NUMERIC) >= $${bindIndex}`);
    binds.push(minPrice);
    bindIndex++;
  }
  
  if (maxPrice !== null && maxPrice !== undefined) {
    conditions.push(`CAST(b.price AS NUMERIC) <= $${bindIndex}`);
    binds.push(maxPrice);
    bindIndex++;
  }
  
  // Add WHERE clause if conditions exist
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }
  
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getAllGenres() {
  const sql = `
    WITH genre_split AS (
      SELECT TRIM(unnest(string_to_array(genre, ','))) as individual_genre
      FROM book 
      WHERE genre IS NOT NULL AND genre != ''
    )
    SELECT individual_genre as genre, COUNT(*) as book_count
    FROM genre_split
    WHERE individual_genre != ''
    GROUP BY individual_genre
    ORDER BY book_count DESC, individual_genre ASC
  `;
  const { rows } = await database.execute(sql, [], database.options);
  return rows;
}

async function getBooksByGenre(offset, limit, filterOptions = {}) {
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const { sortBy = 'rating_high', minPrice, maxPrice, genre } = filterOptions;
  
  let sql = `
    SELECT 
      b.id, b.name, b.image, b.language, b.isbn, b.page, b.publishing_year, 
      b.price, b.edition, b.stock, b.genre, b.star, b.review_count,
      a.name AS author_name, p.name AS publisher_name
    FROM book b
    LEFT JOIN author a ON b.author_id = a.id
    LEFT JOIN publisher p ON b.publisher_id = p.id
  `;
  
  const conditions = [];
  const binds = [];
  let bindIndex = 1;
  
  // Add genre filter
  if (genre) {
    conditions.push(`LOWER(b.genre) LIKE '%' || LOWER($${bindIndex}) || '%'`);
    binds.push(genre);
    bindIndex++;
  }
  
  // Add price filters
  if (minPrice !== null && minPrice !== undefined) {
    conditions.push(`CAST(b.price AS NUMERIC) >= $${bindIndex}`);
    binds.push(minPrice);
    bindIndex++;
  }
  
  if (maxPrice !== null && maxPrice !== undefined) {
    conditions.push(`CAST(b.price AS NUMERIC) <= $${bindIndex}`);
    binds.push(maxPrice);
    bindIndex++;
  }
  
  // Add WHERE clause if conditions exist
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }
  
  // Add sorting
  let orderBy = 'CAST(b.star AS NUMERIC) DESC'; // default to rating_high
  switch (sortBy) {
    case 'price_low':
      orderBy = 'CAST(b.price AS NUMERIC) ASC';
      break;
    case 'price_high':
      orderBy = 'CAST(b.price AS NUMERIC) DESC';
      break;
    case 'rating_high':
      orderBy = 'CAST(b.star AS NUMERIC) DESC';
      break;
    case 'rating_low':
      orderBy = 'CAST(b.star AS NUMERIC) ASC';
      break;
    default:
      orderBy = 'CAST(b.star AS NUMERIC) DESC'; // default to rating_high
      break;
  }
  
  sql += ` ORDER BY ${orderBy} OFFSET $${bindIndex} LIMIT $${bindIndex + 1}`;
  binds.push(offset, limit);
  
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getBooksByGenreCount(filterOptions = {}) {
  const { minPrice, maxPrice, genre } = filterOptions;
  
  let sql = `SELECT COUNT(*) AS cnt FROM book b`;
  
  const conditions = [];
  const binds = [];
  let bindIndex = 1;
  
  // Add genre filter
  if (genre) {
    conditions.push(`LOWER(b.genre) LIKE '%' || LOWER($${bindIndex}) || '%'`);
    binds.push(genre);
    bindIndex++;
  }
  
  // Add price filters
  if (minPrice !== null && minPrice !== undefined) {
    conditions.push(`CAST(b.price AS NUMERIC) >= $${bindIndex}`);
    binds.push(minPrice);
    bindIndex++;
  }
  
  if (maxPrice !== null && maxPrice !== undefined) {
    conditions.push(`CAST(b.price AS NUMERIC) <= $${bindIndex}`);
    binds.push(maxPrice);
    bindIndex++;
  }
  
  // Add WHERE clause if conditions exist
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }
  
  const { rows } = await database.execute(sql, binds, database.options);
  return rows;
}

async function getTopGenresForNav(limit = 5) {
  const sql = `
    WITH genre_split AS (
      SELECT TRIM(unnest(string_to_array(genre, ','))) as individual_genre
      FROM book 
      WHERE genre IS NOT NULL AND genre != ''
    )
    SELECT individual_genre as genre, COUNT(*) as book_count
    FROM genre_split
    WHERE individual_genre != ''
    GROUP BY individual_genre
    ORDER BY book_count DESC, individual_genre ASC
    LIMIT $1
  `;
  const { rows } = await database.execute(sql, [limit], database.options);
  return rows;
}

async function deleteBook(id) {
  // Check if book has any orders, cart items, reviews, or wishlist entries
  const checkSql = `
    SELECT 
      (SELECT COUNT(*) FROM picked WHERE book_id = $1) as cart_count,
      (SELECT COUNT(*) FROM rates WHERE book_id = $1) as review_count,
      (SELECT COUNT(*) FROM wish_list WHERE book_id = $1) as wishlist_count,
      (SELECT COUNT(*) FROM book_order bo 
       JOIN picked p ON p.cart_id = bo.cart_id 
       WHERE p.book_id = $1) as order_count
  `;
  
  const checkResult = await database.execute(checkSql, [id]);
  const counts = checkResult[0];
  
  if (counts.cart_count > 0 || counts.order_count > 0 || counts.review_count > 0 || counts.wishlist_count > 0) {
    throw new Error('Cannot delete book: Book has associated orders, reviews, cart items, or wishlist entries. Please remove these first.');
  }
  
  const sql = `DELETE FROM book WHERE id = $1`;
  const result = await database.execute(sql, [id]);
  return result.length > 0 || result.rowCount > 0;
}

module.exports = {
  getAllBooks,
  getAllBooksCount,
  getBookByID,
  getBookByAuthorID,
  getBookByAuthorIDCount,
  getBooksByPublisherID,
  getBookByPublisherIDCount,
  searchBooks,
  searchBooksCount,
  editBook,
  addBook,
  getNewBooks,
  getAllBooksWithFilters,
  getAllBooksCountWithFilters,
  getAllGenres,
  getBooksByGenre,
  getBooksByGenreCount,
  getTopGenresForNav,
  deleteBook
};
