import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { getRecords } from './controllers/recordController';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health-check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running successfully' });
});

// Records listing and search route
app.get('/api/records', getRecords);

export default app;