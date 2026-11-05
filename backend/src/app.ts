import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import recordRoutes from './routes/recordRoutes';

const app: Application = express();


// Middleware
app.use(cors());
app.use(express.json());
// Mount routes under /api
app.use('/api', recordRoutes);

export default app;