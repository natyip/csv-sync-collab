import http from 'http';
import app from './app';
import { initDatabase } from './config/database';
import { initSocketServer } from './sockets/socketHandler';

const PORT = process.env.PORT || 5000;

// Initialize SQLite database
initDatabase();

// Create HTTP server wrapper around Express app
const server = http.createServer(app);

// Initialize Socket.IO attached to the HTTP server
initSocketServer(server);

// Start listening
server.listen(PORT, () => {
  console.log(`Server and WebSocket running on port ${PORT}`);
});