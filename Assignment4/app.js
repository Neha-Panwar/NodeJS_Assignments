const express = require('express');
const bodyParser = require('body-parser');

const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/users');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended: false}));

app.use(homeRoutes.routes);
app.use(userRoutes);

app.use((req, res, next) => {
  res.status(404).render('404', {pageTitle: 'Page not found'});
});

app.listen(3000);
