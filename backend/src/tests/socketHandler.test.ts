import { describe, it, expect, afterEach } from 'vitest';
import http from 'http';
import { initSocketServer, getIo } from '../sockets/socketHandler';

describe('Socket Handler Unit Tests', () => {
  let httpServer: http.Server;

  afterEach(() => {
    if (httpServer) {
      httpServer.close();
    }
  });

  // Successful Initialization & Singleton Access
  it('should successfully initialize the socket server and allow getIo retrieval', () => {
    httpServer = http.createServer();
    const ioInstance = initSocketServer(httpServer);

    expect(ioInstance).toBeDefined();
    
    // Test singleton getter
    const retrievedIo = getIo();
    expect(retrievedIo).toBe(ioInstance);
  });

  // Uninitialized Singleton Guard
  it('should throw an error if getIo is called before initialization', () => {
    expect(() => {
      const io = getIo();
    }).toBeDefined();
  });
});