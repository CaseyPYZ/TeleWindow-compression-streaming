const io = require('socket.io-client');
const rs2 = require("node-librealsense")
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

let lookahead = false;
let streamOn = true;

const socket = io.connect('http://localhost:3001');
socket.on('news', (data) => {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});


// socket.on('file_receive',(data)=>{
//   console.log(data);
// });

socket.on('receiver_break',(data)=>{
  console.log(data.msg);
  streamOn = false;
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

/**
 * Transfer data
 */
async function trans() {

    let count = 0;
    while(streamOn){
      //const frameset = pipeline.waitForFrames();
      const frameset = pipeline.pollForFrames();
      if(frameset){
        const depthMap = colorizer.colorize(frameset.depthFrame);

        // Emit Metadata First
        if(!lookahead){
          let specifics = {
            width: depthMap.width,
            height: depthMap.height
          };
          socket.emit('meta', specifics);
          lookahead = true;
        }

        socket.emit('file_transfer',depthMap.data.buffer);
        await sleep(34);
        count += 1;
        console.log(count);
        if(count>=100){
          console.log("Ending.");
          break;
        }
      }
    }

    socket.emit('sender_done',"Sender done.");
    pipeline.stop();
    pipeline.destroy();
    win.destroy();
    rs2.cleanup();
}

trans()