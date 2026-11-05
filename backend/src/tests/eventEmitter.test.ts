import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { broadcastConflictDetected, broadcastDataUpdated, SocketEvents } from '../sockets/eventEmitter';
import * as socketHandler from '../sockets/socketHandler';

// Mock the socketHandler module so we can control getIo() behavior
vi.mock('../sockets/socketHandler', () => ({
  getIo: vi.fn(),
}));

describe('Event Emitter Utility Tests', () => {
  let mockEmit: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmit = vi.fn();
    // Spy on console.warn to keep test output clean
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('broadcastConflictDetected', () => {
    it('should successfully emit CONFLICT_DETECTED event with formatted payload', () => {
      // Mock getIo() to return an object with an emit function
      vi.mocked(socketHandler.getIo).mockReturnValue({ emit: mockEmit } as any);

      const mockConflicts: any[] = [
        { id: 1, existing: {}, incoming: {}, diffs: [] }
      ];

      broadcastConflictDetected(mockConflicts);

      expect(socketHandler.getIo).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledWith(
        SocketEvents.CONFLICT_DETECTED,
        expect.objectContaining({
          success: true,
          message: 'Found 1 record conflicts requiring resolution.',
          conflicts: mockConflicts,
          timestamp: expect.any(String),
        })
      );
    });

    it('should catch errors gracefully and log a warning if Socket.IO is uninitialized', () => {
      // Mock getIo() to throw an error (simulating uninitialized state)
      vi.mocked(socketHandler.getIo).mockImplementation(() => {
        throw new Error('Socket.io not initialized');
      });

      expect(() => {
        broadcastConflictDetected([]);
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        'Socket.IO not initialized or failed to broadcast CONFLICT_DETECTED:',
        expect.any(Error)
      );
    });
  });

  describe('broadcastDataUpdated', () => {
    it('should successfully emit DATA_UPDATED event with custom message', () => {
      vi.mocked(socketHandler.getIo).mockReturnValue({ emit: mockEmit } as any);

      const customMessage = 'Database records updated successfully.';
      broadcastDataUpdated(customMessage);

      expect(socketHandler.getIo).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledWith(
        SocketEvents.DATA_UPDATED,
        expect.objectContaining({
          success: true,
          message: customMessage,
          timestamp: expect.any(String),
        })
      );
    });

    it('should use default message if none is provided and emit DATA_UPDATED', () => {
      vi.mocked(socketHandler.getIo).mockReturnValue({ emit: mockEmit } as any);

      broadcastDataUpdated();

      expect(mockEmit).toHaveBeenCalledWith(
        SocketEvents.DATA_UPDATED,
        expect.objectContaining({
          success: true,
          message: 'Dataset has been updated.',
          timestamp: expect.any(String),
        })
      );
    });

    it('should catch errors gracefully if broadcast fails', () => {
      vi.mocked(socketHandler.getIo).mockImplementation(() => {
        throw new Error('Connection lost');
      });

      expect(() => {
        broadcastDataUpdated();
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        'Socket.IO not initialized or failed to broadcast DATA_UPDATED:',
        expect.any(Error)
      );
    });
  });
});