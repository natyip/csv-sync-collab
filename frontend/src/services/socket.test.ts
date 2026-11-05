import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initSocket, disconnectSocket } from './socket';

// Mock the socket.io-client module
vi.mock('socket.io-client', () => {
  const mSocket = {
    disconnect: vi.fn(),
    on: vi.fn(),
  };
  return {
    io: vi.fn(() => mSocket),
  };
});

import { io } from 'socket.io-client';

describe('Socket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up socket state between tests if needed by disconnecting
    disconnectSocket();
  });

  it('should initialize the socket connection only once (Singleton pattern)', () => {
    const socket1 = initSocket();
    const socket2 = initSocket();

    // Verify `io()` was called exactly once with the correct URL
    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith('http://localhost:5000');

    // Verify both calls returned the exact same socket instance
    expect(socket1).toBe(socket2);
  });

  it('should disconnect the socket and reset the instance', () => {
    const socket = initSocket();
    expect(socket).toBeDefined();

    disconnectSocket();

    // Calling initSocket again after disconnect should create a new connection
    initSocket();
    expect(io).toHaveBeenCalledTimes(2);
  });
});