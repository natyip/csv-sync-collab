import http from 'http';
import app from './app';
import { initDatabase } from './config/database';

const PORT = process.env.PORT || 5000;

// Initialize SQLite database
initDatabase();

// Create HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});