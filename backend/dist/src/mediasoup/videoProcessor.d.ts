import { Canvas } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import { Writable } from 'stream';
export declare function initializeVideoProcessor(): Promise<void>;
export declare function bufferToCanvas(frameData: Buffer, width: number, height: number): Canvas;
export declare function canvasToBuffer(canvas: Canvas): Buffer;
/**
 * Process frame - just add watermark for now (TensorFlow disabled for testing)
 */
export declare function processFrame(canvas: Canvas, overlayUrl: string, opacity: number): Promise<Canvas>;
export declare function clearOverlayCache(overlayUrl?: string): void;
/**
 * FIXED: Pass detected dimensions to callback
 */
export declare function startFrameProcessing(rtpPort: number, producerId: string, rtpParameters: any, onFrameProcessed: (frameData: Buffer, width: number, height: number) => void | Promise<void>): ffmpeg.FfmpegCommand;
/**
 * Start FFmpeg encoder
 */
export declare function startFrameEncoding(outputRtpPort: number, producerId: string, rtpParameters: any, width: number, height: number): Promise<{
    command: any;
    stdin: Writable;
}>;
//# sourceMappingURL=videoProcessor.d.ts.map