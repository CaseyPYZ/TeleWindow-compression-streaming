var io = require('socket.io-client');
const rs2 = require("node-librealsense")
// console.log(rs2);
const {GLFWWindow} = require('./glfw-window.js');
const {glfw} = require('./glfw-window.js');

const orle = require('orle');

const socket = io.connect('http://localhost:3001');
socket.on('news', (data) => {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});

var file = "haha";
socket.emit('file_transfer',file);

const win = new GLFWWindow(800, 450, 'Bag Streaming Test');
const colorizer = new rs2.Colorizer();

var count = 0;
let specs = {
  width: 0,
  height: 0
};

socket.on('meta',(data) => {
  specs.width = data.width;
  specs.height = data.height;
});


socket.on('file_receive',(data)=>{
  receive(data);
});

socket.on('sender_done',(data)=>{
  console.log(data);
  win.destroy();
});


/**
 * async Receive function
 * @param {ArrayBuffer} data
 */
async function receive(data){

  /*** ORLE DECODING ***
     * const depthMap = await orle.decode(data);
     */

  // +> TypeError: argument 0 of Colorizer.colorize() should be a/an Frame
  const obj = JSON.parse(data);  
  const depthMap = colorizer.colorize(obj);

  win.beginPaint();
  // const color = frameset.colorFrame;
  // console.log(color.width);
  // console.log(color.height);
  glfw.draw2x2Streams(win.window, 1,
      depthMap.data, 'rgb8', specs.width, specs.height,
      // color.data, 'rgb8', color.width, color.height
      );

  win.endPaint();

  count++;
  console.log(count);
  console.log(Date.now());

  // If window is closed
  if( win.shouldWindowClose() ){
    // END STREAMING
    socket.emit('receiver_break',{msg : "Receiver ended stream."});
  }
}