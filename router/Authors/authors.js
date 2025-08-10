// libraries
const express = require('express');
const DB_author = require('../../Database/DB-author-api');
const DB_Notification = require('../../Database/DB-notification-api');

// creating router
const router = express.Router({mergeParams : true});

// Route to display all authors
router.get('/', async (req, res) => {
    if(req.user === null){
        return res.redirect('/login');
    }
    
    try {
        let limits = 25;
        let offsetPage = 1;
        if( req.query.page ) offsetPage = req.query.page;
        let offset = (offsetPage-1)*limits;
        
        const authorsResult = await DB_author.getAllAuthors(offset, limits);
        const authorsCountResult = await DB_author.getAllAuthorsCount();
        const authorsCount = authorsCountResult[0].cnt;
        
        // Get unread notification count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
        
        res.render('layout.ejs', {
            user: req.user,
            body: ['allAuthorsPage'],
            title: 'Authors',
            navbar: 2,
            unreadCount: unreadCount,
            authors: authorsResult,
            start: offset,
            page: offsetPage,
            pages: Math.ceil(authorsCount/limits),
            cnt: authorsCount,
            target: "/authors?page="
        });
    } catch (error) {
        console.error('Error in authors route:', error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});

// Route to display individual author page
router.get('/:authorID', async (req, res) => {
    if (req.user === null) {
        return res.redirect('/login');
    }
    
    try {
        const authorID = Number(req.params.authorID);
        
        // Validate authorID
        if (!authorID || isNaN(authorID) || authorID <= 0) {
            return res.status(400).send('Invalid author ID');
        }
        
        const authorResult = await DB_author.getAuthorByID(authorID);
        if (authorResult.length === 0) {
            return res.redirect('/authors');
        }
        
        const authorBooksResult = await DB_author.getBooksByAuthor(authorID);
        
        // Get unread notification count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
        
        res.render('layout.ejs', {
            user: req.user,
            body: ['authorPage'],
            title: 'Author',
            navbar: 2,
            unreadCount: unreadCount,
            author: authorResult[0],
            books: authorBooksResult
        });
    } catch (error) {
        console.error('Error in author page route:', error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});

module.exports = router;
