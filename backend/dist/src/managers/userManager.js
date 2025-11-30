import { Socket } from "socket.io";
import { roomManager } from "./roomManager.js";
import { getRouter } from '../mediasoup/mediasoupServer.js';
import { processFrame, startFrameProcessing, startFrameEncoding, bufferToCanvas, canvasToBuffer } from '../mediasoup/videoProcessor.js';
import { Writable } from 'stream';
export class userManager {
    users;
    roomManager;
    meetingRooms;
    transports;
    producers;
    consumers;
    plainTransports;
    plainTransportsOut;
    processedProducers;
    ffmpegProcesses;
    ffmpegEncoders;
    encoderStreams;
    userSettings;
    producerToSocket;
    usedPorts;
    nextPortBase;
    producerDimensions;
    encoderInitializing;
    encoderReady;
    constructor() {
        this.users = [];
        this.roomManager = new roomManager();
        this.meetingRooms = new Map();
        this.transports = new Map();
        this.producers = new Map();
        this.consumers = new Map();
        this.plainTransports = new Map();
        this.plainTransportsOut = new Map();
        this.processedProducers = new Map();
        this.ffmpegProcesses = new Map();
        this.ffmpegEncoders = new Map();
        this.encoderStreams = new Map();
        this.userSettings = new Map();
        this.producerToSocket = new Map();
        this.usedPorts = new Set();
        this.nextPortBase = 20000;
        this.producerDimensions = new Map();
        this.encoderInitializing = new Map();
        this.encoderReady = new Map();
    }
    addUser(name, socket) {
        this.users.push({ name, socket });
        this.initHandlers(socket);
        this.userSettings.set(socket.id, {
            overlayUrl: '/src/assets/random_overlay.jpeg',
            opacity: 0.7,
            enabled: true
        });
        return;
    }
    initHandlers(socket) {
        socket.on("join-meeting", ({ meetingId, name }) => {
            this.handleJoinMeeting(socket, meetingId, name);
        });
        socket.on("offer", ({ roomId, sdp }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });
        socket.on("answer", ({ roomId, sdp }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });
        socket.on("ice-candidate", ({ roomId, candidate, type }) => {
            this.roomManager.onIceCandidate(roomId, socket.id, candidate, type);
        });
        socket.on("overlay-data", ({ meetingId, landmarks, overlayUrl, opacity }) => {
            this.handleOverlayData(socket, meetingId, landmarks, overlayUrl, opacity);
        });
        socket.on("create-transport", async ({ direction }) => {
            this.handleCreateTransport(socket, direction);
        });
        socket.on("connect-transport", async ({ transportId, dtlsParameters }) => {
            this.handleConnectTransport(socket, transportId, dtlsParameters);
        });
        socket.on("get-router-capabilities", () => {
            const router = getRouter();
            socket.emit('router-capabilities', router.rtpCapabilities);
        });
        socket.on("produce", async ({ transportId, kind, rtpParameters }) => {
            this.handleProduce(socket, transportId, kind, rtpParameters);
        });
        socket.on("consume", async ({ transportId, producerId, rtpCapabilities }) => {
            this.handleConsume(socket, transportId, producerId, rtpCapabilities);
        });
        socket.on("consumer-resume", async ({ consumerId }) => {
            this.handleConsumerResume(socket, consumerId);
        });
        socket.on("change-overlay", ({ overlayUrl }) => {
            const settings = this.userSettings.get(socket.id);
            if (settings) {
                settings.overlayUrl = overlayUrl;
                socket.emit('overlay-changed', { overlayUrl });
            }
        });
        socket.on("change-opacity", ({ opacity }) => {
            const settings = this.userSettings.get(socket.id);
            if (settings) {
                settings.opacity = opacity;
                socket.emit('opacity-changed', { opacity });
            }
        });
        socket.on("toggle-overlay", ({ enabled }) => {
            const settings = this.userSettings.get(socket.id);
            if (settings) {
                settings.enabled = enabled;
                socket.emit('overlay-toggled', { enabled });
            }
        });
    }
    handleOverlayData(socket, meetingId, landmarks, overlayUrl, opacity) {
        const participants = this.meetingRooms.get(meetingId);
        if (!participants || participants.length < 2)
            return;
        const otherSocketId = participants.find(id => id !== socket.id);
        if (otherSocketId) {
            const otherUser = this.users.find(u => u.socket.id === otherSocketId);
            if (otherUser) {
                otherUser.socket.emit("overlay-data", { landmarks, overlayUrl, opacity });
            }
        }
    }
    handleJoinMeeting(socket, meetingId, name) {
        console.log(`👤 User ${socket.id} (${name}) joining meeting ${meetingId}`);
        if (!this.meetingRooms.has(meetingId)) {
            this.meetingRooms.set(meetingId, []);
        }
        const participants = this.meetingRooms.get(meetingId);
        if (participants.length >= 2) {
            socket.emit("error", { message: "Meeting is full (maximum 2 participants)" });
            return;
        }
        participants.push(socket.id);
        if (participants.length === 1) {
            console.log(`⏳ User ${socket.id} waiting in meeting ${meetingId}`);
            socket.emit("waiting");
            return;
        }
        if (participants.length === 2) {
            const user1 = this.users.find(u => u.socket.id === participants[0]);
            const user2 = this.users.find(u => u.socket.id === participants[1]);
            if (user1 && user2) {
                console.log(`✅ Creating WebRTC room for meeting ${meetingId}`);
                user1.socket.emit("partner-connected", { meetingId });
                user2.socket.emit("partner-connected", { meetingId });
                this.roomManager.createRoom(user1, user2, meetingId);
            }
        }
    }
    async handleCreateTransport(socket, direction) {
        try {
            const router = getRouter();
            const transport = await router.createWebRtcTransport({
                listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true,
            });
            console.log('✅ Transport created:', transport.id);
            this.transports.set(transport.id, transport);
            socket.emit('transport-created', {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
                direction: direction,
            });
        }
        catch (error) {
            console.error('❌ Error creating transport:', error);
            socket.emit('error', { message: 'Failed to create transport' });
        }
    }
    async handleConnectTransport(socket, transportId, dtlsParameters) {
        try {
            const transport = this.transports.get(transportId);
            if (!transport)
                throw new Error('Transport not found');
            await transport.connect({ dtlsParameters });
            console.log('✅ Transport connected:', transportId);
            socket.emit('transport-connected', { transportId });
        }
        catch (error) {
            console.error('❌ Error connecting transport:', error);
            socket.emit('error', { message: 'Failed to connect transport' });
        }
    }
    async handleProduce(socket, transportId, kind, rtpParameters) {
        try {
            const transport = this.transports.get(transportId);
            if (!transport)
                throw new Error('Transport not found');
            const producer = await transport.produce({ kind, rtpParameters });
            console.log('✅ Producer created:', producer.id, 'kind:', kind);
            this.producers.set(producer.id, producer);
            this.producerToSocket.set(producer.id, socket.id);
            socket.emit('producer-created', { id: producer.id });
            if (kind === 'video') {
                console.log('🎬 Setting up video processing pipeline for producer:', producer.id);
                await this.setupVideoProcessing(socket, producer);
            }
            else {
                // Audio - notify immediately
                for (const [meetingId, participants] of this.meetingRooms.entries()) {
                    if (participants.includes(socket.id)) {
                        participants.forEach(participantId => {
                            if (participantId !== socket.id) {
                                const otherUser = this.users.find(u => u.socket.id === participantId);
                                if (otherUser) {
                                    otherUser.socket.emit('new-producer', {
                                        producerId: producer.id,
                                        kind: kind
                                    });
                                    console.log(`📢 Notified ${participantId} about new ${kind} producer`);
                                }
                            }
                        });
                        break;
                    }
                }
            }
        }
        catch (error) {
            console.error('❌ Error producing:', error);
            socket.emit('error', { message: 'Failed to produce' });
        }
    }
    allocatePorts() {
        let rtpPort = this.nextPortBase;
        while (this.usedPorts.has(rtpPort) || this.usedPorts.has(rtpPort + 1)) {
            rtpPort += 2;
        }
        const rtcpPort = rtpPort + 1;
        this.usedPorts.add(rtpPort);
        this.usedPorts.add(rtcpPort);
        this.nextPortBase = rtpPort + 2;
        console.log(`📢 Allocated ports - RTP: ${rtpPort}, RTCP: ${rtcpPort}`);
        return { rtpPort, rtcpPort };
    }
    freePorts(rtpPort, rtcpPort) {
        this.usedPorts.delete(rtpPort);
        this.usedPorts.delete(rtcpPort);
    }
    async setupVideoProcessing(socket, producer) {
        try {
            const router = getRouter();
            // Initialize state for this producer
            this.encoderInitializing.set(producer.id, false);
            this.encoderReady.set(producer.id, false);
            console.log('╔═══════════════════════════════════════════════════════════╗');
            console.log('🎬 SETTING UP VIDEO PROCESSING PIPELINE');
            console.log('╚═══════════════════════════════════════════════════════════╝');
            // PHASE 1: Input PlainTransport (receives from producer)
            const { rtpPort: decoderRtpPort, rtcpPort: decoderRtcpPort } = this.allocatePorts();
            const plainTransportIn = await router.createPlainTransport({
                listenIp: { ip: '127.0.0.1', announcedIp: '127.0.0.1' },
                rtcpMux: false,
                comedia: false,
            });
            console.log('✅ Input PlainTransport created');
            await plainTransportIn.connect({
                ip: '127.0.0.1',
                port: decoderRtpPort,
                rtcpPort: decoderRtcpPort
            });
            const plainConsumerIn = await plainTransportIn.consume({
                producerId: producer.id,
                rtpCapabilities: router.rtpCapabilities,
                paused: false,
            });
            console.log('✅ PlainTransport consuming from producer');
            this.plainTransports.set(producer.id, {
                plainTransport: plainTransportIn,
                plainConsumer: plainConsumerIn,
                ffmpegRtpPort: decoderRtpPort,
                ffmpegRtcpPort: decoderRtcpPort
            });
            // PHASE 2: Create OUTPUT PlainTransport FIRST (to get its port)
            console.log('\n🎬 PHASE 2: Creating output PlainTransport...');
            const plainTransportOut = await router.createPlainTransport({
                listenIp: { ip: '127.0.0.1', announcedIp: '127.0.0.1' },
                rtcpMux: false,
                comedia: true, // Auto-detect encoder's packets
            });
            const encoderOutputPort = plainTransportOut.tuple.localPort;
            console.log(`✅ Output PlainTransport created - listening on port: ${encoderOutputPort}`);
            this.plainTransportsOut.set(producer.id, {
                plainTransport: plainTransportOut,
                encoderOutputRtpPort: encoderOutputPort,
                encoderOutputRtcpPort: plainTransportOut.rtcpTuple?.localPort || encoderOutputPort + 1
            });
            // PHASE 3: Start decoder with dynamic encoder initialization
            console.log('\n🎥 PHASE 3: Starting decoder and processing pipeline...');
            let frameCounter = 0;
            const ffmpegDecoder = startFrameProcessing(decoderRtpPort, producer.id, plainConsumerIn.rtpParameters, async (frameData, width, height) => {
                try {
                    frameCounter++;
                    // CRITICAL: Use Map-based state that persists across callback invocations
                    const isInitializing = this.encoderInitializing.get(producer.id) || false;
                    const isReady = this.encoderReady.get(producer.id) || false;
                    // On FIRST frame: start encoder with detected dimensions
                    if (!isInitializing && !isReady) {
                        // IMMEDIATELY mark as initializing to prevent race condition
                        this.encoderInitializing.set(producer.id, true);
                        console.log(`\n🚀 First frame received - starting encoder (${width}x${height})`);
                        console.log(`   Frame counter: ${frameCounter}`);
                        this.producerDimensions.set(producer.id, { width, height });
                        const { command: encoderCmd, stdin: encoderStdin } = await startFrameEncoding(encoderOutputPort, // Send to PlainTransport's port!
                        producer.id, plainConsumerIn.rtpParameters, width, height);
                        this.ffmpegEncoders.set(producer.id, encoderCmd);
                        this.encoderStreams.set(producer.id, encoderStdin);
                        // Wait for encoder to start, then create processed producer
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const processedProducer = await plainTransportOut.produce({
                            kind: 'video',
                            rtpParameters: {
                                codecs: plainConsumerIn.rtpParameters.codecs,
                                headerExtensions: plainConsumerIn.rtpParameters.headerExtensions || [],
                                encodings: [{
                                        ssrc: Math.floor(Math.random() * 0xFFFFFFFF),
                                        scalabilityMode: 'L1T1'
                                    }],
                                rtcp: plainConsumerIn.rtpParameters.rtcp || {
                                    cname: 'mediasoup',
                                    reducedSize: true
                                },
                            },
                        });
                        console.log('✅ Processed producer created:', processedProducer.id);
                        this.producers.set(processedProducer.id, processedProducer);
                        this.processedProducers.set(producer.id, processedProducer);
                        console.log('╔═══════════════════════════════════════════════════════════╗');
                        console.log('✅ PIPELINE COMPLETE');
                        console.log(`   Resolution: ${width}x${height}`);
                        console.log(`   Original: ${producer.id}`);
                        console.log(`   Processed: ${processedProducer.id}`);
                        console.log(`   Encoder → port ${encoderOutputPort}`);
                        console.log('╚═══════════════════════════════════════════════════════════╝\n');
                        // Notify other participants
                        for (const [meetingId, participants] of this.meetingRooms.entries()) {
                            if (participants.includes(socket.id)) {
                                participants.forEach(participantId => {
                                    if (participantId !== socket.id) {
                                        const otherUser = this.users.find(u => u.socket.id === participantId);
                                        if (otherUser) {
                                            console.log(`📢 Notifying ${participantId} about processed producer: ${processedProducer.id}`);
                                            otherUser.socket.emit('new-producer', {
                                                producerId: processedProducer.id,
                                                kind: 'video'
                                            });
                                        }
                                    }
                                });
                                break;
                            }
                        }
                        // Mark as ready AFTER everything is set up
                        this.encoderReady.set(producer.id, true);
                        console.log(`✅ Encoder ready for producer: ${producer.id}`);
                    }
                    // Only process frames if encoder is ready
                    if (!this.encoderReady.get(producer.id)) {
                        // Encoder still initializing, skip this frame
                        return;
                    }
                    // Process every frame
                    const socketId = this.producerToSocket.get(producer.id);
                    if (!socketId)
                        return;
                    const settings = this.userSettings.get(socketId);
                    if (!settings)
                        return;
                    const canvas = bufferToCanvas(frameData, width, height);
                    let processedCanvas = canvas;
                    if (settings.enabled) {
                        processedCanvas = await processFrame(canvas, settings.overlayUrl, settings.opacity);
                    }
                    const processedBuffer = canvasToBuffer(processedCanvas);
                    const encoderStdin = this.encoderStreams.get(producer.id);
                    if (encoderStdin && encoderStdin.writable) {
                        encoderStdin.write(processedBuffer);
                    }
                }
                catch (error) {
                    console.error('❌ Frame processing error:', error);
                }
            });
            this.ffmpegProcesses.set(producer.id, ffmpegDecoder);
        }
        catch (error) {
            console.error('❌ Error setting up video processing:', error);
            // Clean up state on error
            this.encoderInitializing.delete(producer.id);
            this.encoderReady.delete(producer.id);
        }
    }
    async handleConsume(socket, transportId, producerId, rtpCapabilities) {
        try {
            const transport = this.transports.get(transportId);
            if (!transport)
                throw new Error('Transport not found');
            const producer = this.producers.get(producerId);
            if (!producer)
                throw new Error('Producer not found');
            const router = getRouter();
            if (!router.canConsume({ producerId, rtpCapabilities })) {
                console.error('❌ Cannot consume');
                return;
            }
            const consumer = await transport.consume({
                producerId,
                rtpCapabilities,
                paused: true,
            });
            console.log('✅ Consumer created:', consumer.id);
            this.consumers.set(consumer.id, consumer);
            socket.emit('consumer-created', {
                id: consumer.id,
                producerId: producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            });
        }
        catch (error) {
            console.error('❌ Error consuming:', error);
            socket.emit('error', { message: 'Failed to consume' });
        }
    }
    async handleConsumerResume(socket, consumerId) {
        try {
            const consumer = this.consumers.get(consumerId);
            if (!consumer)
                throw new Error('Consumer not found');
            await consumer.resume();
            console.log('✅ Consumer resumed:', consumerId);
        }
        catch (error) {
            console.error('❌ Error resuming consumer:', error);
        }
    }
    removeUser(socketId) {
        console.log('🧹 Cleaning up user:', socketId);
        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.userSettings.delete(socketId);
        const producersToRemove = [];
        for (const [producerId, producerSocketId] of this.producerToSocket.entries()) {
            if (producerSocketId === socketId) {
                producersToRemove.push(producerId);
            }
        }
        for (const producerId of producersToRemove) {
            console.log('🛑 Stopping FFmpeg for producer:', producerId);
            // Clean up encoder state
            this.encoderInitializing.delete(producerId);
            this.encoderReady.delete(producerId);
            const ffmpegProcess = this.ffmpegProcesses.get(producerId);
            if (ffmpegProcess) {
                ffmpegProcess.kill('SIGTERM');
                this.ffmpegProcesses.delete(producerId);
            }
            const encoderProcess = this.ffmpegEncoders.get(producerId);
            if (encoderProcess) {
                encoderProcess.kill('SIGTERM');
                this.ffmpegEncoders.delete(producerId);
            }
            const encoderStream = this.encoderStreams.get(producerId);
            if (encoderStream) {
                try {
                    encoderStream.end();
                }
                catch (e) {
                    // Ignore EPIPE errors on cleanup
                }
                this.encoderStreams.delete(producerId);
            }
            const plainTransportData = this.plainTransports.get(producerId);
            if (plainTransportData) {
                plainTransportData.plainConsumer?.close();
                plainTransportData.plainTransport?.close();
                if (plainTransportData.ffmpegRtpPort && plainTransportData.ffmpegRtcpPort) {
                    this.freePorts(plainTransportData.ffmpegRtpPort, plainTransportData.ffmpegRtcpPort);
                }
                this.plainTransports.delete(producerId);
            }
            const plainTransportOutData = this.plainTransportsOut.get(producerId);
            if (plainTransportOutData) {
                plainTransportOutData.plainTransport?.close();
                this.plainTransportsOut.delete(producerId);
            }
            const processedProducer = this.processedProducers.get(producerId);
            if (processedProducer) {
                processedProducer.close();
                this.processedProducers.delete(producerId);
            }
            this.producerDimensions.delete(producerId);
            this.producerToSocket.delete(producerId);
        }
        for (const [meetingId, participants] of this.meetingRooms.entries()) {
            const index = participants.indexOf(socketId);
            if (index !== -1) {
                participants.splice(index, 1);
                if (participants.length > 0) {
                    const otherSocketId = participants[0];
                    const otherUser = this.users.find(u => u.socket.id === otherSocketId);
                    if (otherUser) {
                        otherUser.socket.emit("user-disconnected");
                    }
                }
                if (participants.length === 0) {
                    this.meetingRooms.delete(meetingId);
                }
            }
        }
        console.log('✅ User cleanup complete:', socketId);
    }
}
//# sourceMappingURL=userManager.js.map