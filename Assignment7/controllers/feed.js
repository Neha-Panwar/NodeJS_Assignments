const fs = require('fs');
const path = require('path');

const {validationResult} = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

const rootDir = require('../util/path');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;

    Post.findAndCountAll({
        include:{
            model: User,
            attributes: ['id', 'name', 'email']
        }, 
        offset:(currentPage -1) * perPage, 
        limit: perPage 
    })
    .then(result => {
        totalItems = result.count;
        return result.rows;
    })
    .then(posts => {
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            totalItems: totalItems
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.postCreatePost = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    if(!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw err;
    }

    const title = req.body.title;
    const content = req.body.content;
    const imageUrl  = req.file.path.replace("\\", "/");
    let creator;

    // Create post in db
    User.findByPk(req.userId)
    .then(user => {

        if(!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        creator = user;
        return user.createPost({
            title: title, 
            content: content,
            imageUrl: imageUrl
        });
    })
    .then(result => {
        res.status(201).json({
            message: 'Post created successfully',
            post: result,
            creator: {_id: creator.id, name: creator.name}
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
    
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findByPk(postId, {
        include:{
            model: User,
            attributes: ['id', 'name', 'email']
        }
    })
    .then(post => {
        if(!post) {
            const error = new Error('Could not find a post.');
            error.statusCode = 404;
            throw error;
        }
    
        res.status(200).json({
            message:'Post fetched.',
            post: post
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        console.log(errors.array());
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file) {
        imageUrl = req.file.path.replace("\\", "/");
    }
    if(!imageUrl){
        const error = new Error('No file picked');
        error.statusCode = 422;
        throw error;
    }

    Post.findByPk(postId)
    .then(post => {
        if(!post) {
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;
        }
        if(post.userId !== req.userId) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }
        if(imageUrl !== post.imageUrl){
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        return post.save();
    })
    .then(result => {
        res.status(200).json({
            message: 'Post Updated',
            post: result
        });
    }) 
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });

};

exports.deletePost =(req, res, next) => {
    const postId = req.params.postId;
    Post.findByPk(postId)
    .then(post => {
        if(!post) {
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;
        }

        //Check loggedin user
        if(post.userId !== req.userId) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }

        clearImage(post.imageUrl);
        return post.destroy();
    })
    .then(result => {
        res.status(200).json({
            message: 'Deleted Post'
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

//helper function for clearing image in project directory
const clearImage = filePath => {
    filePath = path.join(rootDir, filePath);
    fs.unlink(filePath, err => console.log(err));
};

