import db from '../config/database';

export interface CsvRow {
  postId: string;
  id: string;
  name: string;
  email: string;
  body: string;
  [key: string]: any;
}

export interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface ConflictItem {
  id: number;
  existing: CsvRow;
  incoming: CsvRow;
  diffs: FieldDiff[];
}

export const analyzeCsvConflicts = (incomingRows: CsvRow[]) => {
  const conflicts: ConflictItem[] = [];
  const validInserts: CsvRow[] = [];
  const identicalRecords: CsvRow[] = [];

  // 1. Extract all incoming IDs
  const incomingIds = incomingRows.map(row => Number(row.id));
  if (incomingIds.length === 0) return { conflicts, validInserts, identicalRecords };

  // 2. Fetch existing records from SQLite matching these IDs in a single query
  const placeholders = incomingIds.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM records WHERE id IN (${placeholders})`);
  const existingRecords = stmt.all(...incomingIds) as any[];

  // Create a map for fast O(1) lookup
  const existingMap = new Map<number, any>();
  existingRecords.forEach(record => existingMap.set(record.id, record));

  // 3. Compare each incoming row against existing database records
  for (const row of incomingRows) {
    const rowId = Number(row.id);
    const existing = existingMap.get(rowId);

    if (!existing) {
      // ID does not exist in DB -> Safe new insert
      validInserts.push(row);
    } else {
      // ID exists -> Check for field differences
      const diffs: FieldDiff[] = [];
      const fieldsToCompare = ['postId', 'name', 'email', 'body'];

      for (const field of fieldsToCompare) {
        const dbVal = String(existing[field]).trim();
        const csvVal = String(row[field]).trim();

        if (dbVal !== csvVal) {
          diffs.push({
            field,
            oldValue: existing[field],
            newValue: row[field],
          });
        }
      }

      if (diffs.length > 0) {
        // Has differences -> Flag as conflict
        conflicts.push({
          id: rowId,
          existing,
          incoming: row,
          diffs,
        });
      } else {
        // Identical values -> No-op or auto-accept
        identicalRecords.push(row);
      }
    }
  }

  return { conflicts, validInserts, identicalRecords };
};