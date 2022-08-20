if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express ();
const path = require ('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require ('method-override');
const morgan = require('morgan');
const AppError = require('./apperror');
const ExpressError = require('./utils/ExpressError');
const Review = require('./models/review');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user')
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet')
const MongoDBStore  = require('connect-mongo');

const userRoutes = require ('./routes/users')
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const dbUrl = 'mongodb://localhost:27017/yelp-camp';
// process.env.DB_URL || for real production envirfonment -> process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
// 'mongodb://localhost:27017/yelp-camp'
// process.env.DB_URL;
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'));
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(
    mongoSanitize({
      replaceWith: '_',
    }),
  );

const secret = process.env.SECRET || 'secret';

const store = MongoDBStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function(e){
    console.log('session store error', e)
})

const sessionsConfig = {
    store,
    name: '__session',
    secret: 'secret',
    resave: false,  //to get rid of session depercastion runnings go away in git bash (server)
    saveUninitialized: true,
    // secrue: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //expire so that they do not stay logged in forever.
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionsConfig))
app.use(flash());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/daxtkw7cw/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/daxtkw7cw/"
];
const connectSrcUrls = [
    "https://*.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://res.cloudinary.com/daxtkw7cw/"
];
const fontSrcUrls = [ "https://res.cloudinary.com/daxtkw7cw/" ];
 
app.use(
    helmet.contentSecurityPolicy({
        directives : {
            defaultSrc : [],
            connectSrc : [ "'self'", ...connectSrcUrls ],
            scriptSrc  : [ "'unsafe-inline'", "'self'", ...scriptSrcUrls ],
            styleSrc   : [ "'self'", "'unsafe-inline'", ...styleSrcUrls ],
            workerSrc  : [ "'self'", "blob:" ],
            objectSrc  : [],
            imgSrc     : [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/daxtkw7cw/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
                "https://images.unsplash.com/",
                "https://source.unsplash.com/random/500x500?camping"
            ],
            fontSrc    : [ "'self'", ...fontSrcUrls ],
            mediaSrc   : [ "https://res.cloudinary.com/dv5vm4sqh/" ],
            childSrc   : [ "blob:" ]
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use ((req, res, next) => {
    console.log(req.query);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


// app.use((req, res, next) => {
//     req.requestTime = Date.now();
//     console.log (req.method, req.path);
//     next();
// })

app.get('/fakeUser', async (req, res) => {
    const user = new User({email: 'colt@gmail.com', username: 'colt'});
    const newUser = await User.register(user, 'colt')
    res.send(newUser);
})

app.use('/', userRoutes)
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)


app.get('/', (req,res)=>{
    res.render('home')
})


app.all('*', (req, res, next)=> {
    next(new ExpressError('Page Not Found', 404)) // the new keyword is used in javascript to create a object from a constructor function.
}) //* -> every path

app.use((err, req, res, next)=> {
    const {statusCode = 500, message = 'something is wrong'} = err; // if no tatuscode = 500 / message = something is wrong // err being from the previous 
    if (!err.message) err.message = 'oh no, something went wrong!'
    res.status(statusCode).render('error', { err });
})

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`serving on port ${port}`)
})