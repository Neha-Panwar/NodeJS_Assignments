const {validationResult} = require('express-validator');

const Product = require('../models/product');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {

    if(!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
 
    res.render('admin/edit-product', {
      pageTitle:'Add Product', 
      path: '/admin/add-product',
      editing: false,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });
}

exports.postAddProduct = (req, res, next) => {

    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    
    if(!image) {
        return res.status(422).render('admin/edit-product', {
          pageTitle: 'Add Product',
          path: '/admin/add-product',
          editing: false,
          hasError: true,
          product: {
            title: title,
            price: price,
            description: description
          },
          errorMessage: 'Attached file is not an image.',
          validationErrors: []
        });
    }

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).render('admin/edit-product', {
            pageTitle:'Add Product', 
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                        title: title,
                        price: price,
                        description: description
                    },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
          });
    }

    const imageUrl = image.path;

    req.user
        .createProduct({
            title: title,
            price: price,
            imageUrl: imageUrl,
            description: description
        })
        .then(result => {
            console.log("Created Product");
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;

    req.user.getProducts({where: {id: prodId}})
        .then(products => {
            const product = products[0];
            if(!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle:'Edit Product', 
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: []
              });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }); 
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImage = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        return res.status(422).render('admin/edit-product', {
            pageTitle:'Edit Product', 
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
          });
    }

    Product.findByPk(prodId)
        .then(product => {
            if(product.userId !== req.user.id) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            if(updatedImage) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = updatedImage.path;
            }
            return product.save()
            .then(result => {
                console.log("Updated Product");
                res.redirect('/admin/products');
            });
        })
        
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

    
};

exports.getProducts = (req, res, next) => {
    req.user.getProducts()
        .then(products => {
            res.render('admin/products', {
                pageTitle: 'Admin Products', 
                prods: products, 
                path: '/admin/products',
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findByPk(prodId)
        .then(product => {
            if(!product){
                return next(new Error('Product not found'));
            }

            if(product.userId !== req.user.id) {
                return res.redirect('/');
            }

            fileHelper.deleteFile(product.imageUrl);
            return product.destroy();
        })
        .then(result => {
            console.log("Deleted Product!");
            res.redirect('/admin/products');

        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};