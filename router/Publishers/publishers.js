// libraries
const express = require('express');
const DB_publisher = require('../../Database/DB-publisher-api');
const DB_Notification = require('../../Database/DB-notification-api');

// creating router
const router = express.Router({mergeParams : true});

// Route to display all publishers
router.get('/', async (req, res) => {
    if(req.user === null){
        return res.redirect('/login');
    }
    
    try {
        let limits = 25;
        let offsetPage = 1;
        if( req.query.page ) offsetPage = req.query.page;
        let offset = (offsetPage-1)*limits;
        
        const publishersResult = await DB_publisher.getAllPublishers(offset, limits);
        const publishersCountResult = await DB_publisher.getAllPublishersCount();
        const publishersCount = publishersCountResult[0].cnt;
        
        // Get unread notification count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
        
        res.render('layout.ejs', {
            user: req.user,
            body: ['allPublishersPage'],
            title: 'Publishers',
            navbar: 3,
            unreadCount: unreadCount,
            publishers: publishersResult,
            start: offset,
            page: offsetPage,
            pages: Math.ceil(publishersCount/limits),
            cnt: publishersCount,
            target: "/publishers?page="
        });
    } catch (error) {
        console.error('Error in publishers route:', error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});

// Route to display individual publisher page
router.get('/:publisherID', async (req, res) => {
    if (req.user === null) {
        return res.redirect('/login');
    }
    
    try {
        const publisherID = Number(req.params.publisherID);
        
        // Validate publisherID
        if (!publisherID || isNaN(publisherID) || publisherID <= 0) {
            return res.status(400).send('Invalid publisher ID');
        }
        
        const publisherResult = await DB_publisher.getPublisherByID(publisherID);
        if (publisherResult.length === 0) {
            return res.redirect('/publishers');
        }
        
        const publisherBooksResult = await DB_publisher.getBooksByPublisher(publisherID);
        
        // Get unread notification count
        const unreadCount = await DB_Notification.getUnreadNotificationCount(req.user.id);
        
        res.render('layout.ejs', {
            user: req.user,
            body: ['publisherPage'],
            title: 'Publisher',
            navbar: 3,
            unreadCount: unreadCount,
            publisher: publisherResult[0],
            books: publisherBooksResult
        });
    } catch (error) {
        console.error('Error in publisher page route:', error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});

module.exports = router;
