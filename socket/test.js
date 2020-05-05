const draco_encoder = require('./draco_encoder.js');
// console.log(draco_encoder)
const draco_decoder = require('./draco_decoder.js');
const encoderModule = draco_encoder();
const decoderModule = draco_encoder();

const mesh = {
    indices : new Uint32Array(indices),
    vertices : new Float32Array(vertices),
    normals : new Float32Array(normals)
  };
  
  const encoder = new encoderModule.Encoder();
  const meshBuilder = new encoderModule.MeshBuilder();
  const dracoMesh = new encoderModule.Mesh();
  
  const numFaces = mesh.indices.length / 3;
  const numPoints = mesh.vertices.length;
  meshBuilder.AddFacesToMesh(dracoMesh, numFaces, mesh.indices);
  
  meshBuilder.AddFloatAttributeToMesh(dracoMesh, encoderModule.POSITION,
    numPoints, 3, mesh.vertices);
  if (mesh.hasOwnProperty('normals')) {
    meshBuilder.AddFloatAttributeToMesh(
      dracoMesh, encoderModule.NORMAL, numPoints, 3, mesh.normals);
  }
  if (mesh.hasOwnProperty('colors')) {
    meshBuilder.AddFloatAttributeToMesh(
      dracoMesh, encoderModule.COLOR, numPoints, 3, mesh.colors);
  }
  if (mesh.hasOwnProperty('texcoords')) {
    meshBuilder.AddFloatAttributeToMesh(
      dracoMesh, encoderModule.TEX_COORD, numPoints, 3, mesh.texcoords);
  }
  
  if (method === "edgebreaker") {
    encoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);
  } else if (method === "sequential") {
    encoder.SetEncodingMethod(encoderModule.MESH_SEQUENTIAL_ENCODING);
  }
  
  const encodedData = new encoderModule.DracoInt8Array();
  // Use default encoding setting.
  const encodedLen = encoder.EncodeMeshToDracoBuffer(dracoMesh,
                                                     encodedData);
  encoderModule.destroy(dracoMesh);
  encoderModule.destroy(encoder);
  encoderModule.destroy(meshBuilder);
  
  // Create the Draco decoder.
// const decoderModule = DracoDecoderModule();
const buffer = new decoderModule.DecoderBuffer();
buffer.Init(byteArray, byteArray.length);

// Create a buffer to hold the encoded data.
const decoder = new decoderModule.Decoder();
const geometryType = decoder.GetEncodedGeometryType(buffer);

// Decode the encoded geometry.
let outputGeometry;
let status;
if (geometryType == decoderModule.TRIANGULAR_MESH) {
  outputGeometry = new decoderModule.Mesh();
  status = decoder.DecodeBufferToMesh(buffer, outputGeometry);
} else {
  outputGeometry = new decoderModule.PointCloud();
  status = decoder.DecodeBufferToPointCloud(buffer, outputGeometry);
}

// You must explicitly delete objects created from the DracoDecoderModule
// or Decoder.
decoderModule.destroy(outputGeometry);
decoderModule.destroy(decoder);
decoderModule.destroy(buffer);