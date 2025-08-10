// libraries
const express = require('express');
//const marked = require('marked');

const router = express.Router({mergeParams : true});
const DB_stats = require('../Database/DB-userSite-stats-api');
const database = require('../Database/database'); // Ensure this is the correct path to your database module
const DB_Notification = require('../Database/DB-notification-api');
// sub-routers
const signupRouter = require('./auth/signup');
const loginRouter = require('./auth/login');
const logoutRouter = require('./auth/logout');

const bookRouter = require('./Books/book');
const authorRouter = require('./Authors/authors');
const publisherRouter = require('./Publishers/publishers');
const genreRouter = require('./Genres/genres');
//const bestsellerRouter = require('./Bestseller/bestseller');

const reviewRouter = require('./Books/reviews');

const cartRouter = require('./Cart/cart');

const orderRouter = require('./My-Section/orders');
const profileRouter = require('./My-Section/profile');
const myreviewRouter = require('./My-Section/reviews');
const mywishListRouter = require('./My-Section/wishlist');
const notificationsRouter = require('./My-Section/notifications');



// ROUTE: home page
router.get('/', async (req, res) =>{
    if( req.user == null )
        return res.redirect('/login');

    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
        const currentYear = currentDate.getFullYear();

        // Get test books as fallback
        const DB_book = require('../Database/DB-book-api');
        const testBooks = await DB_book.getAllBooks(0, 5);

        // Get stats data
        const mostReviewedBooks = await DB_stats.getMostReviewedBooksByMonth();
        const mostSoldBooks = await DB_stats.getBestSellerBooks();
        const recentlySoldBooks = await DB_stats.getRecentlySoldBooks();
        
        // Get books by specific authors (using correct author IDs)
        const topBooksOfJafor = await DB_stats.getTopSoldBooksByAuthor(3853);
        const topBooksOfHumayun = await DB_stats.getTopSoldBooksByAuthor(3861);
        // For J. K. Rowling, always show all her books instead of just sold ones
        const topBooksOfRowling = [];
        
        // If no sold books, get any books by these authors as fallback
        let jaforFallback = [];
        let humayunFallback = [];
        let rowlingFallback = [];
        
        if (topBooksOfJafor.length === 0) {
            const jaforBooksSql = `SELECT b.id, b.name, b.price, b.image, b.star, b.review_count, a.name AS author_name FROM book b JOIN author a ON a.id = b.author_id WHERE a.id = 3853 LIMIT 5`;
            const jaforResult = await database.execute(jaforBooksSql, []);
            jaforFallback = jaforResult.rows;
        }
        
        if (topBooksOfHumayun.length === 0) {
            const humayunBooksSql = `SELECT b.id, b.name, b.price, b.image, b.star, b.review_count, a.name AS author_name FROM book b JOIN author a ON a.id = b.author_id WHERE a.id = 3861 LIMIT 5`;
            const humayunResult = await database.execute(humayunBooksSql, []);
            humayunFallback = humayunResult.rows;
        }
        
        // Always get J. K. Rowling books (not based on sales)
        const rowlingBooksSql = `SELECT b.id, b.name, b.price, b.image, b.star, b.review_count, a.name AS author_name FROM book b JOIN author a ON a.id = b.author_id WHERE a.id = 22 LIMIT 5`;
        const rowlingResult = await database.execute(rowlingBooksSql, []);
        rowlingFallback = rowlingResult.rows;
        
        // Get unread notification count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
        
        res.render('layout.ejs', {
            user:req.user,
            body:['landingPage'],
            title:'BookStop',
            navbar: 0,
            unreadCount: unreadCount,
            publishers:["dfsdf","sfsdf","fsdfsd"],

            // Use test books if no stats books are found
            mostReviewedBooks: mostReviewedBooks.length > 0 ? mostReviewedBooks : testBooks.slice(0, 5),
            mostSoldBooks: mostSoldBooks.length > 0 ? mostSoldBooks : testBooks.slice(0, 5),
            recentlySoldBooks: recentlySoldBooks.length > 0 ? recentlySoldBooks : testBooks.slice(0, 5),
            // Use fallback books if sold books not available
            topBooksOfJafor: topBooksOfJafor.length > 0 ? topBooksOfJafor : jaforFallback,
            topBooksOfHumayun: topBooksOfHumayun.length > 0 ? topBooksOfHumayun : humayunFallback,
            topBooksOfRowling: rowlingFallback // Always use the fallback (all books) for J. K. Rowling
        });
    } catch (error) {
        console.error('Error in home route:', error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});



// setting up sub-routers

router.use('/signup', signupRouter);
router.use('/login', loginRouter);
router.use('/logout', logoutRouter);

router.use('/books', bookRouter);
router.use('/authors', authorRouter);
router.use('/publishers', publisherRouter);
router.use('/genres', genreRouter);



router.use('/reviews', reviewRouter);

router.use('/cart', cartRouter);

router.use('/My-section/orders', orderRouter);
router.use('/My-section/profile', profileRouter);
router.use('/My-section/reviews', myreviewRouter);
router.use('/My-section/wishlist', mywishListRouter);
router.use('/My-section/notifications', notificationsRouter);

// Test route for session management
router.get('/session-test', (req, res) => {
    res.render('user/session-test', {
        title: 'Session Test - BookShop',
        user: req.user
    });
});

// ROUTE: About Us page
router.get('/aboutus', (req, res) => {
    if(req.user === null){
        return res.redirect('/login');
    }
    res.render('layout.ejs', {
        user: req.user,
        body: ['aboutus'],
        title: 'About Us - BookShop',
        navbar: 4 // Highlighting the About Us tab in the navbar
    });
});


module.exports = router;