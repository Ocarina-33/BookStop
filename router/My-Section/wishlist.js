// libraries
const express = require('express');
const DB_wish = require('../../Database/DB-wishlist-api');
const DB_Notification = require('../../Database/DB-notification-api');

// creating router
const router = express.Router({mergeParams : true});



router.get('/', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }
    const userId = req.user.id;
    const wishResult = await DB_wish.getAllByUser(userId);
    
    // Get unread notification count
    const unreadCount = await DB_Notification.getUnreadNotificationCount(userId);
    
    // console.log(wishResult);
    res.render('layout.ejs', {
        user:req.user,
        body:['wishlist'],
        title:'Profile',
        navbar:-1,
        unreadCount: unreadCount,
        wishList:wishResult

    });
});

router.get('/remove/:bookId', async (req, res) =>{
    // if logged in, delete token from database
    if(req.user === null){
        return res.redirect('/login');
    }
    let user_id = req.user.id;
    let book_id = req.params.bookId;

    await DB_wish.removeFromList(user_id,book_id);

    return res.redirect('/My-section/wishlist/');

    return res.redirect('/books/'+req.body.bookId);
});



module.exports = router;