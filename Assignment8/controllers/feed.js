const fs = require('fs');
const path = require('path');

const {validationResult} = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

const rootDir = require('../util/path');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;

    try {
        const result = await Post.findAndCountAll({
                            include:{model: User,attributes: ['id', 'name', 'email']}, 
                            offset:(currentPage -1) * perPage, 
                            limit: perPage 
                        });
        const totalItems = result.count;
        const posts = await result.rows;

        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            totalItems: totalItems
        });        
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    
};

exports.postCreatePost = async (req, res, next) => {
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

    try {
        // Create post in db
        const user = await User.findByPk(req.userId);

        if(!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        const post =  await user.createPost({
            title: title, 
            content: content,
            imageUrl: imageUrl
        });

        res.status(201).json({
            message: 'Post created successfully',
            post: post,
            creator: {_id: user.id, name: user.name}
        });
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;

    try{
        const post = await Post.findByPk(postId, {
            include:{
                model: User,
                attributes: ['id', 'name', 'email']
            }
        });
    
        if(!post) {
            const error = new Error('Could not find a post.');
            error.statusCode = 404;
            throw error;
        }
    
        res.status(200).json({
            message:'Post fetched.',
            post: post
        });
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
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

    try {
        const post = await Post.findByPk(postId);
    
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
    
        const result = await post.save();
    
        res.status(200).json({
            message: 'Post Updated',
            post: result
        });
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };

};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;

    try{
        const post = await Post.findByPk(postId);

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
        const result = await post.destroy();
    
        res.status(200).json({
            message: 'Deleted Post'
        });
    }
    catch(err){
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
};

//helper function for clearing image in project directory
const clearImage = filePath => {
    filePath = path.join(rootDir, filePath);
    fs.unlink(filePath, err => console.log(err));
};

