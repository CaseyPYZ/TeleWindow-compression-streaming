var ioClient = require('socket.io-client');

const socket = ioClient.connect('http://localhost:3000');


'use strict';

const rs2 = require('node-librealsense');
// const {GLFWWindow} = require('./glfw-window.js');
// const {glfw} = require('./glfw-window.js');


file = "test";
socket.emit('connection',()=>{});
socket.on('sending_file', (data) => {
  console.log(data);
});

socket.emit('file_transfer',{file});

