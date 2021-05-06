const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const errorController = require('./controllers/error');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');


const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images');
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    } 
  });
  
  const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null, true);
    }
    else {
      cb(null, false);
    }
  };

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage , fileFilter: fileFilter}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

const store = new SequelizeStore({
    db: sequelize
});

const csrfProtection = csrf();

//Initialising session middleware
app.use(session({
    secret: 'my secret', 
    resave: false, 
    saveUninitialized: false,
    store: store
}));


store.sync();

app.use(csrfProtection);
app.use(flash());

//For every request this would be added whenever we render any view 
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
   if(!req.session.user) {
     return next();
   }
   User.findByPk(req.session.user.id)
    .then(user => {
        if(!user) {
            next();
        }
        req.user = user;
        next();
    })
    .catch(err => {
        next(new Error(err));
    });
});



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Error',
        path: '/500',
        data: error,
        isAuthenticated: req.session.isLoggedIn
    });
});


Product.belongsTo(User, {
    constraints: true, 
    onDelete: 'CASCADE'
});
User.hasMany(Product);

User.hasOne(Cart);
Cart.belongsTo(User);

//many to many relation
Cart.belongsToMany(Product, {through: CartItem});
Product.belongsToMany(Cart, {through: CartItem});

//1 - M relation
Order.belongsTo(User);
User.hasMany(Order);


Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);



sequelize.sync().then(result => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});

