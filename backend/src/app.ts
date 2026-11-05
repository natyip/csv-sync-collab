import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { getRecords, uploadCsv } from './controllers/recordController';

const app: Application = express();

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

// Middleware
app.use(cors());
app.use(express.json());

// Basic health-check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running successfully' });
});

// Records listing and search route
app.get('/api/records', getRecords);

// CSV Upload route (handles single file upload with field name "file")
app.post('/api/upload', upload.single('file'), uploadCsv);

export default app;