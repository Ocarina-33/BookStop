// libraries
const express = require('express');
// creating router
const router = express.Router({mergeParams : true});

const DB_publisher = require('../../../Database/DB-publisher-api');

router.get('/', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    const searchTerm = req.query.search || '';
    let publishersResult;
    
    if (searchTerm) {
        publishersResult = await DB_publisher.searchPublishers(searchTerm);
    } else {
        publishersResult = await DB_publisher.getAllPublishers();
    }
    
    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminPublisherAll',
        publishers:publishersResult,
        searchTerm: searchTerm
    });
});


router.get('/edit/:id', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    const publisherResult = await DB_publisher.getPublisherByID(req.params.id);
    if( publisherResult.length === 0 ) return res.redirect('/admin/publisher');
    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminPublisherEdit',
        publisher:publisherResult[0]
    });
});
router.get('/add', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');

    res.render('adminLayout.ejs', {
        title:'home',
        page:'adminPublisherAdd',

    });
});
router.post('/add', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    console.log(req.body);
    const {name, image, founding_date} = req.body;
    await DB_publisher.addPublisher(name, image, founding_date);
    return res.redirect('/admin/publisher');
});

router.post('/edit', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    console.log(req.body);
    const {id, name, image, founding_date} = req.body;
    await DB_publisher.updatePublisher(id, name, image, founding_date);
    return res.redirect('/admin/publisher');
});

router.post('/delete/:id', async (req, res) => {
    if (req.admin == null) {
        return res.redirect('/admin/login');
    }
    
    try {
        const publisherId = req.params.id;
        await DB_publisher.deletePublisher(publisherId);
        res.redirect('/admin/publisher?success=' + encodeURIComponent('Publisher deleted successfully'));
    } catch (error) {
        console.error('Error deleting publisher:', error);
        res.redirect('/admin/publisher/edit/' + req.params.id + '?error=' + encodeURIComponent(error.message));
    }
});

module.exports = router;