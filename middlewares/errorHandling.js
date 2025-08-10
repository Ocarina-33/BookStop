// libraries
const jwt = require('jsonwebtoken');

// my modules
const DB_auth = require('../Database/DB-auth-api');

function auth(req, res, next){
    req.user = null;
    
    const token = req.cookies.sessionToken;
    if(!token) return next();
    
    // verify token was made by server
    jwt.verify(token, process.env.APP_SECRET, async (err, decoded) =>{
        if(err){
            console.log("ERROR at verifying token: " + err.message);
            next();
        } else {
            // get user prompt (id, handle, message count) from id
            const decodedId = decoded.id;
            let results = await DB_auth.getLoginInfoByID(decodedId);

            // if no such user or token doesn't match, do nothing
           if(results.length == 0){
                //console.log('auth: invalid cookie');
            } else{
                // set prompt in reqest object
                let time = new Date();
              //  await DB_auth.updateLoginTimeById(decodedId, time);

                req.user = {
                    id: decodedId,
                    EMAIL: results[0].EMAIL,
                    NAME: results[0].NAME,
                    IMAGE:results[0].IMAGE
                }
            }
            next();
        }
    });
}

function adminAuth(req, res, next){
    req.admin = null;
    
    const token = req.cookies.adminSessionToken;
    if(!token) return next();
    
    // verify token was made by server
    jwt.verify(token, process.env.APP_SECRET, async (err, decoded) =>{
        if(err){
            console.log("ERROR at verifying token: " + err.message);
            next();
        } else {
            // get user prompt (id, handle, message count) from id
            const decodedId = decoded.superid;

            // if no such user or token doesn't match, do nothing
            if(decodedId !== 7){
                //console.log('auth: invalid cookie');
            }else{
                req.admin = {
                    NAME: 'Admin'
                }
            }
            next();
        }
    });
}
// middlewares/errorHandling.js

// 404 handler
function notFound(req, res, next) {
  res.status(404).render('404', {
    title: 'Page Not Found',
    user: req.user || null,
    errors: []
  });
}

// general error handler
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    error: err,
    user: req.user || null,
  });
}


module.exports = {
    auth,
    adminAuth,
    notFound,
    errorHandler
};