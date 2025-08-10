const database = require('./database');

async function getAllAuthors(offset, limit) {
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const sql = `
    SELECT 
      a.id, 
      a.name, 
      a.image, 
      a.description,
      COUNT(b.id) as book_count
    FROM author a
    LEFT JOIN book b ON b.author_id = a.id
    GROUP BY a.id, a.name, a.image, a.description
    ORDER BY a.name
    OFFSET $1 LIMIT $2
  `;
  const binds = [offset, limit];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function getAllAuthorsCount() {
  const sql = `SELECT COUNT(*) AS cnt FROM author`;
  const { rows } = await database.execute(sql, []);
  return rows;
}

async function getAuthorByID(id) {
  if (id === undefined || isNaN(Number(id))) {
    return [];
  }
  const sql = `
    SELECT 
      a.id, 
      a.name, 
      a.image, 
      a.description,
      COUNT(b.id) as book_count
    FROM author a
    LEFT JOIN book b ON b.author_id = a.id
    WHERE a.id = $1
    GROUP BY a.id, a.name, a.image, a.description
  `;
  const binds = [id];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function getBooksByAuthor(authorId) {
  if (authorId === undefined || isNaN(Number(authorId))) {
    return [];
  }
  const sql = `
    SELECT 
      b.id,
      b.name,
      b.price,
      b.image,
      b.star,
      b.review_count,
      a.name AS author_name,
      p.name AS publisher_name
    FROM book b
    JOIN author a ON a.id = b.author_id
    LEFT JOIN publisher p ON p.id = b.publisher_id
    WHERE b.author_id = $1
    ORDER BY b.name
  `;
  const binds = [authorId];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function addAuthor(name, image, description) {
  const sql = `
    INSERT INTO author (name, image, description)
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  const binds = [name, image || null, description || null];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function updateAuthor(id, name, image, description) {
  if (id === undefined || isNaN(Number(id))) {
    return [];
  }
  const sql = `
    UPDATE author 
    SET name = $2, image = $3, description = $4
    WHERE id = $1
    RETURNING id
  `;
  const binds = [id, name, image || null, description || null];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function searchAuthors(searchTerm, offset, limit) {
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const sql = `
    SELECT 
      a.id, 
      a.name, 
      a.image, 
      a.description,
      COUNT(b.id) as book_count
    FROM author a
    LEFT JOIN book b ON b.author_id = a.id
    WHERE LOWER(a.name) LIKE LOWER($1)
       OR LOWER(a.description) LIKE LOWER($1)
    GROUP BY a.id, a.name, a.image, a.description
    ORDER BY a.name
    OFFSET $2 LIMIT $3
  `;
  const binds = [`%${searchTerm}%`, offset, limit];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function searchAuthorsCount(searchTerm) {
  const sql = `
    SELECT COUNT(*) AS cnt 
    FROM author 
    WHERE LOWER(name) LIKE LOWER($1)
       OR LOWER(description) LIKE LOWER($1)
  `;
  const binds = [`%${searchTerm}%`];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function deleteAuthor(id) {
  // First check if author has any books
  const bookCheckSql = `SELECT COUNT(*) as book_count FROM book WHERE author_id = $1`;
  const bookCheckResult = await database.execute(bookCheckSql, [id]);
  
  if (bookCheckResult.rows[0].book_count > 0) {
    throw new Error('Cannot delete author: Author has books associated with them. Please delete or reassign the books first.');
  }
  
  const sql = `DELETE FROM author WHERE id = $1`;
  const binds = [id];
  const result = await database.execute(sql, binds);
  return result.rowCount > 0;
}

module.exports = {
  getAllAuthors,
  getAllAuthorsCount,
  getAuthorByID,
  getBooksByAuthor,
  addAuthor,
  updateAuthor,
  searchAuthors,
  searchAuthorsCount,
  deleteAuthor
};
