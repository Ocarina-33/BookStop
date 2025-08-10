// libraries
const express = require('express');
// creating router
const router = express.Router({mergeParams : true});

const DB_restock = require('../../../Database/DB-stock-api');

router.get('/', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');

    try {
        let limits = 50;
        let offsetPage = 1;
        if( req.query.page ) offsetPage = req.query.page;
        let offset = (offsetPage-1)*limits;
        
        console.log('Fetching books with offset:', offset, 'limit:', limits);
        const booksResult = await DB_restock.getAllShortStockBooks(offset,limits);
        console.log('Books found:', booksResult.length);
        
        const booksCountResult = await DB_restock.getAllShortStockBooksCount();
        const booksCount = booksCountResult[0].cnt;

        res.render('adminLayout.ejs', {
            title:'Book Restock',
            page:'adminRestockAll',
            books:booksResult,
            start:offset,
            currentPage:offsetPage,
            pages:Math.ceil(booksCount/limits),
            cnt:booksCount,
            target:'/admin/restock?page='
        });
    } catch (error) {
        console.error('Error in restock page:', error);
        res.render('adminLayout.ejs', {
            title:'Book Restock',
            page:'adminRestockAll',
            books:[],
            start:0,
            currentPage:1,
            pages:1,
            cnt:0,
            target:'/admin/restock?page=',
            error: 'Error loading restock page'
        });
    }
});


router.post('/update', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');

    try {
        console.log('Restock update request:', req.body);
        let {bookId, restock} = req.body;
        
        if( !bookId || !restock ) {
            return res.redirect('/admin/restock?error=Missing book ID or restock amount');
        }
        
        // Validate restock amount
        const restockAmount = parseInt(restock);
        if (isNaN(restockAmount) || restockAmount < 0) {
            return res.redirect('/admin/restock?error=Invalid restock amount');
        }
        
        await DB_restock.updateStock(bookId, restockAmount);
        console.log(`Stock updated for book ${bookId}: ${restockAmount}`);
        
        return res.redirect('/admin/restock?success=Stock updated successfully');
        
    } catch (error) {
        console.error('Error updating stock:', error);
        return res.redirect('/admin/restock?error=Error updating stock');
    }
});

// Keep the old GET route for compatibility but redirect to POST
router.get('/update', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');

    try {
        console.log('Restock update request (GET):', req.query);
        let {bookId, restock} = req.query;
        
        if( !bookId || !restock ) {
            return res.redirect('/admin/restock?error=Missing book ID or restock amount');
        }
        
        // Validate restock amount
        const restockAmount = parseInt(restock);
        if (isNaN(restockAmount) || restockAmount < 0) {
            return res.redirect('/admin/restock?error=Invalid restock amount');
        }
        
        await DB_restock.updateStock(bookId, restockAmount);
        console.log(`Stock updated for book ${bookId}: ${restockAmount}`);
        
        return res.redirect('/admin/restock?success=Stock updated successfully');
        
    } catch (error) {
        console.error('Error updating stock:', error);
        return res.redirect('/admin/restock?error=Error updating stock');
    }
});
module.exports = router;