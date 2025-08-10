// libraries
const express = require('express');
const DB_book = require('../../Database/DB-book-api');
const DB_Notification = require('../../Database/DB-notification-api');

// creating router
const router = express.Router({mergeParams : true});

// Route for all genres page
router.get('/', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }
    
    try {
        // Get all unique genres from the database
        const genresResult = await DB_book.getAllGenres();
        
        // Get unread notification count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
        
        res.render('layout.ejs', {
            user: req.user,
            body: ['genresPage'],
            title: 'Genres',
            navbar: 5,
            unreadCount: unreadCount,
            genres: genresResult
        });
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for books by genre
router.get('/search', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }
    
    const genre = req.query.genre;
    if (!genre) {
        return res.redirect('/genres');
    }
    
    try {
        let limits = 25;
        let offsetPage = 1;
        if( req.query.page ) offsetPage = req.query.page;
        let offset = (offsetPage-1)*limits;
        
        // Get sorting and filtering parameters
        const sortBy = req.query.sortBy || 'name';
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
        
        // Build filter options including genre
        const filterOptions = {
            sortBy: sortBy,
            minPrice: minPrice,
            maxPrice: maxPrice,
            genre: genre
        };
        
        const booksResult = await DB_book.getBooksByGenre(offset, limits, filterOptions);
        const booksCountResult = await DB_book.getBooksByGenreCount(filterOptions);
        const booksCount = booksCountResult[0].cnt;
        
        // Build query string for pagination
        let queryParams = [`genre=${encodeURIComponent(genre)}`];
        if (sortBy !== 'name') queryParams.push(`sortBy=${sortBy}`);
        if (minPrice) queryParams.push(`minPrice=${minPrice}`);
        if (maxPrice) queryParams.push(`maxPrice=${maxPrice}`);
        const queryString = '&' + queryParams.join('&');
        
        // Get unread notification count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
        
        res.render('layout.ejs', {
            user: req.user,
            body: ['genreBooksPage'],
            title: `${genre} Books`,
            navbar: 5,
            unreadCount: unreadCount,
            books: booksResult,
            start: offset,
            page: offsetPage,
            pages: Math.ceil(booksCount/limits),
            cnt: booksCount,
            target: "/genres/search?page=",
            queryString: queryString,
            currentSort: sortBy,
            currentMinPrice: minPrice,
            currentMaxPrice: maxPrice,
            currentGenre: genre
        });
    } catch (error) {
        console.error('Error fetching books by genre:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
