const DB_Notification = require('../Database/DB-notification-api');
const DB_Voucher = require('../Database/DB-voucher-api');

// Welcome voucher configuration
const WELCOME_VOUCHER_CONFIG = {
    voucherName: 'WELCOME10', // Default welcome voucher name
    title: 'Welcome to BookStop! 🎉',
    message: `Welcome to BookStop! 🎉

ধন্যবাদ আমাদের কমিউনিটিতে যোগ দেওয়ার জন্য। আপনাকে স্বাগত জানাতে বিশেষ উপহার হিসেবে আমরা দিচ্ছি একটি এক্সক্লুসিভ ১০% ছাড়ের ভাউচার, যা আপনি আপনার প্রথম ক্রয়ে ব্যবহার করতে পারবেন।

চেকআউটের সময় WELCOME10 কোডটি ব্যবহার করুন এবং আমাদের সঙ্গে আপনার পাঠযাত্রা শুরু করুন!

শুভ পাঠ! 📚`
};

// Service to handle first-time buyer welcome vouchers
class WelcomeVoucherService {
    
    /**
     * Check if user should receive welcome voucher and send it
     * @param {number} userId - The user ID
     * @param {number} orderId - The order ID (first order)
     */
    static async processFirstTimeBuyer(userId, orderId, orderAmount) {
        try {
            console.log(`Processing first-time buyer: User ${userId}, Order ${orderId}`);
            
            // Get user metadata
            const userMetadata = await DB_Notification.getUserMetadata(userId);
            
            console.log(`User metadata for ${userId}:`, userMetadata);
            
            // Check if this is truly the first order and welcome voucher hasn't been sent
            if (userMetadata.total_orders === 0 && !userMetadata.welcome_voucher_sent) {
                console.log(`Sending welcome voucher to user ${userId} (first order)`);
                
                // Find the welcome voucher
                const welcomeVoucher = await this.getWelcomeVoucher();
                
                if (welcomeVoucher) {
                    // Send welcome voucher notification
                    await DB_Notification.createNotification(
                        userId,
                        WELCOME_VOUCHER_CONFIG.title,
                        WELCOME_VOUCHER_CONFIG.message,
                        'welcome',
                        welcomeVoucher.id
                    );
                    
                    // Assign voucher to user
                    await DB_Notification.assignVoucherToUser(userId, welcomeVoucher.id);
                    
                    // Mark welcome voucher as sent
                    await DB_Notification.markWelcomeVoucherSent(userId);
                    
                    console.log(`Welcome voucher sent successfully to user ${userId}`);
                } else {
                    console.warn('Welcome voucher not found in database');
                }
            } else {
                console.log(`User ${userId} not eligible for welcome voucher: orders=${userMetadata.total_orders}, voucher_sent=${userMetadata.welcome_voucher_sent}`);
            }
            
            // Update user metadata regardless
            await DB_Notification.updateUserMetadataAfterOrder(userId, orderAmount);
            
        } catch (error) {
            console.error('Error processing first-time buyer welcome voucher:', error);
            // Don't throw error to avoid breaking the order process
        }
    }
    
    /**
     * Get the welcome voucher from database
     * @returns {Object|null} Welcome voucher object or null
     */
    static async getWelcomeVoucher() {
        try {
            // Try to find the welcome voucher by name
            let welcomeVouchers = await DB_Voucher.getVoucherByName(WELCOME_VOUCHER_CONFIG.voucherName);
            
            if (welcomeVouchers.length > 0) {
                return welcomeVouchers[0];
            }
            
            // If not found, create the welcome voucher
            console.log('Creating default welcome voucher');
            await this.createDefaultWelcomeVoucher();
            
            // Try to get it again
            welcomeVouchers = await DB_Voucher.getVoucherByName(WELCOME_VOUCHER_CONFIG.voucherName);
            return welcomeVouchers.length > 0 ? welcomeVouchers[0] : null;
            
        } catch (error) {
            console.error('Error getting welcome voucher:', error);
            return null;
        }
    }
    
    /**
     * Create default welcome voucher if it doesn't exist
     */
    static async createDefaultWelcomeVoucher() {
        try {
            const validity = new Date();
            validity.setFullYear(validity.getFullYear() + 1); // Valid for 1 year
            
            await DB_Voucher.createVoucher(
                WELCOME_VOUCHER_CONFIG.voucherName,
                10, // 10% discount
                validity.toISOString().split('T')[0], // Format as YYYY-MM-DD
                100 // Max discount cap of 100 Taka
            );
            
            console.log('Default welcome voucher created successfully');
        } catch (error) {
            console.error('Error creating default welcome voucher:', error);
        }
    }
    
    /**
     * Send order confirmation notification
     * @param {number} userId - The user ID
     * @param {number} orderId - The order ID
     * @param {number} orderAmount - The order amount
     */
    static async sendOrderConfirmationNotification(userId, orderId, orderAmount) {
        try {
            // ORDER CONFIRMATION NOTIFICATIONS DISABLED BY USER REQUEST
            console.log(`Order confirmation notification skipped for user ${userId}, order ${orderId} (disabled by user preference)`);
            return;
            
            /* COMMENTED OUT - USER DOESN'T WANT ORDER CONFIRMED NOTIFICATIONS
            // Get the order with sequential number for this user
            const DB_Order = require('../Database/DB-order-api');
            const orderDetails = await DB_Order.getOrderByIdWithSequentialNumber(userId, orderId);
            
            if (!orderDetails || orderDetails.length === 0) {
                console.error(`Order ${orderId} not found for user ${userId}`);
                return;
            }
            
            const userOrderNumber = orderDetails[0].order_number;
            
            const title = 'Order Confirmed! 📦';
            const message = `Your order #${userOrderNumber} has been confirmed and is being processed.

Order Total: ৳${orderAmount}

You will receive updates as your order moves through our fulfillment process. Thank you for shopping with BookShop!`;
            
            await DB_Notification.createNotification(
                userId,
                title,
                message,
                'order'
            );
            
            console.log(`Order confirmation notification sent to user ${userId} for order #${userOrderNumber} (ID: ${orderId})`);
            */
        } catch (error) {
            console.error('Error sending order confirmation notification:', error);
        }
    }
    
    /**
     * Process new user registration - create metadata entry and send welcome voucher
     * @param {number} userId - The new user ID
     */
    static async processNewUserRegistration(userId) {
        try {
            console.log(`Processing new user registration: ${userId}`);
            
            // Ensure user metadata exists
            await DB_Notification.ensureUserMetadataExists(userId);
            
            // Get the welcome voucher
            const welcomeVoucher = await this.getWelcomeVoucher();
            
            if (welcomeVoucher) {
                // Send welcome voucher notification
                await DB_Notification.createNotification(
                    userId,
                    WELCOME_VOUCHER_CONFIG.title,
                    WELCOME_VOUCHER_CONFIG.message,
                    'welcome',
                    welcomeVoucher.id
                );
                
                // Assign voucher to user
                await DB_Notification.assignVoucherToUser(userId, welcomeVoucher.id);
                
                // Mark welcome voucher as sent
                await DB_Notification.markWelcomeVoucherSent(userId);
                
                console.log(`Welcome voucher sent successfully to user ${userId}`);
            } else {
                // Send welcome notification without voucher if voucher creation failed
                const title = 'Welcome to BookShop! 📚';
                const message = `Welcome to BookShop!

We're excited to have you join our community of book lovers. Explore our vast collection of books and discover your next great read.

Happy browsing! 🎉`;
                
                await DB_Notification.createNotification(
                    userId,
                    title,
                    message,
                    'welcome'
                );
                
                console.warn(`Welcome voucher not available, sent welcome notification only to user ${userId}`);
            }
        } catch (error) {
            console.error('Error processing new user registration:', error);
        }
    }
}

module.exports = WelcomeVoucherService;
