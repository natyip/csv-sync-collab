import { describe, it, expect, vi } from 'vitest';
import { processCsvBuffer } from '../services/csvService';

// Mock the database dependency so unit tests isolate the CSV parsing logic
vi.mock('../config/database', () => ({
  default: {
    prepare: vi.fn(() => ({
      all: vi.fn(() => []), // Added .all() returning empty array for conflict analysis lookup
      run: vi.fn(),
    })),
    transaction: vi.fn((fn) => (rows: any[]) => fn(rows)),
  },
}));

describe('CSV Parsing & Strict Validation Service', () => {
  
  // Test Case 1: Valid CSV Upload (Happy Path)
  it('should successfully parse and validate a correct CSV buffer', async () => {
    const validCsv = 'postId,id,name,email,body\n1,1,Alice,alice@test.com,Hello world';
    const buffer = Buffer.from(validCsv);

    const result = await processCsvBuffer(buffer);

    expect(result.successCount).toBe(1);
    expect(result.errors).toEqual([]);
  });

  // Test Case 2: Invalid Headers - Missing Required Header (Edge Case)
  it('should reject CSV when a required header is missing', async () => {
    const invalidCsv = 'postId,id,name,body\n1,1,Alice,Hello world'; // missing 'email'
    const buffer = Buffer.from(invalidCsv);

    // await expect(processCsvBuffer(buffer)).rejects.toThrow(/Invalid CSV headers/i);
    await expect(processCsvBuffer(buffer)).rejects.toThrow(
      'Invalid CSV headers. Missing: [email]. Extra: []. Expected exact schema: [postId, id, name, email, body].'
    );
  });

  // Test Case 3: Invalid Headers - Extra Unexpected Header (Edge Case)
  it('should reject CSV when an unexpected extra header is present', async () => {
    const invalidCsv = 'postId,id,name,email,body,phone\n1,1,Alice,alice@test.com,Hello,12345';
    const buffer = Buffer.from(invalidCsv);

    // await expect(processCsvBuffer(buffer)).rejects.toThrow(/Invalid CSV headers/i);
    await expect(processCsvBuffer(buffer)).rejects.toThrow(
      'Invalid CSV headers. Missing: []. Extra: [phone]. Expected exact schema: [postId, id, name, email, body].'
    );
  });

  // Test Case 4: Row-Level Missing Mandatory Field (Edge Case)
  it('should skip rows with missing mandatory fields and log row errors', async () => {
    const csvWithEmptyField = 'postId,id,name,email,body\n1,1,,alice@test.com,Hello world'; // name is blank
    const buffer = Buffer.from(csvWithEmptyField);

    const result = await processCsvBuffer(buffer);

    expect(result.successCount).toBe(0);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBe(1);
    expect(result.errors?.[0]).toContain('Row 1');
  });
});