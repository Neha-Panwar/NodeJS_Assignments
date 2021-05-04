const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const csrf = require('csurf');
const flash = require('connect-flash');

//initialize sequelize with session store
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

app.set('view engine', 'ejs');
app.set('views', 'views');

/**
 * With  promise we use function like then() and catch()
 * These are function which we can chain onto the result of execute call
 * Promise is basic js object, not specific to node
 * Its allows us to work with asynchronous code, without using callbacks

 */
// db.execute('select * from products')
//     .then((result) => {
//         console.log(result[0], result[1]);
//     })
//     .catch((err) => {
//         console.log(err);
//     });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

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

app.use((req, res, next) => {
   if(!req.session.user) {
     return next();
   }
   User.findByPk(req.session.user.id)
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => console.log(err));
});

//For every request this would be added whenever we render any view 
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


app.use(errorController.get404);

/**
 * sequelize.sync() will go through all the models in our application
 * and assign tables for them.
 * If no table in database, it will create one
 * If table is there then it will load it for the particular model
 * Then we can listen to the result of this i.e what we get back as response
 * We can also catch the potential errors that occured
 * And lets say we only want to start the server when this is successful
 */

// Product.belongsTo(User);
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

Order.belongsToMany(Product, {through : OrderItem});


sequelize.sync().then(result => {

    app.listen(3000);
})
.catch(err => {
    console.log(err);
});



// sequelize.sync().then(result => {
//     app.listen(3000);
// })
// .catch(err => {
//     console.log(err);
// });
