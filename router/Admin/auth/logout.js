// libraries
const express = require('express');


// creating router
const router = express.Router({mergeParams : true});

router.post('/', async (req, res) =>{
    // if logged in, delete token from database
    if(req.admin !== null){
        res.clearCookie("adminSessionToken");
    }
    res.redirect('/admin/login');
});

module.exports = router;