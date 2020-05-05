#!/usr/bin/env node

// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by an Apache 2.0 license
// that can be found in the LICENSE file.

'use strict';

const rs2 = require('../index.js');
const {GLFWWindow} = require('./glfw-window.js');
const {glfw} = require('./glfw-window.js');
// add draco
const draco_encoder = require('./draco_encoder.js');
// console.log(draco_encoder)
const draco_decoder = require('./draco_decoder.js');
const encoderModule = draco_encoder();
const decoderModule = draco_encoder();



// A GLFW Window to display the captured image
const win = new GLFWWindow(1280, 720, 'Node.js Capture Example');

// Colorizer is used to map distance in depth image into different colors
const colorizer = new rs2.Colorizer();

// The main work pipeline of camera
// const pipeline = new rs2.Pipeline();

 
// modification of context 

const file = '/Users/michaelzhang/Desktop/CS_Capstone/test_files/d435i_walking.bag';
let cfg = new rs2.Config();
cfg.enableDeviceFromFile(file);
let pipeline = new rs2.Pipeline();
pipeline.start(cfg);

// Start the camera
// pipeline.start();

// our modification
function memorySizeOf(obj) {
  var bytes = 0;

  function sizeOf(obj) {
      if(obj !== null && obj !== undefined) {
          switch(typeof obj) {
          case 'number':
              bytes += 8;
              break;
          case 'string':
              bytes += obj.length * 2;
              break;
          case 'boolean':
              bytes += 4;
              break;
          case 'object':
              var objClass = Object.prototype.toString.call(obj).slice(8, -1);
              if(objClass === 'Object' || objClass === 'Array') {
                  for(var key in obj) {
                      if(!obj.hasOwnProperty(key)) continue;
                      sizeOf(obj[key]);
                  }
              } else bytes += obj.toString().length * 2;
              break;
          }
      }
      return bytes;
  };

  function formatByteSize(bytes) {
      if(bytes < 1024) return bytes + " bytes";
      else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
      else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
      else return(bytes / 1073741824).toFixed(3) + " GiB";
  };

  return formatByteSize(sizeOf(obj));
};

while (! win.shouldWindowClose()) {
  const frameset = pipeline.waitForFrames();
  // use draco to encode
  // const mesh = {
  //   indices : new Uint32Array(indices),
  //   vertices : new Float32Array(vertices),
  //   normals : new Float32Array(normals)
  // };
  // const mesh = frameset.depthFrame;
  const encoder = new encoderModule.Encoder();
  const meshBuilder = new encoderModule.MeshBuilder();
  const dracoMesh = new encoderModule.Mesh();
  const numFaces = mesh.indices.length / 3;
  const numPoints = mesh.vertices.length;
  meshBuilder.AddFacesToMesh(dracoMesh, numFaces, mesh.indices);
  meshBuilder.AddFloatAttributeToMesh(dracoMesh, encoderModule.POSITION,
    numPoints, 3, mesh.vertices);

  
  const encodedData = new encoderModule.DracoInt8Array();
  // Use default encoding setting.
  const encodedLen = encoder.EncodeMeshToDracoBuffer(dracoMesh,
                                                       encodedData)

  


  // Build the color map
  const depthMap = colorizer.colorize(frameset.depthFrame);
  // let temp = new Uint8Array(depthMap.arrayBuffer)
  // console.log(memorySizeOf(depthMap));
  // console.log(memorySizeOf(frameset.colorFrame))
  // console.log(depthMap.arrayBuffer);
  // console.log(temp);
  if (depthMap) {
    // Paint the images onto the window
    win.beginPaint();
    const color = frameset.colorFrame;
    console.log(color.width);
    console.log(color.height);
    glfw.draw2x2Streams(win.window, 2,
        depthMap.data, 'rgb8', depthMap.width, depthMap.height,
        color.data, 'rgb8', color.width, color.height
        );
    win.endPaint();
  }
}

pipeline.stop();
pipeline.destroy();
win.destroy();
rs2.cleanup();
