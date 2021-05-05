const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const sequelize = require('./util/database');
const rootDir = require('./util/path');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');


const Post = require('./models/post');
const User = require('./models/user');

const app = express();

//file or image upload
const fileStorage = multer.diskStorage({
    destination: (req, filename, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        // cb(null, new Date().toISOString() + file.originalname);
        let fname = uuidv4() + '_' + file.originalname;
        cb(null, fname);
    }
});

//filter image files for upload
const fileFilter = (req, file, cb) => {
    if(
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg'
    ){
        cb(null, true);
    }
    else{
        cb(null, false);
    }
};

app.use(bodyParser.json());
app.use(
    multer({storage: fileStorage, fileFilter: fileFilter}).single('image')
);
app.use('/images', express.static(path.join(rootDir, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);


app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data
    res.status(status).json({message: message, data: data});
});

//1-M relation
Post.belongsTo(User);
User.hasMany(Post);


sequelize.sync()
.then(result => {
    app.listen(8080);
})
.catch(err => {
    console.log(err);
});

