import * as mediasoup from 'mediasoup';
type Router = mediasoup.types.Router;
type Worker = mediasoup.types.Worker;
/**
 * Initialize Mediasoup Worker and Router
 */
export declare function initializeMediasoup(): Promise<void>;
/**
 * Get the Router instance
 */
export declare function getRouter(): Router;
/**
 * Get the Worker instance
 */
export declare function getWorker(): Worker;
export {};
//# sourceMappingURL=mediasoupServer.d.ts.map