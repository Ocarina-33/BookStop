// libraries
const express = require('express');
// creating router
const router = express.Router({mergeParams : true});

const DB_author = require('../../../Database/DB-author-api');

router.get('/', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    const searchTerm = req.query.search || '';
    let booksResult;
    
    if (searchTerm) {
        booksResult = await DB_author.searchAuthors(searchTerm);
    } else {
        booksResult = await DB_author.getAllAuthors();
    }
    
    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminAuthorAll',
        books:booksResult,
        searchTerm: searchTerm
    });
});

router.get('/edit/:id', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    const authorResult = await DB_author.getAuthorByID(req.params.id);
    if( authorResult.length === 0 ) return res.redirect('/admin/author');
    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminAuthorEdit',
        author:authorResult[0]
    });
});
router.get('/add', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');

    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminAuthorAdd',

    });
});
router.post('/add', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    console.log(req.body);
    const {name,image,description} = req.body;
   await DB_author.addAuthor(name,image,description);
    return res.redirect('/admin/author');
    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminAuthorEdit',
        author:authorResult[0]
    });
});

router.post('/edit', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    // console.log(req.body);
    const {id,name,image,description} = req.body;
    await DB_author.updateAuthor(id,name,image,description);
    return res.redirect('/admin/author');
    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminAuthorEdit',
        author:authorResult[0]
    });
});

router.post('/delete/:id', async (req, res) => {
    if (req.admin == null) {
        return res.redirect('/admin/login');
    }
    
    try {
        const authorId = req.params.id;
        await DB_author.deleteAuthor(authorId);
        res.redirect('/admin/author?success=' + encodeURIComponent('Author deleted successfully'));
    } catch (error) {
        console.error('Error deleting author:', error);
        res.redirect('/admin/author/edit/' + req.params.id + '?error=' + encodeURIComponent(error.message));
    }
});

module.exports = router;