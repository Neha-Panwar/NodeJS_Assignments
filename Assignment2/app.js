const express = require('express');

const app = express();

//Part 1 of Assignment
// app.use((req, res, next) => {
//     console.log("This is Middleware 1");
//     next();
// });

// app.use((req, res, next) => {
//     console.log("This is Middleware 2");
//     next();
// });

// app.use((req, res, next) => {
//     console.log("This is Middleware 3");
//     res.send(`<h1>This is last middleware<h1>`);
// });


//Part 2 of Assignment

app.use('/users', (req, res, next) => {
    res.send(`
        <h2>User List</h2>
        <ul>
            <li>User 1</li>
            <li>User 2</li>
            <li>User 3</li>
        </ul>
    `);
});

app.use('/', (req, res, next) => {
    res.send(`<h1>This is a default request</h1>`);
});

app.listen(3000);