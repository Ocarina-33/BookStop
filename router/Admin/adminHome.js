// libraries
const express = require('express');
const DB_admin_stats = require('../../Database/DB-admin-stats-api');


// creating router
const router = express.Router({mergeParams : true});

router.get('/', async (req, res) =>{

    if( req.admin == null )
        return res.redirect('/admin/login');

    try {
        // Fetch all dashboard data
        const [
            monthlyStatsResult,
            yearlyStatsResult,
            monthlyEarningsResult,
            yearlyEarningsResult,
            totalEarnings,
            orderStats,
            totalUsers,
            inventoryStats,
            mostOrderedBook,
            newOrders,
            recentlyShippedOrders,
            cancelledOrders,
            dailyOrderCount,
            topBestsellingBooks,
            lowStockBooks,
            outOfStockBooks,
            recentSignups,
            recentPayments
        ] = await Promise.all([
            DB_admin_stats.getMonthlyStats(),
            DB_admin_stats.getYearlyStats(),
            DB_admin_stats.getLastMonthEarnings(),
            DB_admin_stats.getLastYearEarnings(),
            DB_admin_stats.getTotalEarnings(),
            DB_admin_stats.getOrderStats(),
            DB_admin_stats.getTotalUsers(),
            DB_admin_stats.getInventoryStats(),
            DB_admin_stats.getMostOrderedBook(),
            DB_admin_stats.getNewOrders(5),
            DB_admin_stats.getRecentlyShippedOrders(5),
            DB_admin_stats.getCancelledOrders(5),
            DB_admin_stats.getDailyOrderCount(),
            DB_admin_stats.getTopBestsellingBooks(5),
            DB_admin_stats.getLowStockBooks(5),
            DB_admin_stats.getOutOfStockBooks(5),
            DB_admin_stats.getRecentSignups(7, 5),
            DB_admin_stats.getRecentPayments(5)
        ]);

        res.render('adminLayout.ejs', {
            title:'Admin Dashboard',
            page:'adminHome',
            // Existing data
            monthlyStat: monthlyStatsResult[0],
            yearlyStat: yearlyStatsResult[0],
            monthlyEarnings: monthlyEarningsResult,
            yearlyEarnings: yearlyEarningsResult,
            // New comprehensive data
            totalEarnings,
            orderStats,
            totalUsers,
            inventoryStats,
            mostOrderedBook,
            newOrders,
            recentlyShippedOrders,
            cancelledOrders,
            dailyOrderCount,
            topBestsellingBooks,
            lowStockBooks,
            outOfStockBooks,
            recentSignups,
            recentPayments
        });
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        res.render('adminLayout.ejs', {
            title:'Admin Dashboard',
            page:'adminHome',
            error: 'Error loading dashboard data',
            // Provide fallback data to prevent template errors
            totalEarnings: { total_earnings: 0 },
            orderStats: { total_orders: 0, completed_orders: 0, pending_orders: 0, pending_deliveries: 0 },
            totalUsers: { total_users: 0 },
            inventoryStats: { total_books: 0, total_authors: 0, total_publishers: 0, total_genres: 0, out_of_stock_books: 0, low_stock_books: 0 },
            mostOrderedBook: { name: 'Error loading data', image: '/images/books/defaultbook.jpg', total_ordered: 0 },
            newOrders: [],
            recentlyShippedOrders: [],
            cancelledOrders: [],
            dailyOrderCount: [],
            topBestsellingBooks: [],
            lowStockBooks: [],
            outOfStockBooks: [],
            recentSignups: [],
            recentPayments: [],
            monthlyStat: { total_books_sold: 0, total_earned_money: 0 },
            yearlyStat: { total_books_sold: 0, total_earned_money: 0 },
            monthlyEarnings: [],
            yearlyEarnings: []
        });
    }
});

module.exports = router;