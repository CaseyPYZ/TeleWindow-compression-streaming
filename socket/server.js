var http = require('http');
var io = require('socket.io');
io = io(http);

var users = [];

io.on('connection', (socket) => {
    console.log("connect");
    users.push(socket);
    socket.on('file_transfer',(data)=>{
        io.broadcast.emit('sending_file',data);
        console.log(data);
    });
    console.log('a user connected');
});


http.createServer().listen(3000, () => {
    console.log('listening on *:3000');
});