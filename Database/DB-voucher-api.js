const database = require('./database');

// Get voucher by name
async function getVoucherByName(name) {
    const sql = `
        SELECT *
        FROM voucher
        WHERE name = $1
    `;
    const binds = [name];
    return (await database.execute(sql, binds)).rows;
}

// Get voucher by ID
async function getVoucherById(id) {
    const sql = `
        SELECT 
            id, name, discount, cap,
            TO_CHAR(validity, 'YYYY-MM-DD') AS validity
        FROM voucher
        WHERE id = $1
    `;
    const binds = [id];
    return (await database.execute(sql, binds)).rows;
}

// Create a new voucher
async function createVoucher(name, discount, validity, cap) {
    const sql = `
        INSERT INTO voucher(name, discount, validity, cap)
        VALUES (UPPER($1), $2, $3::date, $4)
    `;
    const binds = [name, discount, validity, cap];
    await database.execute(sql, binds);
}

// Get all vouchers
async function getAllVoucher() {
    const sql = `
        SELECT 
            id, name, discount, cap,
            TO_CHAR(validity, 'YYYY-MM-DD') AS validity
        FROM voucher
    `;
    const binds = [];
    return (await database.execute(sql, binds)).rows;
}

// Update an existing voucher
async function updateVoucher(id, name, discount, validity, cap) {
    const sql = `
        UPDATE voucher
        SET 
            name = $2,
            discount = $3,
            validity = $4::date,
            cap = $5
        WHERE id = $1
    `;
    const binds = [id, name, discount, validity, cap];
    await database.execute(sql, binds);
}

// Delete a voucher
async function deleteVoucher(id) {
    const sql = `
        DELETE FROM voucher
        WHERE id = $1
    `;
    const binds = [id];
    await database.execute(sql, binds);
}

// Assign voucher to user
async function assignVoucherToUser(userId, voucherId) {
    const sql = `
        INSERT INTO user_vouchers (user_id, voucher_id, assigned_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, voucher_id) DO NOTHING
        RETURNING id
    `;
    const binds = [userId, voucherId];
    return (await database.execute(sql, binds)).rows;
}

// Get voucher distribution history
async function getVoucherDistributionHistory(voucherId) {
    const sql = `
        SELECT 
            au.id as user_id,
            au.name as user_name,
            au.email as user_email,
            n.created_at,
            n.is_read,
            CASE 
                WHEN uv.is_used = true THEN 'Used'
                WHEN uv.used_at IS NOT NULL THEN 'Used'
                ELSE 'Active'
            END as status,
            uv.used_at,
            uv.assigned_at
        FROM notifications n
        JOIN app_user au ON n.user_id = au.id
        LEFT JOIN user_vouchers uv ON n.user_id = uv.user_id AND n.voucher_id = uv.voucher_id
        WHERE n.voucher_id = $1 AND n.type = 'voucher'
        ORDER BY n.created_at DESC
    `;
    const binds = [voucherId];
    return (await database.execute(sql, binds)).rows;
}

module.exports = {
    getVoucherByName,
    getVoucherById,
    createVoucher,
    getAllVoucher,
    updateVoucher,
    deleteVoucher,
    assignVoucherToUser,
    getVoucherDistributionHistory
};
