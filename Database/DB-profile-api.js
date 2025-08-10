const database = require('./database');

async function getProfile(userId) {
    const sql = `
        SELECT 
            id,
            name as NAME,
            email as EMAIL,
            address as ADDRESS,
            phone as PHONE,
            dob as DOB,
            image as IMAGE
        FROM app_user WHERE id = $1
    `;
    const binds = [userId];
    return (await database.execute(sql, binds)).rows;
}

async function updateProfile(id, name, dob, phone, image) {
    const sql = `
        UPDATE app_user
        SET name = $2, dob = $3, phone = $4, image = $5
        WHERE id = $1
    `;
    const binds = [id, name, dob, phone, image];
    await database.execute(sql, binds);
    return;
}

async function getAllUsers(offset = 0, limit = 25) {
    const sql = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.address,
            u.phone,
            u.dob,
            u.image,
            current_cart.created_at as registration_date,
            COALESCE(order_stats.total_orders, 0)::int as total_orders,
            COALESCE(order_stats.total_spent, 0)::numeric as total_spent,
            COALESCE(review_stats.total_reviews, 0)::int as total_reviews,
            COALESCE(wishlist_stats.total_wishlist, 0)::int as total_wishlist
        FROM app_user u
        LEFT JOIN cart current_cart ON u.cart_id = current_cart.id
        LEFT JOIN (
            SELECT 
                c.user_id,
                COUNT(DISTINCT bo.id) as total_orders,
                SUM(bo.total_price) as total_spent
            FROM cart c
            JOIN book_order bo ON c.id = bo.cart_id
            WHERE bo.state = '5'
            GROUP BY c.user_id
        ) order_stats ON u.id = order_stats.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                COUNT(*) as total_reviews
            FROM rates
            GROUP BY user_id
        ) review_stats ON u.id = review_stats.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                COUNT(*) as total_wishlist
            FROM wish_list
            GROUP BY user_id
        ) wishlist_stats ON u.id = wishlist_stats.user_id
        GROUP BY u.id, u.name, u.email, u.address, u.phone, u.dob, u.image, current_cart.created_at, order_stats.total_orders, order_stats.total_spent, review_stats.total_reviews, wishlist_stats.total_wishlist
        ORDER BY u.id DESC
        OFFSET $1 LIMIT $2
    `;
    const binds = [offset, limit];
    return (await database.execute(sql, binds)).rows;
}

async function getAllUsersCount() {
    const sql = `SELECT COUNT(*) as count FROM app_user`;
    const result = await database.execute(sql, []);
    return result.rows[0].count;
}

async function searchUsers(searchTerm, offset = 0, limit = 25) {
    const sql = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.address,
            u.phone,
            u.dob,
            u.image,
            current_cart.created_at as registration_date,
            COALESCE(order_stats.total_orders, 0)::int as total_orders,
            COALESCE(order_stats.total_spent, 0)::numeric as total_spent,
            COALESCE(review_stats.total_reviews, 0)::int as total_reviews,
            COALESCE(wishlist_stats.total_wishlist, 0)::int as total_wishlist
        FROM app_user u
        LEFT JOIN cart current_cart ON u.cart_id = current_cart.id
        LEFT JOIN (
            SELECT 
                c.user_id,
                COUNT(DISTINCT bo.id) as total_orders,
                SUM(bo.total_price) as total_spent
            FROM cart c
            JOIN book_order bo ON c.id = bo.cart_id
            WHERE bo.state = '5'
            GROUP BY c.user_id
        ) order_stats ON u.id = order_stats.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                COUNT(*) as total_reviews
            FROM rates
            GROUP BY user_id
        ) review_stats ON u.id = review_stats.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                COUNT(*) as total_wishlist
            FROM wish_list
            GROUP BY user_id
        ) wishlist_stats ON u.id = wishlist_stats.user_id
        WHERE LOWER(u.name) LIKE LOWER($1) 
           OR LOWER(u.email) LIKE LOWER($1)
           OR LOWER(u.address) LIKE LOWER($1)
        GROUP BY u.id, u.name, u.email, u.address, u.phone, u.dob, u.image, current_cart.created_at, order_stats.total_orders, order_stats.total_spent, review_stats.total_reviews, wishlist_stats.total_wishlist
        ORDER BY u.id DESC
        OFFSET $2 LIMIT $3
    `;
    const binds = [`%${searchTerm}%`, offset, limit];
    return (await database.execute(sql, binds)).rows;
}

async function searchUsersCount(searchTerm) {
    const sql = `
        SELECT COUNT(*) as count 
        FROM app_user 
        WHERE LOWER(name) LIKE LOWER($1) 
           OR LOWER(email) LIKE LOWER($1)
           OR LOWER(address) LIKE LOWER($1)
    `;
    const binds = [`%${searchTerm}%`];
    const result = await database.execute(sql, binds);
    return result.rows[0].count;
}

async function getUserDetails(userId) {
    const sql = `
        SELECT 
            u.id,
            u.name as "NAME",
            u.email as "EMAIL",
            u.address as "ADDRESS",
            u.phone as "PHONE",
            u.dob as "DOB",
            u.image as "IMAGE",
            current_cart.created_at as registration_date,
            COALESCE(order_stats.total_orders, 0)::int as total_orders,
            COALESCE(order_stats.total_spent, 0)::numeric as total_spent,
            COALESCE(review_stats.total_reviews, 0)::int as total_reviews,
            COALESCE(wishlist_stats.total_wishlist, 0)::int as total_wishlist
        FROM app_user u
        LEFT JOIN cart current_cart ON u.cart_id = current_cart.id
        LEFT JOIN (
            SELECT 
                c.user_id,
                COUNT(DISTINCT bo.id) as total_orders,
                SUM(bo.total_price) as total_spent
            FROM cart c
            JOIN book_order bo ON c.id = bo.cart_id
            WHERE bo.state = '5'
            GROUP BY c.user_id
        ) order_stats ON u.id = order_stats.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                COUNT(*) as total_reviews
            FROM rates
            GROUP BY user_id
        ) review_stats ON u.id = review_stats.user_id
        LEFT JOIN (
            SELECT 
                user_id,
                COUNT(*) as total_wishlist
            FROM wish_list
            GROUP BY user_id
        ) wishlist_stats ON u.id = wishlist_stats.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email, u.address, u.phone, u.dob, u.image, current_cart.created_at, order_stats.total_orders, order_stats.total_spent, review_stats.total_reviews, wishlist_stats.total_wishlist
    `;
    const binds = [userId];
    return (await database.execute(sql, binds)).rows;
}

module.exports = {
    getProfile,
    updateProfile,
    getAllUsers,
    getAllUsersCount,
    searchUsers,
    searchUsersCount,
    getUserDetails
};
