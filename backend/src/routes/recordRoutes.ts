import { Router } from 'express';
import { getRecords, resolveConflicts, uploadCsv } from '../controllers/recordController';
import { Request, Response } from 'express';

import multer from 'multer';
const router = Router();

// Configures multer with memory storage and strict .csv file filtering
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isCsvExtension = file.originalname.toLowerCase().endsWith('.csv');
    const isCsvMime = 
      file.mimetype === 'text/csv' || 
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/plain';

    if (isCsvExtension && isCsvMime) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .csv files are allowed.'));
    }
  },
});

// Basic health-check route
router.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running successfully' });
});

// Records listing and search route
router.get('/api/records', getRecords);

// CSV Upload route (handles single file upload with field name "file")
router.post('/api/upload', upload.single('file'), uploadCsv);

// New conflict resolution endpoint
// router.post('/resolve', resolveConflicts);

export default router;