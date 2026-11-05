import { Request, Response } from 'express';
import db from '../config/database';
import { processCsvBuffer } from '../services/csvService';
import { broadcastDataUpdated } from '../sockets/eventEmitter';

export const getRecords = (req: Request, res: Response): void => {
  try {
    // 1. Extract query parameters with default fallbacks
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM records';
    let countQuery = 'SELECT COUNT(*) as total FROM records';
    let queryParams: any[] = [];
    let countParams: any[] = [];

    // 2. Add search condition if search query exists
    if (search.trim() !== '') {
      const searchPattern = `%${search}%`;
      const searchCondition = ' WHERE name LIKE ? OR email LIKE ? OR body LIKE ?';
      query += searchCondition;
      countQuery += searchCondition;
      queryParams = [searchPattern, searchPattern, searchPattern];
      countParams = [searchPattern, searchPattern, searchPattern];
    }

    // 3. Add pagination clauses
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // 4. Execute queries against SQLite
    const stmt = db.prepare(query);
    const records = stmt.all(...queryParams);

    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...countParams) as { total: number };
    const totalRecords = countResult.total;

    // 5. Return structured response with pagination metadata
    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('Error fetching records:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const uploadCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ success: false, error: 'No CSV file uploaded.' });
      return;
    }

    // Process the uploaded file buffer
    const { successCount, errors } = await processCsvBuffer(file.buffer);

    res.status(200).json({
      success: true,
      message: `Successfully processed ${successCount} records.`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error processing CSV upload:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

interface ResolutionItem {
  id: number;
  action: 'KEEP' | 'OVERWRITE';
  incomingData?: {
    postId: number | string;
    name: string;
    email: string;
    body: string;
  };
}

export const resolveConflicts = async (req: Request, res: Response) => {
  try {
    const { resolutions }: { resolutions: ResolutionItem[] } = req.body;

    if (!Array.isArray(resolutions) || resolutions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or empty resolutions payload provided.',
      });
    }

    // Prepare the SQLite update statement for items marked as OVERWRITE
    const updateStmt = db.prepare(`
      UPDATE records 
      SET postId = @postId, name = @name, email = @email, body = @body
      WHERE id = @id
    `);

    let overwriteCount = 0;
    let keepCount = 0;

    // Wrap resolutions in an atomic transaction
    const resolveTransaction = db.transaction((items: ResolutionItem[]) => {
      for (const item of items) {
        if (item.action === 'OVERWRITE' && item.incomingData) {
          updateStmt.run({
            id: Number(item.id),
            postId: Number(item.incomingData.postId),
            name: String(item.incomingData.name).trim(),
            email: String(item.incomingData.email).trim(),
            body: String(item.incomingData.body).trim(),
          });
          overwriteCount++;
        } else if (item.action === 'KEEP') {
          // Explicitly keeping existing DB record; no DB mutation needed
          keepCount++;
        }
      }
    });

    resolveTransaction(resolutions);

    // Broadcast DATA_UPDATED so all connected clients sync their data tables instantly
    broadcastDataUpdated(`Conflict resolution completed: ${overwriteCount} overwritten, ${keepCount} kept.`);

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${resolutions.length} conflict resolutions.`,
      stats: {
        overwritten: overwriteCount,
        kept: keepCount,
      },
    });
  } catch (error: any) {
    console.error('Error processing conflict resolution:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process conflict resolutions.',
      error: error.message,
    });
  }
};