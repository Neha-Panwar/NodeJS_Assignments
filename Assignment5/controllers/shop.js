// const products = [];

const Product = require('../models/product');


exports.getProducts = (req, res, next) => {

    Product.findAll()
        .then(products => {
            res.render('shop/product-list', {
                pageTitle: 'All Products', 
                prods: products, 
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        });
    
};

exports.getProduct = (req, res, next) => {

    const prodId = req.params.productId;

    //Using findAll() along with where condition
    Product.findAll({where: { id: prodId } })
        .then(products => {
            res.render('shop/product-detail', {
                pageTitle: products[0].title, 
                product: products[0], 
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        });


};

exports.getIndex = (req, res, next) => {
    Product.findAll()
        .then(products => {
            res.render('shop/index', {
                pageTitle: 'My Shop', 
                prods: products, 
                path: '/',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getCart = (req, res, next) => {

    req.user.getCart()
        .then(cart => {
            // console.log(cart);
            return cart.getProducts();
        })
        .then(products => {
            res.render('shop/cart', {
                pageTitle: 'Your Cart',
                path: '/cart',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));

}

exports.postCart = (req, res, next) => {

    const prodId = req.body.productId;
    let fetchedCart;
    let newQuantity = 1;

    req.user.getCart()
    .then(cart => {
        fetchedCart = cart;
        return cart.getProducts({where: {id: prodId}});
    })
    .then(products => {
        let product;
        if(products.length > 0){
            product = products[0];
        }
        
        if(product){
            const oldQuantity = product.cartItem.quantity;
            newQuantity = oldQuantity + 1;
            return product;
        }

        //adding the product for 1st time
        return Product.findByPk(prodId)
           
    })
    .then(product => {
        return fetchedCart.addProduct(product, {
            through: {quantity: newQuantity} 
        });
    })
    .then(() => {
        res.redirect('/cart');
    })
    .catch(err => console.log(err));


    // Product.findById(prodId, (product) => {
    //     Cart.addProduct(prodId, product.price);
    // });
    // res.redirect('/cart');
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.getCart()
        .then(cart => {
            return cart.getProducts({where: {id: prodId}});
        })
        .then(products => {
            const product = products[0];
            product.cartItem.destroy();
        })
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));

}

exports.postOrder = (req, res, next) => {
    let fetchedCart;
    req.user.getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts();
        })
        .then(products => {
            // console.log(products);
            return req.user.createOrder()
                .then(order => {
                    // order.addProduct(products, {through: .....});
                    return order.addProduct(products.map(product => {
                        product.orderItem = {quantity: product.cartItem.quantity};
                        return product;
                    }));
                })
                .catch(err => console.log(err));
        })
        .then(result => {
            return fetchedCart.setProducts(null);
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));
};


exports.getOrders = (req, res, next) => {
    req.user.getOrders({include: ['products']})
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Your Orders',
                path: '/orders',
                orders: orders,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
    
};
