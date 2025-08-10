const database = require('./database');

// ========== NOTIFICATIONS ==========

// Create a new notification
async function createNotification(userId, title, message, type = 'general', voucherId = null) {
    const sql = `
        INSERT INTO notifications (user_id, title, message, type, data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;
    const data = voucherId ? JSON.stringify({ voucherId }) : null;
    const binds = [userId, title, message, type, data];
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
            au.username,
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
            SELECT uv.user_id, uv.voucher_id, v.title, au.username
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
        const voucherResult = await client.query('SELECT title FROM voucher WHERE id = $1', [voucherId]);
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
        SELECT id, title, message, type, is_read, created_at, data
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
        SELECT v.id, v.title, v.description, v.discount_type, v.discount_value, 
               v.minimum_order_amount, v.validity, uv.assigned_at
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
        SELECT uv.*, v.title, v.discount_type, v.discount_value, v.minimum_order_amount, v.validity
        FROM user_vouchers uv
        JOIN voucher v ON uv.voucher_id = v.id
        WHERE uv.user_id = $1 AND uv.voucher_id = $2 AND uv.is_used = FALSE AND v.validity >= CURRENT_DATE
    `;
    const binds = [userId, voucherId];
    const result = await database.execute(sql, binds);
    return result.rows[0];
}

// ========== USER METADATA ==========

// Get user metadata for analytics
async function getUserMetadata(userId) {
    const sql = `
        SELECT 
            au.id,
            au.username,
            au.email,
            COALESCE(SUM(o.total_amount), 0) as total_spent,
            COUNT(o.id) as total_orders,
            COUNT(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_orders,
            MAX(o.order_date) as last_order_date
        FROM app_user au
        LEFT JOIN orders o ON au.id = o.user_id
        WHERE au.id = $1
        GROUP BY au.id, au.username, au.email
    `;
    const binds = [userId];
    const result = await database.execute(sql, binds);
    return result.rows[0];
}

// Update user metadata after order (for welcome voucher logic)
async function updateUserMetadataAfterOrder(userId, orderAmount) {
    // This function can be used to trigger welcome vouchers or other automated notifications
    // For now, it's a placeholder that could update user statistics or trigger vouchers
    const metadata = await getUserMetadata(userId);
    
    // If first order, could trigger welcome voucher
    if (metadata.total_orders === 1) {
        // Logic for first-time buyer voucher
        console.log(`First order detected for user ${userId}`);
    }
    
    return metadata;
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
    await createNotification(userId, 'Welcome!', 'Welcome to our bookstore!', 'welcome');
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
    const sql = `
        SELECT 
            au.id,
            au.username,
            au.email,
            COALESCE(COUNT(o.id), 0) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM app_user au
        LEFT JOIN orders o ON au.id = o.user_id
        WHERE au.is_admin = FALSE
        GROUP BY au.id, au.username, au.email
        ORDER BY au.username
    `;
    const result = await database.execute(sql, []);
    return result.rows;
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
    updateUserMetadataAfterOrder,
    wasWelcomeVoucherSent,
    markWelcomeVoucherSent,
    sendVoucherToUsers,
    getAllUsersForVoucherDistribution
};
