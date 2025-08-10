// libraries
const express = require('express');
// creating router
const router = express.Router({mergeParams : true});

const DB_book = require('../../../Database/DB-book-api');
const DB_author = require('../../../Database/DB-author-api');
const DB_publisher = require('../../../Database/DB-publisher-api');

router.get('/', async (req, res) =>{
    // Temporarily bypass authentication for testing
    // if( req.admin == null )
    //     return res.redirect('/admin/login');

    try {
        let limits = 50;
        let offsetPage = 1;
        if( req.query.page ) offsetPage = req.query.page;
        let offset = (offsetPage-1)*limits;
        
        const booksResult = await DB_book.getAllBooks(offset,limits);
        const booksCountResult = await DB_book.getAllBooksCount();
        const booksCount = booksCountResult[0].cnt;
        
        res.render('adminLayout.ejs', {
            title:'Book Management',
            page:'adminBookAll',
            books:booksResult,
            start:offset,
            currentPage:offsetPage,
            pages:Math.ceil(booksCount/limits),
            cnt:booksCount,
            target:'/admin/book?page='
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.render('adminLayout.ejs', {
            title:'Book Management',
            page:'adminBookAll',
            books:[],
            start:0,
            currentPage:1,
            pages:1,
            cnt:0,
            target:'/admin/book?page=',
            error: 'Error loading books'
        });
    }
});

router.get('/search', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');


    const {keyword} = req.query;
    let limits = 50;
    let offsetPage = 1;
    if( req.query.page ) offsetPage = req.query.page;
    let offset = (offsetPage-1)*limits;
    const booksResult = await DB_book.searchBooks(keyword,offset,limits);
    const booksCountResult = await DB_book.searchBooksCount(keyword);
    const booksCount = booksCountResult[0].CNT;
    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminBookAll',
        books:booksResult,
        start:offset,
        currentPage:offsetPage,
        pages:Math.ceil(booksCount/limits),
        cnt:booksCount,
        target:'/admin/book/search?keyword='+keyword+'&page='
    });
});

router.get('/add', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    const authorResult = await DB_author.getAllAuthors(0, 1000); // Get first 1000 authors
    const publisherResult = await DB_publisher.getAllPublishers(0, 1000); // Get first 1000 publishers
    res.render('adminLayout.ejs', {
        title:'Add Book',
        page:'adminBookAdd',
        authors:authorResult,
        publishers:publisherResult,
        success: req.query.success,
        error: req.query.error
    });
});

router.get('/edit/:id', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        const booksResult = await DB_book.getBookByID(req.params.id);
        
        if (!booksResult || booksResult.length === 0) {
            return res.redirect('/admin/book?error=Book not found');
        }
        
        res.render('adminLayout.ejs', {
            title:'Edit Book',
            page:'adminBookEdit',
            book:booksResult[0],
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error loading book for edit:', error);
        res.redirect('/admin/book?error=Error loading book');
    }
});

router.post('/edit', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        console.log('Book edit request:', req.body);
        const {id, name, image, page, year, price, edition, stock, genre} = req.body;
        
        if (!id) {
            return res.redirect('/admin/book?error=Missing book ID');
        }
        
        // Validate required fields
        if (!page || !price || !edition || stock === undefined) {
            return res.redirect(`/admin/book/edit/${id}?error=Page, price, edition and stock are required`);
        }
        
        const updateResult = await DB_book.editBook(id, image, page, year, price, edition, stock, genre);
        console.log('Book update result:', updateResult);
        
        if (updateResult && updateResult.length > 0) {
            res.redirect('/admin/book?success=Book updated successfully');
        } else {
            res.redirect(`/admin/book/edit/${id}?error=Failed to update book`);
        }
    } catch (error) {
        console.error('Error updating book:', error);
        res.redirect(`/admin/book/edit/${id}?error=Error updating book: ${error.message}`);
    }
});

router.post('/delete/:id', async (req, res) => {
    if (req.admin == null) {
        return res.redirect('/admin/login');
    }
    
    try {
        const bookId = req.params.id;
        await DB_book.deleteBook(bookId);
        res.redirect('/admin/book?success=' + encodeURIComponent('Book deleted successfully'));
    } catch (error) {
        console.error('Error deleting book:', error);
        res.redirect('/admin/book/edit/' + req.params.id + '?error=' + encodeURIComponent(error.message));
    }
});

router.post('/add', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        const {name, author_id, publisher_id, image, language, isbn, page, year, price, edition, stock, genre, summary,
               new_author_name, new_author_image, new_author_description,
               new_publisher_name, new_publisher_image, new_publisher_founding_date} = req.body;
        
        let finalAuthorId = author_id;
        let finalPublisherId = publisher_id;
        
        // Handle new author creation
        if (author_id.trim() === 'new' && new_author_name && new_author_name.trim()) {
            try {
                const newAuthor = await DB_author.addAuthor(
                    new_author_name.trim(),
                    new_author_image || 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Author',
                    new_author_description || 'No description available.'
                );
                if (newAuthor && newAuthor.length > 0) {
                    finalAuthorId = newAuthor[0].id;
                } else {
                    throw new Error('Failed to create new author - no result returned');
                }
            } catch (authorError) {
                console.error('Error creating new author:', authorError);
                throw new Error('Failed to create new author: ' + authorError.message);
            }
        }
        
        // Handle new publisher creation
        if (publisher_id.trim() === 'new' && new_publisher_name && new_publisher_name.trim()) {
            try {
                const newPublisher = await DB_publisher.addPublisher(
                    new_publisher_name.trim(),
                    new_publisher_image || 'https://via.placeholder.com/150x150/8B4513/FFFFFF?text=Publisher',
                    new_publisher_founding_date || null
                );
                if (newPublisher && newPublisher.length > 0) {
                    finalPublisherId = newPublisher[0].id;
                } else {
                    throw new Error('Failed to create new publisher - no result returned');
                }
            } catch (publisherError) {
                console.error('Error creating new publisher:', publisherError);
                throw new Error('Failed to create new publisher: ' + publisherError.message);
            }
        }
        
        // Validate that we have valid author and publisher IDs
        if (!finalAuthorId || finalAuthorId.toString().trim() === 'new') {
            throw new Error('Author is required. Please select an existing author or provide new author details.');
        }
        
        if (!finalPublisherId || finalPublisherId.toString().trim() === 'new') {
            throw new Error('Publisher is required. Please select an existing publisher or provide new publisher details.');
        }
        
        // Add the book
        const addResult = await DB_book.addBook(
            name, finalAuthorId, finalPublisherId, image, language, isbn, 
            page, year, price, edition, stock, genre, summary
        );
        
        if (addResult) {
            res.redirect('/admin/book?success=Book added successfully' + 
                        (author_id === 'new' ? ' with new author' : '') +
                        (publisher_id === 'new' ? ' and new publisher' : ''));
        } else {
            throw new Error('Failed to add book');
        }
        
    } catch (error) {
        console.error('Error adding book:', error);
        res.redirect('/admin/book/add?error=' + encodeURIComponent(error.message));
    }
});
module.exports = router;