'use strict';

/****************************************************************************
* RS setup
****************************************************************************/
const WIDTH = 640;
const HEIGHT = 480;

const rs2 = require('node-librealsense');

const {GLFWWindow} = require('./js/glfw-window.js');
const {glfw} = require('./js/glfw-window.js');

const win = new GLFWWindow(1280, 720, 'Node.js Capture Example');

const colorizer = new rs2.Colorizer();  // This will make depth image pretty
const pipeline = new rs2.Pipeline();  // Main work pipeline of RealSense camera

const filePath = "/Users/user/Desktop/CS_Capstone/test_files/depth_under_water.bag ";
let cfg = new rs2.Config();
 

////// BUTTONS //////
var loadBagBtn = document.getElementById('loadBag');
var streamBagBtn = document.getElementById('streamBag');

// Attach event handlers
loadBagBtn.addEventListener('click', loadBagStream);
streamBagBtn.addEventListener('click', streamBagFrames);

////// GLOBAL VARIABLES NEEDED ?
// Get a set of frames
const localFrameset = null;  
const localDepthArray = null;
const localColorArray = null;

// const remoteDepthArray;
// const remoteColorArray;

// snap - choose file & start pipeline ?

////// //////

// const depth = frameset.depthFrame;  // Get depth data
// const depthRGB = colorizer.colorize(depth);  // Make depth image pretty
// const color = frameset.colorFrame;  // Get RGB image

// // TODO: use frame buffer data
// depthRGB.getData();
// color.getData();

// // Before exiting, do cleanup.
// rs2.cleanup();

/****************************************************************************
* Initial setup
****************************************************************************/

// var configuration = {
//   'iceServers': [{
//     'urls': 'stun:stun.l.google.com:19302'
//   }]
// };

var configuration = null;

// var roomURL = document.getElementById('url');
var video = document.querySelector('video');
var photo = document.getElementById('photo');
var photoContext = photo.getContext('2d');
var trail = document.getElementById('trail');
var snapBtn = document.getElementById('snap');
var sendBtn = document.getElementById('send');
var snapAndSendBtn = document.getElementById('snapAndSend');

var photoContextW;
var photoContextH;

// Attach event handlers
snapBtn.addEventListener('click', snapPhoto);
sendBtn.addEventListener('click', sendPhoto);
snapAndSendBtn.addEventListener('click', snapAndSend);

// Disable send buttons by default.
sendBtn.disabled = true;
snapAndSendBtn.disabled = true;

// Create a random room if not already present in the URL.
var isInitiator;
var room = window.location.hash.substring(1);
if (!room) {
  room = window.location.hash = randomToken();
}


/****************************************************************************
* Signaling server
****************************************************************************/

// Connect to the signaling server
var socket = io.connect();

socket.on('ipaddr', function(ipaddr) {
  console.log('Server IP address is: ' + ipaddr);
  // updateRoomURL(ipaddr);
});

socket.on('created', function(room, clientId) {
  console.log('Created room', room, '- my client ID is', clientId);
  isInitiator = true;
  grabWebCamVideo();
});

socket.on('joined', function(room, clientId) {
  console.log('This peer has joined room', room, 'with client ID', clientId);
  isInitiator = false;
  createPeerConnection(isInitiator, configuration);
  grabWebCamVideo();
});

socket.on('full', function(room) {
  alert('Room ' + room + ' is full. We will create a new room for you.');
  window.location.hash = '';
  window.location.reload();
});

socket.on('ready', function() {
  console.log('Socket is ready');
  createPeerConnection(isInitiator, configuration);
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('message', function(message) {
  console.log('Client received message:', message);
  signalingMessageCallback(message);
});

// Joining a room.
socket.emit('create or join', room);

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.emit('ipaddr');
}

// Leaving rooms and disconnecting from peers.
socket.on('disconnect', function(reason) {
  console.log(`Disconnected: ${reason}.`);
  sendBtn.disabled = true;
  snapAndSendBtn.disabled = true;
});

socket.on('bye', function(room) {
  console.log(`Peer leaving room ${room}.`);
  sendBtn.disabled = true;
  snapAndSendBtn.disabled = true;
  // If peer did not create the room, re-enter to be creator.
  if (!isInitiator) {
    window.location.reload();
  }
});

window.addEventListener('unload', function() {
  console.log(`Unloading window. Notifying peers in ${room}.`);
  socket.emit('bye', room);
});


/**
* Send message to signaling server
*/
function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

/**
* Updates URL on the page so that users can copy&paste it to their peers.
*/
// function updateRoomURL(ipaddr) {
//   var url;
//   if (!ipaddr) {
//     url = location.href;
//   } else {
//     url = location.protocol + '//' + ipaddr + ':2013/#' + room;
//   }
//   roomURL.innerHTML = url;
// }

/****************************************************************************
* User media (webcam) - WebRTC original
****************************************************************************/

function grabWebCamVideo() {
  console.log('Getting user media (video) ...');
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}

function gotStream(stream) {
  console.log('getUserMedia video stream URL:', stream);
  window.stream = stream; // stream available to console
  video.srcObject = stream;
  video.onloadedmetadata = function() {
    photo.width = photoContextW = video.videoWidth;
    photo.height = photoContextH = video.videoHeight;
    console.log('gotStream with width and height:', photoContextW, photoContextH);
  };
  show(snapBtn);
}

/****************************************************************************
* WebRTC peer connection and data channel
****************************************************************************/

var peerConn;
var dataChannel;

function signalingMessageCallback(message) {
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);
    peerConn.createAnswer(onLocalSessionCreated, logError);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);

  } else if (message.type === 'candidate') {
    peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate, sdpMid:message.id, sdpMLineIndex: message.label,
    }));

  }
}

function createPeerConnection(isInitiator, config) {
  console.log('Creating Peer connection as initiator?', isInitiator, 'config:',
              config);
  peerConn = new RTCPeerConnection(config);

  // send any ice candidates to the other peer
  peerConn.onicecandidate = function(event) {
    console.log('icecandidate event:', event);
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  };

  if (isInitiator) {
    console.log('Creating Data Channel');
    dataChannel = peerConn.createDataChannel('photos');
    onDataChannelCreated(dataChannel);

    console.log('Creating an offer');
    peerConn.createOffer(onLocalSessionCreated, logError);
  } else {
    peerConn.ondatachannel = function(event) {
      console.log('ondatachannel:', event.channel);
      dataChannel = event.channel;
      onDataChannelCreated(dataChannel);
    };
  }
}

function onLocalSessionCreated(desc) {
  console.log('local session created:', desc);
  peerConn.setLocalDescription(desc, function() {
    console.log('sending local desc:', peerConn.localDescription);
    sendMessage(peerConn.localDescription);
  }, logError);
}

function onDataChannelCreated(channel) {
  console.log('onDataChannelCreated:', channel);

  channel.onopen = function() {
    console.log('CHANNEL opened!!!');
    sendBtn.disabled = false;
    snapAndSendBtn.disabled = false;
  };

  channel.onclose = function () {
    console.log('Channel closed.');
    sendBtn.disabled = true;
    snapAndSendBtn.disabled = true;
  }

  channel.onmessage = (adapter.browserDetails.browser === 'firefox') ?
  //receiveDataFirefoxFactory() : receiveDataChromeFactory();
  
  // On Receiving Bag Data
  receiveDataFirefoxFactory() : receiveDepthDataChromeFactory();
}


// function receiveDataChromeFactory() {
//   var buf, count;

//   return function onmessage(event) {
//     if (typeof event.data === 'string') {
//       buf = window.buf = new Uint8ClampedArray(parseInt(event.data));
//       count = 0;
//       console.log('Expecting a total of ' + buf.byteLength + ' bytes');
//       return;
//     }

//     var data = new Uint8ClampedArray(event.data);
//     buf.set(data, count);

//     count += data.byteLength;
//     console.log('count: ' + count);

//     if (count === buf.byteLength) {
//       // we're done: all data chunks have been received
//       console.log('Done. Rendering photo.');
//       renderPhoto(buf);
//     }
//   };
// }

// function receiveDataFirefoxFactory() {
//   var count, total, parts;

//   return function onmessage(event) {
//     if (typeof event.data === 'string') {
//       total = parseInt(event.data);
//       parts = [];
//       count = 0;
//       console.log('Expecting a total of ' + total + ' bytes');
//       return;
//     }

//     parts.push(event.data);
//     count += event.data.size;
//     console.log('Got ' + event.data.size + ' byte(s), ' + (total - count) +
//                 ' to go.');

//     if (count === total) {
//       console.log('Assembling payload');
//       var buf = new Uint8ClampedArray(total);
//       var compose = function(i, pos) {
//         var reader = new FileReader();
//         reader.onload = function() {
//           buf.set(new Uint8ClampedArray(this.result), pos);
//           if (i + 1 === parts.length) {
//             console.log('Done. Rendering photo.');
//             renderPhoto(buf);
//           } else {
//             compose(i + 1, pos + this.result.byteLength);
//           }
//         };
//         reader.readAsArrayBuffer(parts[i]);
//       };
//       compose(0, 0);
//     }
//   };
// }

/****************************************************************************
* Aux functions, mostly UI-related
****************************************************************************/



// function snapPhoto() {
//   photoContext.drawImage(video, 0, 0, photo.width, photo.height);
//   show(photo, sendBtn);
// }

// function sendPhoto() {
//   // Split data channel message in chunks of this byte length.
//   var CHUNK_LEN = 64000;
//   console.log('width and height ', photoContextW, photoContextH);
//   var img = photoContext.getImageData(0, 0, photoContextW, photoContextH),
//   len = img.data.byteLength,
//   n = len / CHUNK_LEN | 0;

//   console.log('Sending a total of ' + len + ' byte(s)');

//   if (!dataChannel) {
//     logError('Connection has not been initiated. ' +
//       'Get two peers in the same room first');
//     return;
//   } else if (dataChannel.readyState === 'closed') {
//     logError('Connection was lost. Peer closed the connection.');
//     return;
//   }

//   dataChannel.send(len);

//   // split the photo and send in chunks of about 64KB
//   for (var i = 0; i < n; i++) {
//     var start = i * CHUNK_LEN,
//     end = (i + 1) * CHUNK_LEN;
//     console.log(start + ' - ' + (end - 1));
//     dataChannel.send(img.data.subarray(start, end));
//   }

//   // send the reminder, if any
//   if (len % CHUNK_LEN) {
//     console.log('last ' + len % CHUNK_LEN + ' byte(s)');
//     dataChannel.send(img.data.subarray(n * CHUNK_LEN));
//   }
// }

// function snapAndSend() {
//   snapPhoto();
//   sendPhoto();
// }

// function renderPhoto(data) {
//   var canvas = document.createElement('canvas');
//   canvas.width = photoContextW;
//   canvas.height = photoContextH;
//   canvas.classList.add('incomingPhoto');
//   // trail is the element holding the incoming images
//   trail.insertBefore(canvas, trail.firstChild);

//   var context = canvas.getContext('2d');
//   var img = context.createImageData(photoContextW, photoContextH);
//   img.data.set(data);
//   context.putImageData(img, 0, 0);
// }

// function show() {
//   Array.prototype.forEach.call(arguments, function(elem) {
//     elem.style.display = null;
//   });
// }

// function hide() {
//   Array.prototype.forEach.call(arguments, function(elem) {
//     elem.style.display = 'none';
//   });
// }

function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

function logError(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}


/****************************************************************************
* WebRTC peer connection and data channel - bag factory
****************************************************************************/


function receiveDepthDataChromeFactory() {
  var buf, count;

  return function onmessage(event) {

    // Initialize buffer
    if (typeof event.data === 'string') {
      buf = window.buf = new Uint8Array(parseInt(event.data));
      count = 0;
      console.log('Expecting a total of ' + buf.byteLength + ' bytes');
      return;
    }

    var data = new Uint8Array(event.data);
    buf.set(data, count);

    count += data.byteLength;
    console.log('count: ' + count);

    if (count === buf.byteLength) {
      // we're done: all data chunks have been received
      console.log('Done. Rendering remote depth frame.');
      renderRemoteDepthFrame(buf);
    }
  };
}



/****************************************************************************
* Aux functions - bag
****************************************************************************/

function loadBagStream(){
  cfg.enableDeviceFromFile(filePath);

  // Start input stream
  pipeline.start(cfg);
}


function streamBagFrames(){

  ////// ROBUST BOOLEAN NEEDED: while there are new frames ?
  ////// while ( pipeline.pollForFrames(localFrameset) )

  while ( true ) {

    // Wait until a new set of frames becomes available - BLOCKING ?
    localFrameset = pipeline.waitForFrames();

    localDepthArray = colorizer.colorize(localFrameset.depthFrame).data;
    localColorArray = localFrameset.colorFrame.data;

    // Send Local Frame (one frame)
    sendLocalFrameData();


  }

}


function sendLocalFrameData(){
  // Split data channel message in chunks of this byte length.
  var CHUNK_LEN = 64000;

  var colorLen = localColorArray.byteLength,
      depthLen = localDepthArray.byteLength,
      totalLen = colorLen + depthLen,
      colorN = colorN / CHUNK_LEN | 0,
      depthN = depthN / CHUNK_LEN | 0,
      totalN = totalLen / CHUNK_LEN | 0;
  
  console.log('Sending a total of ' + totalLen + ' byte(s)');

  // Error Handling
  if (!dataChannel) {
    logError('Connection has not been initiated. ' +
      'Get two peers in the same room first');
    return;
  } else if (dataChannel.readyState === 'closed') {
    logError('Connection was lost. Peer closed the connection.');
    return;
  }

  ////// Send Depth Array //////

  dataChannel.send(depthLen);

  // Split the array and send in chunks of about 64KB
  for (var i = 0; i < depthN; i++) {
    var start = i * CHUNK_LEN,
    end = (i + 1) * CHUNK_LEN;
    console.log(start + ' - ' + (end - 1));
    dataChannel.send(localDepthArray.subarray(start, end));
  }

  // send the reminder, if any
  if (depthLen % CHUNK_LEN) {
    console.log('last ' + depthLen % CHUNK_LEN + ' byte(s)');
    dataChannel.send(localDepthArray.subarray(n * CHUNK_LEN));
  }
  
}


function renderRemoteDepthFrame(depthData){
  // A GLFW Window to display the received frames
  const win = new GLFWWindow(1280, 720, 'Node.js Capture Example');

  while (! win.shouldWindowClose()) {
    
    // Build the color map - done before transmission
    //const depthMap = colorizer.colorize(frameset.depthFrame);

    if (depthData) {

      // Paint the images onto the window
      win.beginPaint();
      //const color = frameset.colorFrame; // (-> remoteColorArray);
      glfw.draw2x2Streams(win.window, 1,
          depthData, 'rgb8', WIDTH, HEIGHT,
          //color.data, 'rgb8', color.width, color.height
          );

      win.endPaint();
    }
  }

}
