const database = require('./database');

async function getAllPublishers(offset, limit) {
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const sql = `
    SELECT 
      p.id, 
      p.name, 
      p.image, 
      p.founding_date,
      COUNT(b.id) as book_count
    FROM publisher p
    LEFT JOIN book b ON b.publisher_id = p.id
    GROUP BY p.id, p.name, p.image, p.founding_date
    ORDER BY p.name
    OFFSET $1 LIMIT $2
  `;
  const binds = [offset, limit];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function getAllPublishersCount() {
  const sql = `SELECT COUNT(*) AS cnt FROM publisher`;
  const { rows } = await database.execute(sql, []);
  return rows;
}

async function getPublisherByID(id) {
  if (id === undefined || isNaN(Number(id))) {
    return [];
  }
  const sql = `
    SELECT 
      p.id, 
      p.name, 
      p.image, 
      p.founding_date,
      COUNT(b.id) as book_count
    FROM publisher p
    LEFT JOIN book b ON b.publisher_id = p.id
    WHERE p.id = $1
    GROUP BY p.id, p.name, p.image, p.founding_date
  `;
  const binds = [id];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function getBooksByPublisher(publisherId) {
  if (publisherId === undefined || isNaN(Number(publisherId))) {
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
    JOIN publisher p ON p.id = b.publisher_id
    LEFT JOIN author a ON a.id = b.author_id
    WHERE b.publisher_id = $1
    ORDER BY b.name
  `;
  const binds = [publisherId];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function addPublisher(name, image, foundingDate) {
  const sql = `
    INSERT INTO publisher (name, image, founding_date)
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  const binds = [name, image || null, foundingDate || null];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function updatePublisher(id, name, image, foundingDate) {
  if (id === undefined || isNaN(Number(id))) {
    return [];
  }
  const sql = `
    UPDATE publisher 
    SET name = $2, image = $3, founding_date = $4
    WHERE id = $1
    RETURNING id
  `;
  const binds = [id, name, image || null, foundingDate || null];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function searchPublishers(searchTerm, offset, limit) {
  offset = Number(offset);
  limit = Number(limit);
  if (isNaN(offset) || offset < 0) offset = 0;
  if (isNaN(limit) || limit <= 0) limit = 25;

  const sql = `
    SELECT 
      p.id, 
      p.name, 
      p.image, 
      p.founding_date,
      COUNT(b.id) as book_count
    FROM publisher p
    LEFT JOIN book b ON b.publisher_id = p.id
    WHERE LOWER(p.name) LIKE LOWER($1)
    GROUP BY p.id, p.name, p.image, p.founding_date
    ORDER BY p.name
    OFFSET $2 LIMIT $3
  `;
  const binds = [`%${searchTerm}%`, offset, limit];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function searchPublishersCount(searchTerm) {
  const sql = `
    SELECT COUNT(*) AS cnt 
    FROM publisher 
    WHERE LOWER(name) LIKE LOWER($1)
  `;
  const binds = [`%${searchTerm}%`];
  const { rows } = await database.execute(sql, binds);
  return rows;
}

async function deletePublisher(id) {
  // First check if publisher has any books
  const bookCheckSql = `SELECT COUNT(*) as book_count FROM book WHERE publisher_id = $1`;
  const bookCheckResult = await database.execute(bookCheckSql, [id]);
  
  if (bookCheckResult.rows[0].book_count > 0) {
    throw new Error('Cannot delete publisher: Publisher has books associated with them. Please delete or reassign the books first.');
  }
  
  const sql = `DELETE FROM publisher WHERE id = $1`;
  const binds = [id];
  const result = await database.execute(sql, binds);
  return result.rowCount > 0;
}

module.exports = {
  getAllPublishers,
  getAllPublishersCount,
  getPublisherByID,
  getBooksByPublisher,
  addPublisher,
  updatePublisher,
  searchPublishers,
  searchPublishersCount,
  deletePublisher
};
