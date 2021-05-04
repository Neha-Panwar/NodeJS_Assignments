const Product = require('../models/product');


exports.getAddProduct = (req, res, next) => {

    if(!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
 
    res.render('admin/edit-product', {
      pageTitle:'Add Product', 
      path: '/admin/add-product',
      editing: false,
    //   isAuthenticated: req.session.isLoggedIn
    });
}

exports.postAddProduct = (req, res, next) => {
    
    // console.log(req.body);
    // products.push({title: req.body.title});

    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;

    console.log(req.body);
    console.log(req.session.user);

    //Newer code associated with dummy user
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
        .catch(err => console.log(err));

    //New code
    /**
     * Creating element with sequelize
     * there are various sequelize method like -
     * build() - it creates new element based on the model but only javascript and then we need to save it manually
     * create() - it also create new element based on the model and immdiately & automatically saves in database
     * like mysql, sequelize also works with promises and hence we can use then() and catch()
     */
    // Product.create({
    //     title: title,
    //     price: price,
    //     imageUrl: imageUrl,
    //     description: description,
    //     userId: req.user.id
    // })
    // .then((result) => {
    //     console.log('Created Product');
    //     res.redirect('/admin/products');
    // })
    // .catch(err => console.log(err));

    //Old code
    // const product = new Product(null, title, imageUrl, description, price);
    // product.save()
    //     .then(() => {
    //         res.redirect('/');
    //     })
    //     .catch((err) => console.log(err)); 
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;

    req.user.getProducts({where: {id: prodId}})
    // Product.findByPk(prodId)
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
                // isAuthenticated: req.session.isLoggedIn
              });
        })
        .catch(err => console.log(err));   
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId; //this productId variable name is set in edit-product.ejs file
    const updatedTitle = req.body.title;
    const updatedImageUrl = req.body.imageUrl;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    Product.findByPk(prodId)
        .then(product => {
            if(product.userId !== req.user.id) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            product.imageUrl = updatedImageUrl;
            return product.save()
            .then(result => {
                console.log("Updated Product");
                res.redirect('/admin/products');
            });
        })
        
        .catch(err => console.log(err));

    
};

exports.getProducts = (req, res, next) => {
    req.user.getProducts()
    // Product.findAll()
        .then(products => {
            res.render('admin/products', {
                pageTitle: 'Admin Products', 
                prods: products, 
                path: '/admin/products',
                // isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
    
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    // Product.destroy({});
    Product.findByPk(prodId)
        .then(product => {
           return product.destroy();
        })
        .then(result => {
            console.log("Deleted Product!");
            res.redirect('/admin/products');

        })
        .catch(err => console.log(err));

};