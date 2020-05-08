var io = require('socket.io-client');
const rs2 = require("node-librealsense")
// console.log(rs2);
const {GLFWWindow} = require('./glfw-window.js');
const {glfw} = require('./glfw-window.js');

const socket = io.connect('http://localhost:3001');
socket.on('news', (data) => {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});
var file = "haha";
socket.emit('file_transfer',file);

const win = new GLFWWindow(1280, 720, 'Node.js Capture Example');

socket.on('file_receive',(data)=>{
//   console.log(data);
  const depthMap = new Uint8Array(data);
  win.beginPaint();
  // const color = frameset.colorFrame;
  // console.log(color.width);
  // console.log(color.height);
  glfw.draw2x2Streams(win.window, 2,
      depthMap, 'rgb8', 640, 480,
      // color.data, 'rgb8', color.width, color.height
      );
  win.endPaint();

});

socket.on('finish',(data)=>{
    win.shouldWindowClose();
});