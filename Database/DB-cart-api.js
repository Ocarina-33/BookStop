// Database/DB-cart-api.js
const db = require('./database');

async function getAllCarts(userID) {
  const sql = `SELECT * FROM cart WHERE user_id = $1`;
  const result = await db.execute(sql, [userID]);
  return result.rows;
}

async function getAssignedCart(userId) {
  const sql = `SELECT cart_id FROM app_user WHERE id = $1`;
  const result = await db.execute(sql, [userId]);
  return result.rows;
}

async function getItemsInCart(userId) {
  // First consolidate any duplicate items
  await consolidateDuplicateCartItems(userId);
  
  const sql = `
    SELECT picked.*, book.id AS book_id, book.name AS book_name, book.price,
           book.image, book.stock, author.name AS author_name,
           picked.amount, picked.id
    FROM picked
    JOIN app_user    ON app_user.cart_id = picked.cart_id
                     AND app_user.id = $1
    JOIN book        ON book.id = picked.book_id
    JOIN author      ON author.id = book.author_id
  `;
  const result = await db.execute(sql, [userId]);
  return result.rows;
}

async function getItemsInCartByCartId(userId, cartId) {
  const sql = `
    SELECT picked.*,
    book.id AS book_id,
    book.name AS book_name, 
    book.price,
    book.image, 
    author.name AS author_name
    FROM picked
    JOIN cart        ON cart.id = $1
                     AND cart.user_id = $2
    JOIN book        ON book.id = picked.book_id
    JOIN author      ON author.id = book.author_id
    WHERE cart_id = $1
  `;
  const result = await db.execute(sql, [cartId, userId]);
  return result.rows;
}

async function getItemsInCartByCartIdAdmin(cartId) {
  const sql = `
    SELECT picked.*, book.id AS book_id, book.name AS book_name, book.price,
           book.image, author.name AS author_name
    FROM picked
    JOIN cart        ON picked.cart_id = cart.id
                     AND cart.id = $1
    JOIN book        ON book.id = picked.book_id
    JOIN author      ON author.id = book.author_id
  `;
  const result = await db.execute(sql, [cartId]);
  return result.rows;
}

async function deleteItemFromCart(userId, bookId) {
  const sql = `
    DELETE FROM picked
    WHERE book_id = $1
      AND cart_id = (SELECT cart_id FROM app_user WHERE id = $2)
  `;
  await db.execute(sql, [bookId, userId]);
}

async function getCartByID(userID, cartID) {
  const sql = `SELECT * FROM cart WHERE user_id = $1 AND id = $2`;
  const result = await db.execute(sql, [userID, cartID]);
  return result.rows;
}

async function getRecentCart(userID) {
  const sql = `SELECT * FROM cart WHERE user_id = $1 ORDER BY created_at DESC`;
  const result = await db.execute(sql, [userID]);
  return result.rows;
}

async function addNewCart(userID) {
  const sql = `INSERT INTO cart(user_id) VALUES($1) RETURNING id`;
  const result = await db.execute(sql, [userID]);
  const cartID = result.rows[0].id;

  await db.execute(
    `UPDATE app_user SET cart_id = $1 WHERE id = $2`,
    [cartID, userID]
  );
}

async function checkCart(userID, bookID) {
  const sql = `
    SELECT picked.id
    FROM picked
    JOIN app_user ON picked.cart_id = app_user.cart_id
                   AND app_user.id = $1
    WHERE picked.book_id = $2
  `;
  const result = await db.execute(sql, [userID, bookID]);
  return result.rows;
}

async function addToCart(userID, bookID, amount = 1) {
  // First check if the book has stock available
  const stockCheckSql = `SELECT stock FROM book WHERE id = $1`;
  const stockResult = await db.execute(stockCheckSql, [bookID]);
  
  if (stockResult.rows.length === 0) {
    throw new Error('Book not found');
  }
  
  const currentStock = stockResult.rows[0].stock;
  if (currentStock <= 0) {
    throw new Error('This book is currently out of stock');
  }
  
  // Check if this book is already in the user's cart
  const checkExistingSql = `
    SELECT picked.id, picked.amount 
    FROM picked 
    JOIN app_user ON app_user.cart_id = picked.cart_id 
    WHERE app_user.id = $1 AND picked.book_id = $2
  `;
  const existingResult = await db.execute(checkExistingSql, [userID, bookID]);
  
  if (existingResult.rows.length > 0) {
    // Book already exists in cart, increment the amount
    const currentAmount = existingResult.rows[0].amount;
    const newAmount = currentAmount + amount;
    
    if (newAmount > currentStock) {
      throw new Error(`Only ${currentStock} items available in stock`);
    }
    
    const updateSql = `UPDATE picked SET amount = $1 WHERE id = $2`;
    await db.execute(updateSql, [newAmount, existingResult.rows[0].id]);
  } else {
    // Book doesn't exist in cart, add new record
    const sql = `
      INSERT INTO picked(cart_id, book_id, amount)
      VALUES ((SELECT cart_id FROM app_user WHERE id = $1), $2, $3)
    `;
    await db.execute(sql, [userID, bookID, amount]);
  }
}

async function updateAmount(ID, amount) {
  const sql = `UPDATE picked SET amount = $1 WHERE id = $2`;
  await db.execute(sql, [amount, ID]);
}

async function getTotalPrice(cartId) {
  const sql = `
    SELECT SUM(price * amount) AS price
    FROM picked
    JOIN book ON picked.book_id = book.id
    WHERE cart_id = $1
  `;
  const result = await db.execute(sql, [cartId]);
  return result.rows;
}

async function getTotalPriceAndItem(cartId) {
  const sql = `
    SELECT SUM(price * amount) AS price, SUM(amount) AS item
    FROM picked
    JOIN book ON picked.book_id = book.id
    WHERE cart_id = $1
  `;
  const result = await db.execute(sql, [cartId]);
  return result.rows;
}

async function getUserCart(userID) {
  const sql = `SELECT cart_id FROM app_user WHERE id = $1`;
  const result = await db.execute(sql, [userID]);
  return result.rows;
}

// Function to consolidate duplicate cart items
async function consolidateDuplicateCartItems(userID) {
  const cartSql = `SELECT cart_id FROM app_user WHERE id = $1`;
  const cartResult = await db.execute(cartSql, [userID]);
  
  if (cartResult.rows.length === 0) return;
  
  const cartId = cartResult.rows[0].cart_id;
  
  // Find duplicate book IDs in the cart
  const duplicatesSql = `
    SELECT book_id, array_agg(id) as picked_ids, array_agg(amount) as amounts
    FROM picked 
    WHERE cart_id = $1 
    GROUP BY book_id 
    HAVING COUNT(*) > 1
  `;
  const duplicatesResult = await db.execute(duplicatesSql, [cartId]);
  
  for (const duplicate of duplicatesResult.rows) {
    const bookId = duplicate.book_id;
    const pickedIds = duplicate.picked_ids;
    const amounts = duplicate.amounts;
    
    // Calculate total amount (no artificial limit, only stock limit)
    const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
    
    // Keep the first record, update its amount
    const keepId = pickedIds[0];
    await db.execute(`UPDATE picked SET amount = $1 WHERE id = $2`, [totalAmount, keepId]);
    
    // Delete the duplicate records
    for (let i = 1; i < pickedIds.length; i++) {
      await db.execute(`DELETE FROM picked WHERE id = $1`, [pickedIds[i]]);
    }
  }
}

module.exports = {
  getAllCarts,
  getAssignedCart,
  getItemsInCart,
  getItemsInCartByCartId,
  getItemsInCartByCartIdAdmin,
  deleteItemFromCart,
  getCartByID,
  getRecentCart,
  addNewCart,
  checkCart,
  addToCart,
  updateAmount,
  getTotalPrice,
  getTotalPriceAndItem,
  getUserCart,
  consolidateDuplicateCartItems
};
