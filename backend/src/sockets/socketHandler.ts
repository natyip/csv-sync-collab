import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

// Private variable holding the active Socket.IO server instance
let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  // Initialize Socket.IO with CORS rules enabled for local & container development
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Handle individual client connections
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected via WebSocket: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Singleton getter used by controllers/services to emit events anywhere
export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};