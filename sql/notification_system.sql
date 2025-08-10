-- Notification system tables for BookShop

-- 1. Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- 'voucher', 'general', 'welcome', 'order'
    voucher_id INTEGER NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notification_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT notification_voucher_fk FOREIGN KEY (voucher_id) REFERENCES voucher(id) ON DELETE SET NULL
);

-- 2. User vouchers table (to track which vouchers are assigned to which users)
CREATE TABLE user_vouchers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    voucher_id INTEGER NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_in_order_id INTEGER NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    CONSTRAINT user_voucher_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    CONSTRAINT user_voucher_voucher_fk FOREIGN KEY (voucher_id) REFERENCES voucher(id) ON DELETE CASCADE,
    CONSTRAINT user_voucher_order_fk FOREIGN KEY (used_in_order_id) REFERENCES book_order(id) ON DELETE SET NULL,
    UNIQUE(user_id, voucher_id) -- Prevent duplicate voucher assignments
);

-- 3. User metadata table (to track first-time buyers and other user stats)
CREATE TABLE user_metadata (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    first_order_at TIMESTAMP NULL,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    welcome_voucher_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_metadata_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_vouchers_user_id ON user_vouchers(user_id);
CREATE INDEX idx_user_vouchers_is_used ON user_vouchers(is_used);
CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id);

-- Insert initial user metadata for existing users
INSERT INTO user_metadata (user_id, total_orders, total_spent, first_order_at, welcome_voucher_sent)
SELECT 
    u.id,
    COALESCE(order_stats.order_count, 0),
    COALESCE(order_stats.total_spent, 0),
    order_stats.first_order,
    TRUE -- Mark as true for existing users to avoid sending welcome vouchers to them
FROM app_user u
LEFT JOIN (
    SELECT 
        CASE 
            WHEN bo.name = u.name THEN u.id
            ELSE NULL
        END as user_id,
        COUNT(bo.id) as order_count,
        SUM(CAST(bo.total_price AS NUMERIC)) as total_spent,
        MIN(bo.created_at) as first_order
    FROM book_order bo
    LEFT JOIN app_user u ON u.name = bo.name
    GROUP BY u.id, u.name
) order_stats ON order_stats.user_id = u.id
ON CONFLICT (user_id) DO NOTHING;
