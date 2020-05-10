

const server = require('http').Server();
const io = require('socket.io')(server);

server.listen(3001,"10.209.7.238");
var users = []

var count = 0;

io.on('connection', (socket) => {
    users.push(socket);
    // console.log(users);
    console.log("connect");
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', (data) => {
    // console.log(data);
    });
    socket.on('meta',(data)=>{
        // console.log(data);
        socket.broadcast.emit('meta',data);
    });
    socket.on("file_transfer",(data)=>{
        count++;
        console.log(count);
        console.log(Date.now());
        socket.broadcast.emit('file_receive',data);
    });
    socket.on('sender_done',(data)=>{
        socket.broadcast.emit('sender_done',data);
    });
    socket.on('receiver_break',(data)=>{
        socket.broadcast.emit('receiver_break',data);
    })
});

