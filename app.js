// // app.js
// const express = require('express');
// const path = require('path');
// const cookieParser = require('cookie-parser');

// const { auth, adminAuth } = require('./middlewares/auth');

// // Importing routers
// const loginRouter  = require('./routes/auth/login');
// const signupRouter = require('./routes/auth/signup');
// const logoutRouter = require('./routes/auth/logout');
// const indexRouter  = require('./routes/index');    
// const cartRouter   = require('./routes/Cart/cart'); 
// const 

// // (need to add more by building out books, cart, etc.)

// const app = express();

// // view engine
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// // middleware
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(auth);
// app.use(adminAuth);

// // static assets
// app.use(express.static(path.join(__dirname, 'public')));

// // mount routers
// app.use('/',       indexRouter);
// app.use('/login',  loginRouter);
// app.use('/signup', signupRouter);
// app.use('/logout', logoutRouter);
// app.use('/cart',   cartRouter);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).render('layout', {
//     title: '404 Not Found',
//     body:'404',
//     user: req.user,
//     errors: []
//   });
// });

// module.exports = app;


// libraries
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// middlewares/
const errorHandling = require('./middlewares/errorHandling');
const auth = require('./middlewares/auth').auth;

// router
const router = require('./router/indexRouter');
const adminRouter = require('./router/adminIndexRouter');
// app creation
const app = express();

// using libraries
// app.use(fileUpload({ createParentPath : true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(morgan('tiny'));

// Debug middleware to see all requests
app.use((req, res, next) => {
    console.log(`=== REQUEST: ${req.method} ${req.url} ===`);
    next();
});

// setting ejs to be view engine
app.set('view engine', 'ejs');

// allow public directory
app.use(express.static('public'))

// Inject top genres for navigation
const DB_book = require('./Database/DB-book-api');
app.use(async (req, res, next) => {
    try {
        const topGenres = await DB_book.getTopGenresForNav(5);
        res.locals.topGenres = topGenres;
    } catch (error) {
        console.error('Error fetching top genres:', error);
        res.locals.topGenres = [];
    }
    next();
});

//app.set('strict routing', true);
// using router
console.log('=== REGISTERING ADMIN ROUTES ===');
app.use('/admin', (req, res, next) => {
  console.log('Admin route hit:', req.method, req.url);
  next();
}, adminRouter);
console.log('=== REGISTERING USER ROUTES ===');
app.use(auth);
app.use('/', router);


// using error handling middlware
app.use(errorHandling.notFound);

app.use(errorHandling.errorHandler);

module.exports = app;