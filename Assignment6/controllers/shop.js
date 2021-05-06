const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const OrderItem = require('../models/order-item');


exports.getProducts = (req, res, next) => {

    Product.findAll()
        .then(products => {
            res.render('shop/product-list', {
                pageTitle: 'All Products', 
                prods: products, 
                path: '/products'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    
};

exports.getProduct = (req, res, next) => {

    const prodId = req.params.productId;

    Product.findAll({where: { id: prodId } })
        .then(products => {
            res.render('shop/product-detail', {
                pageTitle: products[0].title, 
                product: products[0], 
                path: '/products'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getIndex = (req, res, next) => {
    Product.findAll()
        .then(products => {
            res.render('shop/index', {
                pageTitle: 'My Shop', 
                prods: products, 
                path: '/',
                
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCart = (req, res, next) => {

    req.user.getCart()
        .then(cart => {
            return cart.getProducts();
        })
        .then(products => {
            res.render('shop/cart', {
                pageTitle: 'Your Cart',
                path: '/cart',
                products: products
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

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
        return Product.findByPk(prodId);
           
    })
    .then(product => {
        return fetchedCart.addProduct(product, {
            through: {quantity: newQuantity} 
        });
    })
    .then(() => {
        res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

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
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

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
                    products.forEach(product => {
                        order.createOrderItem({ productname: product.title, productprice: product.price, quantity: product.cartItem.quantity});
                    })
                })
                .catch(err => console.log(err));
        })
        .then(result => {
            return fetchedCart.setProducts(null);
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.getOrders = (req, res, next) => {
    req.user.getOrders({include: {model:OrderItem}})
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Your Orders',
                path: '/orders',
                orders: orders
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    
};

//Downloading invoice file as pdf (only authorized user)
exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    
    OrderItem.findAll({
                        where: {orderId: orderId},
                        include: [Order] 
    })
    .then(orderItems =>{


        if(orderItems.length < 1) {
            return next(new Error("No order found."));
        }

        if(orderItems[0].order.userId !== req.user.id){
            return next(new Error("Unauthorized."));
        }

        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);
        

        //Creating pdf on fly
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition', 
          'inline; filename="' + invoiceName + '"'
        );

        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
  
        pdfDoc.fontSize(26).text('Invoice', {
          underline: true
        });

        pdfDoc.text('--------------------------');
        let totalPrice = 0;

        orderItems.forEach(item => {
            totalPrice = totalPrice + item.quantity * item.productprice;
            // console.log("****"+item.product.title+ "****"+ item.product.price+"***"+item.quantity+"***");

            pdfDoc.fontSize(14).text(
                item.productname + 
                ' : ' + 
                item.quantity + 
                ' x ' + 
                ' $' + 
                item.productprice
            );
        });
        
        pdfDoc.text('------');
        pdfDoc.fontSize(16).text("Total Price: $" + totalPrice);
  
        pdfDoc.end();
    })
    .catch(err => {
        next(err);
    });
    
  };