import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecords } from '../controllers/recordController';
import { Request, Response } from 'express';
import { resolveConflicts } from '../controllers/recordController';

// Mock the database module
const mockPrepare = vi.fn();
const mockTransaction = vi.fn((callback) => (items: any) => callback(items));
vi.mock('../config/database', () => ({
  default: {
    prepare: (query: string) => mockPrepare(query),
    transaction: (callback: Function) => mockTransaction(callback),
  },
}));

describe('Paginated Listing & Search Controller (GET /api/records)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    res = {
      status: statusSpy,
      json: jsonSpy,
    };
  });

  // Test Case 5: Default Pagination Retrieval (Happy Path)
  it('should return default paginated records when no query parameters are provided', () => {
    req = { query: {} };

    const mockRecords = [{ id: 1, name: 'Test Record' }];
    const mockCount = { total: 1 };

    mockPrepare.mockReturnValueOnce({
      all: vi.fn().mockReturnValue(mockRecords),
    }).mockReturnValueOnce({
      get: vi.fn().mockReturnValue(mockCount),
    });

    getRecords(req as Request, res as Response);

    expect(statusSpy).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: mockRecords,
        pagination: expect.objectContaining({
          currentPage: 1,
          limit: 10,
          totalRecords: 1,
          totalPages: 1,
        }),
      })
    );
  });

  // Test Case 6: Custom Page and Limit Boundaries (Edge Case)
  it('should correctly calculate offset and apply custom limit and page', () => {
    req = { query: { page: '2', limit: '5' } };

    const mockRecords: any[] = [];
    const mockCount = { total: 12 };

    const allSpy = vi.fn().mockReturnValue(mockRecords);
    const getSpy = vi.fn().mockReturnValue(mockCount);

    mockPrepare.mockReturnValueOnce({ all: allSpy }).mockReturnValueOnce({ get: getSpy });

    getRecords(req as Request, res as Response);

    // Verify limit (5) and offset ((2-1)*5 = 5) were passed to statement `.all(...)`
    expect(allSpy).toHaveBeenCalledWith(5, 5);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: expect.objectContaining({
          currentPage: 2,
          limit: 5,
          totalPages: 3,
        }),
      })
    );
  });

  // Test Case: Search Keyword Filtering - Happy Case (Matches Found)
  it('should return matching records when search term finds results', () => {
    req = { query: { search: 'alpha' } };

    const mockRecords = [
      { id: 1, name: 'Alpha Record', email: 'alpha@test.com', body: 'Test body' }
    ];
    const mockCount = { total: 1 };

    const allSpy = vi.fn().mockReturnValue(mockRecords);
    const getSpy = vi.fn().mockReturnValue(mockCount);

    mockPrepare.mockReturnValueOnce({ all: allSpy }).mockReturnValueOnce({ get: getSpy });

    getRecords(req as Request, res as Response);

    // Verify search patterns (%alpha%) were passed correctly with default pagination
    expect(allSpy).toHaveBeenCalledWith('%alpha%', '%alpha%', '%alpha%', 10, 0);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: mockRecords,
        pagination: expect.objectContaining({
          totalRecords: 1,
          currentPage: 1,
          limit: 10,
          totalPages: 1,
        }),
      })
    );
  });
  
  // Test Case 7 & 8: Search Keyword Filtering & Zero Results (Happy/Edge Cases)
  it('should include search filters in queries when search term is provided', () => {
    req = { query: { search: 'alpha' } };

    const allSpy = vi.fn().mockReturnValue([]);
    const getSpy = vi.fn().mockReturnValue({ total: 0 });

    mockPrepare.mockReturnValueOnce({ all: allSpy }).mockReturnValueOnce({ get: getSpy });

    getRecords(req as Request, res as Response);

    // Verify SQL query preparation received search patterns (%alpha%)
    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('WHERE name LIKE ?'));
    expect(allSpy).toHaveBeenCalledWith('%alpha%', '%alpha%', '%alpha%', 10, 0);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [],
        pagination: expect.objectContaining({ totalRecords: 0 }),
      })
    );
  });
});


describe('Conflict Resolution Controller (POST /api/resolve)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
    res = {
      status: statusSpy,
      json: jsonSpy,
    };
  });

  it('should return 400 if resolutions payload is missing or empty', async () => {
    req = { body: { resolutions: [] } };

    await resolveConflicts(req as Request, res as Response);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('should successfully process OVERWRITE actions and execute database updates', async () => {
    req = {
      body: {
        resolutions: [
          {
            id: 1,
            action: 'OVERWRITE',
            incomingData: { postId: 10, name: 'New Name', email: 'new@test.com', body: 'New Body' },
          },
          {
            id: 2,
            action: 'KEEP',
          },
        ],
      },
    };

    const runSpy = vi.fn();
    mockPrepare.mockReturnValue({ run: runSpy });

    await resolveConflicts(req as Request, res as Response);

    expect(statusSpy).toHaveBeenCalledWith(200);
    expect(runSpy).toHaveBeenCalledTimes(1); // Only OVERWRITE runs an update statement
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        stats: { overwritten: 1, kept: 1 },
      })
    );
  });
});