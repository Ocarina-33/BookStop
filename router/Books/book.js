// libraries
const express = require('express');
const DB_book = require('../../Database/DB-book-api');
const DB_review = require('../../Database/DB-review-api');
const DB_wish = require('../../Database/DB-wishlist-api');
const DB_Notification = require('../../Database/DB-notification-api');

// creating router
const router = express.Router({mergeParams : true});

router.get('/', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }
    
    let limits = 25;
    let offsetPage = 1;
    if( req.query.page ) offsetPage = req.query.page;
    let offset = (offsetPage-1)*limits;
    
    // Get sorting and filtering parameters
    const sortBy = req.query.sortBy || 'rating_high'; // default sort by rating high
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    
    // Build filter options
    const filterOptions = {
        sortBy: sortBy,
        minPrice: minPrice,
        maxPrice: maxPrice
    };
    
    const booksResult = await DB_book.getAllBooksWithFilters(offset, limits, filterOptions);
    const booksCountResult = await DB_book.getAllBooksCountWithFilters(filterOptions);
    const booksCount = booksCountResult[0].cnt; // Note: lowercase 'cnt'
    
    // Build query string for pagination
    let queryParams = [];
    if (sortBy !== 'rating_high') queryParams.push(`sortBy=${sortBy}`);
    if (minPrice) queryParams.push(`minPrice=${minPrice}`);
    if (maxPrice) queryParams.push(`maxPrice=${maxPrice}`);
    const queryString = queryParams.length > 0 ? '&' + queryParams.join('&') : '';
    
    const totalPages = Math.ceil(booksCount/limits);
    
    // Get unread notification count
    const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
    
    res.render('layout.ejs', {
        user:req.user,
        body:['allBooksPage'],
        title:'Books',
        navbar:1,
        unreadCount: unreadCount,
        books:booksResult,
        start:offset,
        page:offsetPage,
        pages:totalPages,
        cnt:booksCount,
        target:"/books?page=",
        queryString: queryString,
        currentSort: sortBy,
        currentMinPrice: minPrice,
        currentMaxPrice: maxPrice
    });
});

router.get('/search', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }

    let limits = 25;
    let offsetPage = 1;
    if( req.query.page ) offsetPage = req.query.page;
    let offset = (offsetPage-1)*limits;
    const booksCountResult = await DB_book.searchBooksCount(req.query.keyword);
    const booksCount = booksCountResult[0].cnt; // Fixed: was CNT, should be cnt
    const booksResult = await DB_book.searchBooks(req.query.keyword,offset,limits);
    
    // Get unread notification count
    const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
    
    res.render('layout.ejs', {
        user:req.user,
        body:['allBooksPage'],
        title:'Books',
        navbar:1,
        unreadCount: unreadCount,
        books:booksResult,
        start:offset,
        page:offsetPage,
        pages:Math.ceil(booksCount/limits),
        cnt:booksCount,
        target:'/books/search?keyword='+req.query.keyword+'&page=',
        queryString: '', // Add missing queryString
        currentSort: 'name', // Add missing currentSort
        currentMinPrice: null, // Add missing currentMinPrice
        currentMaxPrice: null // Add missing currentMaxPrice
    });
});
router.get('/:bookID', async (req, res) => {
  if (req.user === null) {
    return res.redirect('/login');
  }
  
  const bookID = Number(req.params.bookID);
  let userId = req.user && req.user.id;
  userId = Number(userId); // Always ensure userId is a number

  // Debug log
  // console.log('userId:', userId, typeof userId, 'bookID:', bookID, typeof bookID);

  // Validate bookID: must be a positive integer
  if (!bookID || isNaN(bookID) || bookID <= 0) {
    return res.status(400).send('Invalid book ID');
  }

  const booksResult = await DB_book.getBookByID(bookID);
  if (booksResult.length === 0) {
    return res.redirect('/');
  }
  
  // Always pass numbers to DB functions
  const canReview = await DB_review.hasBookOrdered(Number(userId), Number(bookID));
  let hasReviewd = await DB_review.hasReviewedBook(Number(userId), Number(bookID));
  let addedToWishList = await DB_wish.hasAdded(Number(userId), Number(bookID));
  let reviews = await DB_review.getAllReviewsByBook(Number(bookID));

  // Get unread notification count
  const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);

  res.render('layout.ejs', {
    user: req.user,
    body: ['bookPage'],
    title: 'Books',
    navbar: 1,
    unreadCount: unreadCount,
    book: booksResult[0],
    reviews: reviews,
    canReview: canReview,
    hasReviewd: hasReviewd,
    hasAddedWish: addedToWishList
  });
});


router.get('/list/toggle/:bookId', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }
    let user_id = Number(req.user.id);
    let book_id = Number(req.params.bookId);
    let hasAdded = await DB_wish.hasAdded(user_id, book_id);


    if( hasAdded )  await DB_wish.removeFromList(user_id, book_id);
    else await DB_wish.addToWishlist(user_id, book_id);
    return res.redirect('/books/'+book_id);
});

module.exports = router;