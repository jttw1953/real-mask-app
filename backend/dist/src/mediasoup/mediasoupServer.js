import * as mediasoup from 'mediasoup';
// Store worker and router
let worker;
let router;
/**
 * Initialize Mediasoup Worker and Router
 */
export async function initializeMediasoup() {
    try {
        // Create a Worker
        worker = await mediasoup.createWorker({
            logLevel: 'warn',
            logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
            rtcMinPort: 10000,
            rtcMaxPort: 10100,
        });
        console.log('✅ Mediasoup Worker created');
        // Log if worker dies
        worker.on('died', (error) => {
            console.error('❌ Mediasoup Worker died:', error);
            process.exit(1);
        });
        // Create a Router
        router = await worker.createRouter({
            mediaCodecs: [
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2,
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {
                        'x-google-start-bitrate': 1000,
                    },
                },
            ],
        });
        console.log('✅ Mediasoup Router created');
        console.log('✅ Mediasoup initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize Mediasoup:', error);
        throw error;
    }
}
/**
 * Get the Router instance
 */
export function getRouter() {
    if (!router) {
        throw new Error('Router not initialized. Call initializeMediasoup() first.');
    }
    return router;
}
/**
 * Get the Worker instance
 */
export function getWorker() {
    if (!worker) {
        throw new Error('Worker not initialized. Call initializeMediasoup() first.');
    }
    return worker;
}
//# sourceMappingURL=mediasoupServer.js.map