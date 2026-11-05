import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import router from '../routes/recordRoutes';

// Mock the controllers to isolate route testing
vi.mock('../controllers/recordController', () => ({
  getRecords: (req: any, res: any) => res.status(200).json({ success: true, data: [] }),
  uploadCsv: (req: any, res: any) => res.status(200).json({ success: true, message: 'Uploaded' }),
  resolveConflicts: (req: any, res: any) => res.status(200).json({ success: true, message: 'Resolved' }),
}));

// Setup a clean Express app instance mounting the router
const app = express();
app.use(express.json());
app.use(router);

describe('Record Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Health Check Endpoint
  it('GET /api/health should return 200 status and ok message', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      message: 'Backend is running successfully',
    });
  });

  // Records Listing Endpoint
  it('GET /api/records should invoke getRecords controller', async () => {
    const response = await request(app).get('/api/records');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // Multer File Filter Validation (Reject non-CSV)
  it('POST /api/upload should reject non-CSV files via multer fileFilter', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('invalid data'), {
        filename: 'malicious.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(500); // Express default error handler catching multer Error
    expect(response.text).toContain('Invalid file type');
  });

  // // Conflict Resolution Endpoint
  // it('POST /api/resolve should invoke resolveConflicts controller', async () => {
  //   const response = await request(app)
  //     .post('/api/resolve')
  //     .send({
  //       resolutions: [{ id: 1, action: 'KEEP' }],
  //     });

  //   expect(response.status).toBe(200);
  //   expect(response.body.success).toBe(true);
  //   expect(response.body.message).toBe('Resolved');
  // });
});