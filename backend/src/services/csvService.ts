import { Readable } from 'stream';
import csv from 'csv-parser';
import db from '../config/database';

// Define the exact required schema headers
const EXPECTED_HEADERS = ['postId', 'id', 'name', 'email', 'body'];

interface CsvRow {
  postId: string;
  id: string;
  name: string;
  email: string;
  body: string;
  [key: string]: any;
}

export const processCsvBuffer = async (buffer: Buffer): Promise<{ successCount: number; errors: string[] }> => {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    const errors: string[] = [];
    let rowNumber = 0;
    let headersValidated = false;

    const stream = Readable.from(buffer);

    stream.
      pipe(csv({
        // Strip BOM, surrounding quotes, and whitespace from every incoming header
        mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '').trim()
      }))
      .on('headers', (rawHeaders: string[]) => {
        // Clean all incoming headers to strip BOM characters, quotes, and whitespace
        const headers = rawHeaders.map(h => h.replace(/^\uFEFF/, '').replace(/["']/g, '').trim());
        // Validate that all expected headers are present and no extra headers exist
        const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
        const extraHeaders = headers.filter(h => !EXPECTED_HEADERS.includes(h));

        if (missingHeaders.length > 0 || extraHeaders.length > 0) {
          const errorMessage = `Invalid CSV headers. Missing: [${missingHeaders.join(', ')}]. Extra: [${extraHeaders.join(', ')}]. Expected exact schema: [${EXPECTED_HEADERS.join(', ')}].`;
          reject(new Error(errorMessage));
          stream.destroy(); // Halt the stream immediately
        } else {
          headersValidated = true;
        }
      })
      .on('data', (data) => {
        if (!headersValidated) return;
        rowNumber++;
        // DEBUG: See what keys and values are actually arriving
        console.log(`Row ${rowNumber} raw data:`, data);

        // Validate that all fields are mandatory and non-empty for every row
        const missingFields = EXPECTED_HEADERS.filter(field => {
          const value = data[field];
          return value === undefined || value === null || String(value).trim() === '';
        });

        if (missingFields.length > 0) {
          errors.push(`Row ${rowNumber}: Missing or empty mandatory fields: [${missingFields.join(', ')}].`);
        } else {
          results.push(data as CsvRow);
        }
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        try {
          // If no valid rows passed validation and there were parsing errors, you can choose to handle it
          if (results.length === 0 && errors.length > 0) {
            return resolve({ successCount: 0, errors });
          }

          // Use a SQLite transaction for safe, high-performance batch insertion
          const insertStmt = db.prepare(`
            INSERT INTO records (id, postId, name, email, body)
            VALUES (@id, @postId, @name, @email, @body)
            ON CONFLICT(id) DO UPDATE SET
              postId = excluded.postId,
              name = excluded.name,
              email = excluded.email,
              body = excluded.body
          `);

          const insertMany = db.transaction((rows: CsvRow[]) => {
            for (const row of rows) {
              insertStmt.run({
                id: Number(row.id),
                postId: Number(row.postId),
                name: row.name.trim(),
                email: row.email.trim(),
                body: row.body.trim(),
              });
            }
          });

          insertMany(results);
          resolve({ successCount: results.length, errors });
        } catch (dbError: any) {
          reject(dbError);
        }
      });
  });
};