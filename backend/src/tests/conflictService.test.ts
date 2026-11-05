import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeCsvConflicts, CsvRow } from '../services/conflictService';

// Mock the database dependency
const mockPrepare = vi.fn();
vi.mock('../config/database', () => ({
  default: {
    prepare: (query: string) => mockPrepare(query),
  },
}));

describe('Conflict Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Brand New Inserts
  it('should route completely new IDs to validInserts', () => {
    // Mock DB returning no existing records for IDs [1, 2]
    mockPrepare.mockReturnValueOnce({
      all: vi.fn().mockReturnValue([]),
    });

    const incoming: CsvRow[] = [
      { id: '1', postId: '10', name: 'Alice', email: 'alice@test.com', body: 'Hello' },
      { id: '2', postId: '10', name: 'Bob', email: 'bob@test.com', body: 'World' },
    ];

    const result = analyzeCsvConflicts(incoming);

    expect(result.validInserts.length).toBe(2);
    expect(result.conflicts.length).toBe(0);
    expect(result.identicalRecords.length).toBe(0);
  });

  // Identical Records
  it('should route matching records to identicalRecords', () => {
    const existingDbRecord = { id: 1, postId: 10, name: 'Alice', email: 'alice@test.com', body: 'Hello' };
    
    mockPrepare.mockReturnValueOnce({
      all: vi.fn().mockReturnValue([existingDbRecord]),
    });

    const incoming: CsvRow[] = [
      { id: '1', postId: '10', name: 'Alice', email: 'alice@test.com', body: 'Hello' },
    ];

    const result = analyzeCsvConflicts(incoming);

    expect(result.validInserts.length).toBe(0);
    expect(result.conflicts.length).toBe(0);
    expect(result.identicalRecords.length).toBe(1);
  });

  // Conflicting Records with Precise Diffs
  it('should flag conflicts and generate exact field diffs when values differ', () => {
    const existingDbRecord = { id: 1, postId: 10, name: 'Alice', email: 'alice@test.com', body: 'Hello' };
    
    mockPrepare.mockReturnValueOnce({
      all: vi.fn().mockReturnValue([existingDbRecord]),
    });

    const incoming: CsvRow[] = [
      { id: '1', postId: '10', name: 'Alice Updated', email: 'alice.new@test.com', body: 'Hello' },
    ];

    const result = analyzeCsvConflicts(incoming);

    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].id).toBe(1);
    expect(result.conflicts[0].diffs).toEqual([
      { field: 'name', oldValue: 'Alice', newValue: 'Alice Updated' },
      { field: 'email', oldValue: 'alice@test.com', newValue: 'alice.new@test.com' },
    ]);
  });
});