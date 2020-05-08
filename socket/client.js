var io = require('socket.io-client');
const rs2 = require("node-librealsense")
// console.log(rs2);
const {GLFWWindow} = require('./glfw-window.js');
const {glfw} = require('./glfw-window.js');

//add 3d video
const framebuffer = [];
// A GLFW Window to display the captured image
const win = new GLFWWindow(1280, 720, 'Node.js Capture Example');

// Colorizer is used to map distance in depth image into different colors
const colorizer = new rs2.Colorizer();

// const file = '/Users/michaelzhang/Desktop/CS_Capstone/test_files/d435i_walking.bag';
// let cfg = new rs2.Config();
// cfg.enableDeviceFromFile(file);
// let pipeline = new rs2.Pipeline();
// pipeline.start(cfg);


const socket = io.connect('http://localhost:3001');
socket.on('news', (data) => {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});
// var file = "haha";
// socket.emit('file_transfer',file);
// socket.on('file_receive',(data)=>{
//   console.log(data);
// });
socket.on('file_receive',(data)=>{
  // console.log(data);
  var array = new Uint8Array(data);
  framebuffer.push(array);
  console.log(data);
});

let count = 1;
let judge_income = false;
while (! win.shouldWindowClose()) {
  // const frameset = pipeline.waitForFrames();
  // Build the color map
  // const depthMap = colorizer.colorize(frameset.depthFrame);
    // send my frame and receive other's frame
  // socket.emit('file_transfer',depthMap_send);
  // const judge = true;
  // const depthMap;
  if(count<=framebuffer.length){
    const depthMap = framebuffer[count-1];
    console.log(depthMap);
    count += 1;
    judge_income = true;
  }
  if (judge_income) {
        // Paint the images onto the window
        win.beginPaint();
        // const color = frameset.colorFrame;
        // console.log(color.width);
        // console.log(color.height);
        glfw.draw2x2Streams(win.window, 1,
            depthMap, 'rgb8', 640, 480,
            // color.data, 'rgb8', color.width, color.height
            );
        win.endPaint();
        // judge = true;
      }
}


// pipeline.stop();
// pipeline.destroy();
// win.destroy();
// rs2.cleanup();


// const socket = io.connect('http://localhost:3001');
// socket.on('news', (data) => {
//   console.log(data);
//   socket.emit('my other event', { my: 'data' });
// });
// var file = "haha";
// socket.emit('file_transfer',file);
// socket.on('file_receive',(data)=>{
//   console.log(data);
// });