const http = require('http');

const server = http.createServer((req, res) =>{
    const url = req.url;
    const method = req.method;
    if(url === '/'){
        res.write(`
            <html>
                <head>
                    <title>Assignment 1</title>
                </head>
                <body>
                    <h2>Hello Everyone!</h2>
                    <form action="/create-user" method="POST">
                        <input type="text" name="username">
                        <button type="submit">Create User</button>
                    </form>
                </body>
            </html>
        `);
        return res.end;
    }
    if(url === '/create-user' && method === 'POST'){
        const body = [];
        req.on('data', (chunk)=>{ body.push(chunk); });
        req.on('end', ()=>{
            const parseBody = Buffer.concat(body).toString();
            const userName = parseBody.split("=")[1];
            console.log(userName);
            res.writeHead(302, {'Location':'/'});
            return res.end();
        });
    }
    if(url === '/users'){
        res.write(`
            <html>
                <head><title>Assignment 1</title></head>
                <body>
                    <h3>List of Users</h3>
                    <ul>
                        <li>Neha</li>
                        <li>John</li>
                        <li>Celine</li>
                    </ul>
                </body>
            </html>
        `);
        return res.end;
    }
});

server.listen(3000);