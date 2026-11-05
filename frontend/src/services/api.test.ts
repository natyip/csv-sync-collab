import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRecord, resolveConflicts, uploadCsv } from './api';
import type { ResolutionItem, UploadCsvSuccess } from '../types';

describe('API Service Integration Tests', () => {
  beforeEach(() => {
    // Reset global fetch mock before each test
    vi.restoreAllMocks();
  });

  describe('fetchRecord', () => {
    it('should successfully fetch paginated records with a search query', async () => {
      const mockApiResponse = {
        success: true,
        data: [
          { id: 1, postId: 101, name: 'John Doe', email: 'john@example.com', body: 'Test body' },
        ],
        pagination: {
          totalRecords: 1,
          totalPages: 1,
          currentPage: 1,
          limit: 10,
        },
      };

      // Mock global fetch response
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockApiResponse,
        })
      );

      const result = await fetchRecord(1, 10, 'John');

      // Verify URL construction and query parameters
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/records?page=1&limit=10&search=John'
      );
      expect(result).toEqual(mockApiResponse);
    });

    it('should handle fetch errors gracefully', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          statusText: 'Not Found',
        })
      );

      await expect(fetchRecord(1, 10)).rejects.toThrow('Error fetching records: Not Found');
    });
  });

  describe('resolveConflicts', () => {
    it('should successfully submit conflict resolutions via POST', async () => {
      const mockResolutionResponse = {
        success: true,
        message: 'Conflicts resolved successfully',
        stats: {
          overwritten: 0,
          kept: 1,
        },
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockResolutionResponse,
        })
      );

      const resolutions: ResolutionItem[] = [
        {
          id: 1,
          action: 'KEEP',
        },
      ];

      const result = await resolveConflicts(resolutions);

      // Verify POST request payload and headers
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/resolve',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resolutions }),
        })
      );
      expect(result).toEqual(mockResolutionResponse);
    });

    it('should handle resolution submission failures', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          statusText: 'Bad Request',
        })
      );

      const resolutions: ResolutionItem[] = [{ id: 1, action: 'OVERWRITE' }];

      await expect(resolveConflicts(resolutions)).rejects.toThrow(
        'Error resolving conflicts: Bad Request'
      );
    });
  });
});

describe('uploadCsv', () => {
    it('should successfully send a CSV file via FormData and return ConflictResponse', async () => {
      const mockUploadResponse: UploadCsvSuccess = {
        success: true,
        message: 'Successfully processed 1 records.',
        errors: 0,
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockUploadResponse,
        })
      );

      const fakeFile = new File(['id,name,email\n1,Test,test@example.com'], 'test.csv', {
        type: 'text/csv',
      });

      const result = await uploadCsv(fakeFile);
      console.log("result", result);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockUploadResponse);
    });

    it('should handle upload errors gracefully', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          statusText: 'Internal Server Error',
        })
      );

      const fakeFile = new File(['bad data'], 'bad.csv', { type: 'text/csv' });

      await expect(uploadCsv(fakeFile)).rejects.toThrow(
        'Error uploading CSV file: Internal Server Error'
      );
    });
  });