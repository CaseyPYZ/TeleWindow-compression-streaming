var io = require('socket.io-client');
const rs2 = require("node-librealsense")
// console.log(rs2);
const {GLFWWindow} = require('./glfw-window.js');
const {glfw} = require('./glfw-window.js');

//add 3d video

// A GLFW Window to display the captured image
const win = new GLFWWindow(1280, 720, 'Node.js Capture Example');

// Colorizer is used to map distance in depth image into different colors
const colorizer = new rs2.Colorizer();

//const file = '/Users/michaelzhang/Desktop/CS_Capstone/test_files/d435i_walking.bag';
const file = '/Users/user/Desktop/CS_Capstone/test_files/d435i_walking.bag';

let cfg = new rs2.Config();
cfg.enableDeviceFromFile(file);
let pipeline = new rs2.Pipeline();
pipeline.start(cfg);


const socket = io.connect('http://localhost:3001');
socket.on('news', (data) => {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});

// var file2 = "monstor1";
// socket.emit('file_transfer',file2);

socket.on('file_receive',(data)=>{
  console.log(data);
});

const judge = true;
// let frameset = pipeline.waitForFrames();
// let depthMap = colorizer.colorize(frameset.depthFrame);
// setInterval(() => {
    
//     socket.emit('file_transfer',"balabala3");
//     console.log("depthMap");
//     // frameset = pipeline.waitForFrames();
//     // depthMap = colorizer.colorize(frameset.depthFrame);
    
// }, 1000/30);
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function trans() {
    let count = 0;
    while(count<300){
        const frameset = pipeline.waitForFrames();
        const depthMap = colorizer.colorize(frameset.depthFrame);
        socket.emit('file_transfer',depthMap.data.buffer);
        // console.log("depthMap");
        await sleep(1);
        count += 1;
    }
    socket.emit('done',"donedone");
    pipeline.stop();
    pipeline.destroy();
    win.destroy();
    rs2.cleanup();
}

trans()

