import http from 'http';
import { Server } from 'socket.io';
import { app } from './src/app.js';
import { userManager } from './src/managers/userManager.js';

const PORT = 3000;

// Create HTTP server with Express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialize user manager for chat
const globalUserManager = new userManager();

// Socket.IO connection handler for chat
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  globalUserManager.addUser('randomName', socket);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    globalUserManager.removeUser(socket.id);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
