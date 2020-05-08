

const server = require('http').Server();
const io = require('socket.io')(server);

server.listen(3001);
var users = []

io.on('connection', (socket) => {
    users.push(socket);
    // console.log(users);
    console.log("connect");
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', (data) => {
    // console.log(data);
    });
    socket.on("file_transfer",(data)=>{
        console.log(data);
        socket.broadcast.emit('file_receive',data);
    });
    socket.on('done',(data)=>{
        socket.broadcast.emit('finish',data);
    });
});

