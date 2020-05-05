var io = require('socket.io-client');


const socket = io.connect('http://localhost:3001');
socket.on('news', (data) => {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});
var file = "haha";
socket.emit('file_transfer',file);
socket.on('file_receive',(data)=>{
  console.log(data);
});