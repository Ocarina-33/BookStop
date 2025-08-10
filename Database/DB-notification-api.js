const database = require('./database');

// ========== NOTIFICATIONS ==========

// Create a new notification
async function createNotification(userId, title, message, type = 'general', voucherId = null) {
    const sql = `
        INSERT INTO notifications (user_id, title, message, type, voucher_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;
    const binds = [userId, title, message, type, voucherId];
    const result = await database.execute(sql, binds);
    return result.rows[0];
}

// Get notification statistics for admin
async function getNotificationStats() {
    const sql = `
        SELECT 
            COUNT(*) as total_notifications,
            COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_notifications,
            COUNT(CASE WHEN type = 'voucher' THEN 1 END) as voucher_notifications,
            COUNT(CASE WHEN type = 'welcome' THEN 1 END) as welcome_notifications
        FROM notifications
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    const result = await database.execute(sql, []);
    return result.rows[0];
}

// Get voucher distribution history for admin
async function getVoucherDistributionHistory(voucherId) {
    const sql = `
        SELECT 
            uv.id as distribution_id,
            uv.user_id,
            au.name as username,
            au.email,
            uv.assigned_at,
            uv.is_used,
            uv.used_at,
            CASE 
                WHEN uv.is_used THEN 'Used'
                ELSE 'Available'
            END as status
        FROM user_vouchers uv
        JOIN app_user au ON uv.user_id = au.id
        WHERE uv.voucher_id = $1
        ORDER BY uv.assigned_at DESC
    `;
    const result = await database.execute(sql, [voucherId]);
    return result.rows;
}

// Revoke voucher from specific user
async function revokeVoucherFromUser(distributionId) {
    const client = await database.pool.connect();
    try {
        await client.query('BEGIN');
        
        // Get the distribution details before deleting
        const getDistribution = await client.query(`
            SELECT uv.user_id, uv.voucher_id, v.name as title, au.name as username
            FROM user_vouchers uv
            JOIN voucher v ON uv.voucher_id = v.id
            JOIN app_user au ON uv.user_id = au.id
            WHERE uv.id = $1 AND uv.is_used = FALSE
        `, [distributionId]);
        
        if (getDistribution.rows.length === 0) {
            throw new Error('Voucher distribution not found or already used');
        }
        
        const distribution = getDistribution.rows[0];
        
        // Delete the voucher assignment
        await client.query('DELETE FROM user_vouchers WHERE id = $1', [distributionId]);
        
        // Delete related notification
        await client.query(`
            DELETE FROM notifications 
            WHERE user_id = $1 
            AND type = 'voucher' 
            AND data::json->>'voucherId' = $2
        `, [distribution.user_id, distribution.voucher_id.toString()]);
        
        await client.query('COMMIT');
        
        return {
            success: true,
            message: `Voucher "${distribution.title}" revoked from user ${distribution.username}`
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error revoking voucher from user:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Revoke voucher from all users
async function revokeVoucherFromAllUsers(voucherId) {
    const client = await database.pool.connect();
    try {
        await client.query('BEGIN');
        
        // Get voucher info
        const voucherResult = await client.query('SELECT name as title FROM voucher WHERE id = $1', [voucherId]);
        if (voucherResult.rows.length === 0) {
            throw new Error('Voucher not found');
        }
        
        const voucherTitle = voucherResult.rows[0].title;
        
        // Get all user assignments that are not used
        const assignmentsResult = await client.query(`
            SELECT user_id FROM user_vouchers 
            WHERE voucher_id = $1 AND is_used = FALSE
        `, [voucherId]);
        
        const affectedUsers = assignmentsResult.rows.length;
        
        // Delete all unused voucher assignments
        await client.query('DELETE FROM user_vouchers WHERE voucher_id = $1 AND is_used = FALSE', [voucherId]);
        
        // Delete related notifications
        await client.query(`
            DELETE FROM notifications 
            WHERE type = 'voucher' 
            AND data::json->>'voucherId' = $1
        `, [voucherId.toString()]);
        
        await client.query('COMMIT');
        
        return {
            success: true,
            message: `Voucher "${voucherTitle}" revoked from ${affectedUsers} user(s)`
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error revoking voucher from all users:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Get notifications for a user
async function getUserNotifications(userId, limit = 20, offset = 0) {
    const sql = `
        SELECT id, title, message, type, voucher_id, is_read, created_at
        FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
    `;
    const binds = [userId, limit, offset];
    const result = await database.execute(sql, binds);
    return result.rows;
}

// Get unread notification count for a user
async function getUnreadNotificationCount(userId) {
    const sql = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = FALSE
    `;
    const binds = [userId];
    const result = await database.execute(sql, binds);
    return result.rows[0].count;
}

// Mark notification as read
async function markNotificationAsRead(notificationId, userId) {
    const sql = `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`;
    const binds = [notificationId, userId];
    await database.execute(sql, binds);
}

// Mark all notifications as read for a user
async function markAllNotificationsAsRead(userId) {
    const sql = `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`;
    const binds = [userId];
    await database.execute(sql, binds);
}

// Delete a notification
async function deleteNotification(notificationId, userId) {
    const sql = `DELETE FROM notifications WHERE id = $1 AND user_id = $2`;
    const binds = [notificationId, userId];
    await database.execute(sql, binds);
}

// ========== VOUCHER FUNCTIONS ==========

// Assign voucher to user
async function assignVoucherToUser(userId, voucherId) {
    const sql = `
        INSERT INTO user_vouchers (user_id, voucher_id, assigned_at) 
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, voucher_id) DO NOTHING
    `;
    const binds = [userId, voucherId];
    await database.execute(sql, binds);
}

// Get user's available vouchers
async function getUserAvailableVouchers(userId) {
    const sql = `
        SELECT v.id, v.name, v.discount, v.cap, v.validity, uv.assigned_at
        FROM user_vouchers uv
        JOIN voucher v ON uv.voucher_id = v.id
        WHERE uv.user_id = $1 AND uv.is_used = FALSE AND v.validity >= CURRENT_DATE
        ORDER BY uv.assigned_at DESC
    `;
    const binds = [userId];
    const result = await database.execute(sql, binds);
    return result.rows;
}

// Mark voucher as used
async function markVoucherAsUsed(userId, voucherId, orderId) {
    const sql = `
        UPDATE user_vouchers 
        SET is_used = TRUE, used_at = CURRENT_TIMESTAMP, used_in_order_id = $3
        WHERE user_id = $1 AND voucher_id = $2 AND is_used = FALSE
    `;
    const binds = [userId, voucherId, orderId];
    await database.execute(sql, binds);
}

// Check if user has specific voucher
async function checkUserHasVoucher(userId, voucherId) {
    const sql = `
        SELECT uv.*, v.name, v.discount, v.cap, v.validity
        FROM user_vouchers uv
        JOIN voucher v ON uv.voucher_id = v.id
        WHERE uv.user_id = $1 AND uv.voucher_id = $2 AND uv.is_used = FALSE AND v.validity >= CURRENT_DATE
    `;
    const binds = [userId, voucherId];
    const result = await database.execute(sql, binds);
    return result.rows[0];
}

// ========== USER METADATA ==========

// Get user metadata for analytics - fixed to use correct table structure
async function getUserMetadata(userId) {
    // First, ensure user metadata exists
    await ensureUserMetadataExists(userId);
    
    const sql = `
        SELECT 
            um.user_id as id,
            au.name as username,
            au.email,
            um.total_orders,
            um.total_spent,
            um.welcome_voucher_sent,
            um.created_at,
            um.updated_at
        FROM user_metadata um
        JOIN app_user au ON um.user_id = au.id
        WHERE um.user_id = $1
    `;
    const binds = [userId];
    const result = await database.execute(sql, binds);
    return result.rows[0];
}

// Ensure user metadata exists, create if not
async function ensureUserMetadataExists(userId) {
    const checkSql = `SELECT user_id FROM user_metadata WHERE user_id = $1`;
    const checkResult = await database.execute(checkSql, [userId]);
    
    if (checkResult.rows.length === 0) {
        const insertSql = `
            INSERT INTO user_metadata (user_id, total_orders, total_spent, welcome_voucher_sent, created_at, updated_at)
            VALUES ($1, 0, 0.00, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        await database.execute(insertSql, [userId]);
        console.log(`Created metadata for user ${userId}`);
    }
}

// Update user metadata after order (for welcome voucher logic)
async function updateUserMetadataAfterOrder(userId, orderAmount) {
    try {
        // Ensure user metadata exists
        await ensureUserMetadataExists(userId);
        
        // Update the user_metadata table with actual order data
        const updateSql = `
            UPDATE user_metadata 
            SET 
                total_orders = total_orders + 1,
                total_spent = total_spent + $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            RETURNING total_orders, welcome_voucher_sent
        `;
        const result = await database.execute(updateSql, [userId, orderAmount]);
        const metadata = result.rows[0];
        
        console.log(`Updated metadata for user ${userId}: orders=${metadata.total_orders}, welcome_sent=${metadata.welcome_voucher_sent}`);
        
        // Return the updated metadata
        return await getUserMetadata(userId);
    } catch (error) {
        console.error('Error updating user metadata after order:', error);
        return null;
    }
}

// Check if welcome voucher was already sent
async function wasWelcomeVoucherSent(userId) {
    const sql = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND type = 'welcome'
    `;
    const binds = [userId];
    const result = await database.execute(sql, binds);
    return result.rows[0].count > 0;
}

// Mark welcome voucher as sent
async function markWelcomeVoucherSent(userId) {
    await ensureUserMetadataExists(userId);
    const sql = `
        UPDATE user_metadata 
        SET welcome_voucher_sent = TRUE, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1
    `;
    await database.execute(sql, [userId]);
    console.log(`Marked welcome voucher as sent for user ${userId}`);
}

// ========== ADMIN FUNCTIONS ==========

// Send voucher to multiple users
async function sendVoucherToUsers(userIds, voucherId, title, message) {
    const client = await database.pool.connect();
    try {
        await client.query('BEGIN');
        
        for (const userId of userIds) {
            // Create notification
            await client.query(`
                INSERT INTO notifications (user_id, title, message, type, data) 
                VALUES ($1, $2, $3, 'voucher', $4)
            `, [userId, title, message, JSON.stringify({ voucherId })]);
            
            // Assign voucher to user
            await client.query(`
                INSERT INTO user_vouchers (user_id, voucher_id, assigned_at) 
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, voucher_id) DO NOTHING
            `, [userId, voucherId]);
        }
        
        await client.query('COMMIT');
        return { success: true, count: userIds.length };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Get all users for voucher distribution
async function getAllUsersForVoucherDistribution() {
    console.log('=== getAllUsersForVoucherDistribution called ===');
    try {
        const sql = `
            SELECT 
                au.id,
                au.name as username,
                au.email,
                COALESCE(COUNT(o.id), 0) as total_orders,
                COALESCE(SUM(o.total_price), 0) as total_spent
            FROM app_user au
            LEFT JOIN cart c ON au.id = c.user_id
            LEFT JOIN book_order o ON c.id = o.cart_id
            GROUP BY au.id, au.name, au.email
            ORDER BY au.name
        `;
        console.log('=== Executing SQL query ===');
        console.log(sql);
        const result = await database.execute(sql, []);
        console.log('=== Query successful, rows returned:', result.rows.length, '===');
        if (result.rows.length > 0) {
            console.log('=== First user example ===', result.rows[0]);
        }
        return result.rows;
    } catch (error) {
        console.error('=== Error in getAllUsersForVoucherDistribution ===', error);
        throw error;
    }
}

module.exports = {
    createNotification,
    getNotificationStats,
    getVoucherDistributionHistory,
    revokeVoucherFromUser,
    revokeVoucherFromAllUsers,
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    assignVoucherToUser,
    getUserAvailableVouchers,
    markVoucherAsUsed,
    checkUserHasVoucher,
    getUserMetadata,
    ensureUserMetadataExists,
    updateUserMetadataAfterOrder,
    wasWelcomeVoucherSent,
    markWelcomeVoucherSent,
    sendVoucherToUsers,
    getAllUsersForVoucherDistribution
};
