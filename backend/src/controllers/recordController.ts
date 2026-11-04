import { Request, Response } from 'express';
import db from '../config/database';

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