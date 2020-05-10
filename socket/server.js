const server = require('http').Server();
const io = require('socket.io')(server);

const rs2 = require("node-librealsense")
// console.log(rs2);
const {GLFWWindow} = require('./glfw-window.js');
const {glfw} = require('./glfw-window.js');

server.listen(3001);
var users = [];

const win = new GLFWWindow(800, 450, 'Bag Streaming Test');
var count = 0;

/****** Size Specifications of Display Window ******/
let specs = {
    width: 0,
    height: 0
};

/****** ASYNC RENDERING FUNCTION ******/
async function receive(data){
    
    const depthMap = new Uint8Array(data);
    
    win.beginPaint();
    // const color = frameset.colorFrame;
    // console.log(color.width);
    // console.log(color.height);
    glfw.draw2x2Streams(win.window, 1,
        depthMap, 'rgb8', specs.width, specs.height,
        // color.data, 'rgb8', color.width, color.height
        );
    win.endPaint();
    count++;
    console.log(count);
    console.log(Date.now());
    // If window is closed
    if( win.shouldWindowClose() ){
        // END STREAMING
        socket.broadcast.emit('receiver_break',{msg : "Receiver ended stream."});
    }
}

/****** SERVER AS RECEIVING CLIENT ******/

io.on('connection', (socket) => {
    users.push(socket);
    // console.log(users);
    console.log("connect");
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', (data) => {
    // console.log(data);
    });
    
    /****** Setting Size Specifications ******/
    socket.on('meta',(data) => {
        specs.width = data.width;
        specs.height = data.height;
    });

    socket.on("file_transfer",(data)=>{
        count++;
        console.log(count);
        console.log(Date.now());

        receive(data);

        // OLD
        //socket.broadcast.emit('file_receive',data);
    });

    socket.on('sender_done',(data)=>{
        win.destroy();

        // OLD
        // socket.broadcast.emit('sender_done',data);
    });

    // OLD
    // socket.on('receiver_break',(data)=>{
    //     socket.broadcast.emit('receiver_break',data);
    // });
});

