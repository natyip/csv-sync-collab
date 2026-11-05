import { Readable } from 'stream';
import csv from 'csv-parser';
import db from '../config/database';
import { analyzeCsvConflicts } from './conflictService';
import { getIo } from '../sockets/socketHandler';
import { broadcastConflictDetected, broadcastDataUpdated } from '../sockets/eventEmitter';

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

export const processCsvBuffer = async (buffer: Buffer): Promise<{ successCount: number; conflictsCount: number; errors: string[] }> => {
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
      .on('end', () => {try {
          if (results.length === 0 && errors.length > 0) {
            return resolve({ successCount: 0, conflictsCount: 0, errors });
          }
          // 1. Run Conflict Analysis against existing database records
          const { conflicts, validInserts, identicalRecords } = analyzeCsvConflicts(results);

          // 2. Use a SQLite transaction for safe, high-performance batch insertion of non-conflicting rows
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

          // Save valid new inserts and identical updates immediately
          insertMany([...validInserts, ...identicalRecords]);
          // if above is successful then broadcast DATA_UPDATED
          if (validInserts.length > 0 || identicalRecords.length > 0) {
            broadcastDataUpdated(`Successfully imported ${validInserts.length + identicalRecords.length} records from CSV.`);
          }
          
          // 3. Emit Socket.IO event if any conflicts are detected
          if (conflicts.length > 0) {
            try {
              broadcastConflictDetected(conflicts);
            } catch (socketErr) {
              console.warn('Socket.IO not initialized or failed to emit:', socketErr);
            }
          }

          resolve({
            successCount: validInserts.length + identicalRecords.length,
            conflictsCount: conflicts.length,
            errors,
          });
        } catch (dbError: any) {
          reject(dbError);
        }
      });
  });
};