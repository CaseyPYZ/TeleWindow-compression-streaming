


const rs2 = require("node-librealsense");
const {GLFWWindow} = require('./glfw-window.js');
const {glfw} = require('./glfw-window.js');
const win = new GLFWWindow(1280, 720, 'Node.js PointCloud Example');
const pc = new rs2.PointCloud();
// const pipeline = new rs2.Pipeline();
// our modification for bag file
const file = '/Users/michaelzhang/Desktop/CS_Capstone/test_files/d435i_walking.bag';
let cfg = new rs2.Config();
cfg.enableDeviceFromFile(file);
let pipeline = new rs2.Pipeline();
pipeline.start(cfg);


const main = (modules) => {
    console.log(modules);
    const [encoderModule,decoderModule] = modules
    const encoder = new encoderModule.Encoder();
    const decoder = new decoderModule.Decoder();
    const PointCloudBuilder = new encoderModule.PointCloudBuilder();
    const PointCloud = new encoderModule.PointCloud();

    while (! win.shouldWindowClose()) {
        const frameSet = pipeline.waitForFrames();
        const pointsFrame = pc.calculate(frameSet.depthFrame);
        // color the depth Frame
        pc.mapTo(frameSet.colorFrame);
        // for creating point cloud
        buffer = new decoderModule.DecoderBuffer();
        buffer.Init(new Int8Array(pointsFrame.verticesData), pointsFrame.verticesData.byteLength);  // some bufferview as input!
        geometryType = decoder.GetEncodedGeometryType(buffer);

        pointcloud = new decoderModule.PointCloud();
        decoder.DecodeBufferToPointCloud(buffer, pointcloud);

        points = new decoderModule.DracoFloat32Array()
        attr = decoder.GetAttribute(pointcloud, 0)
        decoder.GetAttributeFloatForAllPoints(pointcloud, attr, points)
        points.GetValue(0)


        // for creating mesh
        // console.log(pointsFrame);
//         let indices = [];
//         let vertices = [];
//         let texcoords = [];
// //         // our modification
//         vertices = new Uint8Array(pointsFrame.verticesData);
//         // console.log(vertices);
//         if(vertices.length>0){
//             console.log("vertices");
//             // texcoords = new Uint8Array(pointsFrame.textureCoordData);
//             let i = 0;
//             indices = [];
//             while(i<vertices.length){
//                 indices.push[i];
//                 i += 1;
//             }
//         }

                                                                 
  
    
    //   console.log(temp.length);
        drawPointCloud(win, frameSet.colorFrame, pointsFrame);
    }
  
    pc.destroy();
    pipeline.stop();
    pipeline.destroy();
    win.destroy();
  
    rs2.cleanup();
    
}


// const {GLFWWindow} = require('./glfw-window.js');
// const {glfw} = require('./glfw-window.js');
const draco3d = require('draco3d');
// const decoderModule = draco3d.createDecoderModule({});
const encoderModule = draco3d.createEncoderModule({});
const decoderModule = draco3d.createDecoderModule({});
decoderModule.then(decoder => {
    encoderModule.then(encoder => {
        main([encoder, decoder])
    })
})


// console.log(Object.keys(draco3d));
// 


function drawPointCloud(win, color, points) {
  win.beginPaint();
  if (points.vertices && points.textureCoordinates ) {
    let count = points.size;
    glfw.drawDepthAndColorAsPointCloud(
        win.window,
        new Uint8Array(points.vertices.buffer),
        count,
        new Uint8Array(points.textureCoordinates.buffer),
        color.data,
        color.width,
        color.height,
        'rgb8');
  }
  win.endPaint();
}


// // Open a GLFW window
// const win = new GLFWWindow(1280, 720, 'Node.js PointCloud Example');
// const pc = new rs2.PointCloud();
// // const pipeline = new rs2.Pipeline();
// // our modification for bag file
// const file = '/Users/michaelzhang/Desktop/CS_Capstone/test_files/d435i_walking.bag';
// let cfg = new rs2.Config();
// cfg.enableDeviceFromFile(file);
// let pipeline = new rs2.Pipeline();
// pipeline.start(cfg);


// const encoder = new encoderModule.Encoder();
// const meshBuilder = new encoderModule.MeshBuilder();
// const dracoMesh = new encoderModule.Mesh();

// console.log('Drag to change perspective, scroll mouse wheel to zoom in/out.');

// while (! win.shouldWindowClose()) {
//   const frameSet = pipeline.waitForFrames();
//   const pointsFrame = pc.calculate(frameSet.depthFrame);
//   // color the depth Frame
//   console.log(pointsFrame);
//   pc.mapTo(frameSet.colorFrame);
//   let indices = [];
//   let vertices = [];
//   let texcoords = [];
//   // our modification
//   if(pointsFrame.verticesData){
//     vertices = new Uint8Array(pointsFrame.verticesData);
//     texcoords = new Uint8Array(pointsFrame.textureCoordData);
//     console.log(pointsFrame);
//     let i = 0;
//     indices = [];
//     while(i<vertices.length){
//         indices.push[i];
//         i += 1;
//     }
//   }

//   const mesh = {
//     indices : new Uint32Array(indices),
//     vertices : new Float32Array(vertices),
//   };

//   const numFaces = mesh.indices.length / 3;
//   const numPoints = mesh.vertices.length;
//   meshBuilder.AddFacesToMesh(dracoMesh, numFaces, mesh.indices);
//   meshBuilder.AddFloatAttributeToMesh(dracoMesh, encoderModule.POSITION,
//     numPoints, 3, mesh.vertices);

  
// //   console.log(temp.length);
//   drawPointCloud(win, frameSet.colorFrame, pointsFrame);
// }

// pc.destroy();
// pipeline.stop();
// pipeline.destroy();
// win.destroy();

// rs2.cleanup();
