import { getIo } from './socketHandler';
import { ConflictItem } from '../services/conflictService';

export enum SocketEvents {
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  DATA_UPDATED = 'DATA_UPDATED',
}

export const broadcastConflictDetected = (conflicts: ConflictItem[]) => {
  try {
    const io = getIo();
    io.emit(SocketEvents.CONFLICT_DETECTED, {
      success: true,
      message: `Found ${conflicts.length} record conflicts requiring resolution.`,
      conflicts,
      timestamp: new Date().toISOString(),
    });
    console.log(`⚡ Broadcasted ${SocketEvents.CONFLICT_DETECTED} for ${conflicts.length} items.`);
  } catch (err) {
    console.warn('Socket.IO not initialized or failed to broadcast CONFLICT_DETECTED:', err);
  }
};

export const broadcastDataUpdated = (message: string = 'Dataset has been updated.') => {
  try {
    const io = getIo();
    io.emit(SocketEvents.DATA_UPDATED, {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    });
    console.log(`⚡ Broadcasted ${SocketEvents.DATA_UPDATED}: ${message}`);
  } catch (err) {
    console.warn('Socket.IO not initialized or failed to broadcast DATA_UPDATED:', err);
  }
};