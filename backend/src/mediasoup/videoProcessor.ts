import * as tf from '@tensorflow/tfjs-node';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { createCanvas, loadImage, Image, Canvas } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Writable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cast ffmpeg-static path to string
const ffmpegPath = ffmpegStatic as unknown as string;
ffmpeg.setFfmpegPath(ffmpegPath);

let faceDetector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
let poseDetector: poseDetection.PoseDetector | null = null;
let isInitialized = false;

const overlayCache = new Map<string, Image>();

export async function initializeVideoProcessor() {
  try {
    console.log('🎭 Initializing video processor with TensorFlow.js...');

    console.log('📦 Loading Face Landmarks model...');
    faceDetector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'tfjs',
        maxFaces: 1,
        refineLandmarks: true,
      }
    );
    console.log('✅ Face Landmarks model loaded');

    console.log('📦 Loading Pose Detection model...');
    poseDetector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      }
    );
    console.log('✅ Pose Detection model loaded');

    isInitialized = true;
    console.log('✅ Video processor initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize video processor:', error);
    throw error;
  }
}

async function getOverlayImage(overlayUrl: string): Promise<Image> {
  if (overlayCache.has(overlayUrl)) {
    return overlayCache.get(overlayUrl)!;
  }

  console.log('📥 Loading overlay image:', overlayUrl);
  const image = await loadImage(overlayUrl);
  overlayCache.set(overlayUrl, image);
  console.log('✅ Overlay cached:', overlayUrl);
  
  return image;
}

export function bufferToCanvas(frameData: Buffer, width: number, height: number): Canvas {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const imageData = ctx.createImageData(width, height);
  
  for (let i = 0; i < width * height; i++) {
    const rgbIndex = i * 3;
    const rgbaIndex = i * 4;
    
    imageData.data[rgbaIndex] = frameData[rgbIndex]!;
    imageData.data[rgbaIndex + 1] = frameData[rgbIndex + 1]!;
    imageData.data[rgbaIndex + 2] = frameData[rgbIndex + 2]!;
    imageData.data[rgbaIndex + 3] = 255;
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function canvasToBuffer(canvas: Canvas): Buffer {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const rgbBuffer = Buffer.alloc(canvas.width * canvas.height * 3);
  
  for (let i = 0; i < canvas.width * canvas.height; i++) {
    const rgbaIndex = i * 4;
    const rgbIndex = i * 3;
    
    rgbBuffer[rgbIndex] = imageData.data[rgbaIndex]!;
    rgbBuffer[rgbIndex + 1] = imageData.data[rgbaIndex + 1]!;
    rgbBuffer[rgbIndex + 2] = imageData.data[rgbaIndex + 2]!;
  }
  
  return rgbBuffer;
}

/**
 * Process frame - just add watermark for now (TensorFlow disabled for testing)
 */
export async function processFrame(
  canvas: Canvas,
  overlayUrl: string,
  opacity: number
): Promise<Canvas> {
  const ctx = canvas.getContext('2d');

  // Draw BIG RED watermark
  ctx.fillStyle = 'rgba(255, 0, 0, 1.0)';
  ctx.font = 'bold 30px Arial';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  
  const text = 'SERVER PROCESSED';
  ctx.strokeText(text, 10, 40);
  ctx.fillText(text, 10, 40);
  
  // Add resolution for debugging
  ctx.fillStyle = 'rgba(0, 255, 0, 1.0)';
  ctx.font = 'bold 20px Arial';
  const resText = `${canvas.width}x${canvas.height}`;
  ctx.strokeText(resText, 10, 70);
  ctx.fillText(resText, 10, 70);
  
  return canvas;
}

export function clearOverlayCache(overlayUrl?: string) {
  if (overlayUrl) {
    overlayCache.delete(overlayUrl);
  } else {
    overlayCache.clear();
  }
}

/**
 * FIXED: Pass detected dimensions to callback
 */
export function startFrameProcessing(
  rtpPort: number,
  producerId: string,
  rtpParameters: any,
  onFrameProcessed: (frameData: Buffer, width: number, height: number) => void | Promise<void>
) {
  console.log(`🎬 Starting FFmpeg decoder on port ${rtpPort}`);
  
  const videoCodec = rtpParameters.codecs.find((c: any) => c.mimeType.startsWith('video/'));
  const payloadType = videoCodec?.payloadType || 96;
  const ssrc = rtpParameters.encodings[0]?.ssrc;
  const cname = rtpParameters.rtcp?.cname || 'mediasoup';
  
  const sdpContent = `v=0
o=- 0 0 IN IP4 127.0.0.1
s=MediaSoup RTP Stream
c=IN IP4 127.0.0.1
t=0 0
m=video ${rtpPort} RTP/AVP ${payloadType}
a=rtpmap:${payloadType} VP8/90000
a=rtcp:${rtpPort + 1}
${ssrc ? `a=ssrc:${ssrc} cname:${cname}` : ''}
a=recvonly`;

  const sdpPath = path.join('/tmp', `ffmpeg-${producerId}.sdp`);
  fs.writeFileSync(sdpPath, sdpContent);
  
  const command = ffmpeg()
    .setFfmpegPath(ffmpegPath)
    .input(sdpPath)
    .inputFormat('sdp')
    .inputOptions([
      '-protocol_whitelist', 'file,rtp,udp',
      '-analyzeduration', '5000000',
      '-probesize', '5000000',
      '-fflags', '+genpts',
      '-use_wallclock_as_timestamps', '1',
      '-reorder_queue_size', '0'
    ])
    .outputOptions([
      '-f', 'image2pipe',
      '-pix_fmt', 'rgb24',
      '-vcodec', 'rawvideo',
      '-fps_mode', 'passthrough'
    ])
    .on('start', () => {
      console.log('✅ FFmpeg decoder started');
    })
    .on('stderr', (stderrLine) => {
      // Detect dimensions from FFmpeg output
      if (stderrLine.includes('Stream #0:0') && stderrLine.includes('Video:') && stderrLine.includes('vp8')) {
        console.log('📊 Decoder:', stderrLine.trim());
        
        // Match resolution pattern like ", 640x480,"
        const match = stderrLine.match(/,\s*(\d{3,4})x(\d{3,4}),/);
        if (match) {
          actualWidth = parseInt(match[1]!);
          actualHeight = parseInt(match[2]!);
          frameSize = actualWidth * actualHeight * 3;
          console.log(`🎯 DETECTED RESOLUTION: ${actualWidth}x${actualHeight} (${frameSize} bytes/frame)`);
        }
      }
      
      if (stderrLine.includes('error') || stderrLine.includes('Error')) {
        console.error('❌ Decoder stderr:', stderrLine);
      }
    })
    .on('error', (err) => {
      console.error('❌ Decoder error:', err.message);
      try { fs.unlinkSync(sdpPath); } catch (e) {}
    })
    .on('end', () => {
      console.log('📊 Decoder ended:', producerId);
      try { fs.unlinkSync(sdpPath); } catch (e) {}
    });

  const stream = command.pipe();
  
  // Will be updated when dimensions are detected
  let actualWidth = 640;
  let actualHeight = 480;
  let frameSize = actualWidth * actualHeight * 3;
  
  let buffer = Buffer.alloc(0);
  let frameCount = 0;
  
  stream.on('data', (chunk: Buffer) => {
    if (frameCount === 0) {
      console.log('🎉 FIRST DATA from decoder!');
      console.log(`   Resolution: ${actualWidth}x${actualHeight}`);
      console.log(`   Frame size: ${frameSize} bytes`);
    }
    
    buffer = Buffer.concat([buffer, chunk]);
    
    while (buffer.length >= frameSize) {
      const frameData = buffer.subarray(0, frameSize);
      buffer = buffer.subarray(frameSize);
      
      frameCount++;
      if (frameCount === 1 || frameCount % 30 === 0) {
        console.log(`📊 Processed ${frameCount} frames (${actualWidth}x${actualHeight})`);
      }
      
      // Pass dimensions to callback!
      onFrameProcessed(frameData, actualWidth, actualHeight);
    }
  });
  
  setTimeout(() => {
    if (frameCount === 0) {
      console.error('⏰ TIMEOUT: No frames after 10 seconds');
    }
  }, 10000);
  
  return command;
}

/**
 * Start FFmpeg encoder
 */
export async function startFrameEncoding(
  outputRtpPort: number,
  producerId: string,
  rtpParameters: any,
  width: number,
  height: number
): Promise<{ command: any; stdin: Writable }> {
  console.log(`🎬 Starting encoder (${width}x${height}) → port ${outputRtpPort}`);
  
  const videoCodec = rtpParameters.codecs.find((c: any) => c.mimeType.startsWith('video/'));
  const payloadType = videoCodec?.payloadType || 96;
  const ssrc = rtpParameters.encodings[0]?.ssrc || Math.floor(Math.random() * 0xFFFFFFFF);
  
  const command = ffmpeg()
    .setFfmpegPath(ffmpegPath)
    .input('pipe:0')
    .inputFormat('rawvideo')
    .inputOptions([
      '-pix_fmt', 'rgb24',
      '-s', `${width}x${height}`,
      '-r', '30',
      '-re'  // Remove this - it adds delay
    ])
    .outputOptions([
      '-f', 'rtp',
      '-vcodec', 'libvpx',
      '-pix_fmt', 'yuv420p',
      '-deadline', 'realtime',
      '-cpu-used', '4',
      '-b:v', '500k',
      '-maxrate', '500k',
      '-bufsize', '1000k',
      '-keyint_min', '30',
      '-g', '30',
      '-ssrc', ssrc.toString(),
      '-payload_type', payloadType.toString()
    ])
    .output(`rtp://127.0.0.1:${outputRtpPort}`)
    .on('start', (cmd) => {
      console.log(`✅ Encoder started (${width}x${height}) → ${outputRtpPort}`);
    })
    .on('stderr', (stderrLine) => {
      if (stderrLine.includes('error') || stderrLine.includes('Error')) {
        console.error('❌ Encoder stderr:', stderrLine);
      } else if (stderrLine.includes('frame=') && Math.random() < 0.05) {
        console.log('📊 Encoder:', stderrLine.trim());
      }
    })
    .on('error', (err) => {
      console.error('❌ Encoder error:', err.message);
    })
    .on('end', () => {
      console.log('📊 Encoder ended:', producerId);
    });

  command.run();
  
  return new Promise((resolve, reject) => {
    const checkStdin = () => {
      const proc = (command as any).ffmpegProc;
      if (proc && proc.stdin) {
        console.log('✅ Encoder stdin ready');
        resolve({ command, stdin: proc.stdin });
      } else {
        setTimeout(checkStdin, 50);
      }
    };
    
    setTimeout(checkStdin, 100);
    
    setTimeout(() => {
      reject(new Error('Timeout waiting for encoder stdin'));
    }, 5000);
  });
}