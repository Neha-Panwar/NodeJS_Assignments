const express = require('express');
const { body } = require('express-validator');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post('/post', isAuth, [
    body('title', 'Title must have atleast 5 characters')
        .trim()
        .notEmpty()
        .isLength({min: 5}),
    body('content', 'Content must have atleast 5 characters')
        .trim()
        .notEmpty()
        .isLength({min: 5})
], feedController.postCreatePost);

router.get('/post/:postId', isAuth, feedController.getPost);

router.put('/post/:postId', isAuth, [
    body('title')
        .trim()
        .notEmpty()
        .isLength({min: 5}),
    body('content')
        .trim()
        .notEmpty()
        .isLength({min: 5})
], feedController.updatePost);

router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;