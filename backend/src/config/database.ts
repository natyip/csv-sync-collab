import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Export a factory/init function that accepts an optional path for testing
export const createDatabaseConnection = (customDbPath?: string) => {
  const dataDir = path.dirname(customDbPath || path.resolve(__dirname, '../../data/database.sqlite'));
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = customDbPath || path.join(dataDir, 'database.sqlite');
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  return db;
};

// Default global instance for app usage
const db = createDatabaseConnection();

export const initDatabase = (databaseInstance = db) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY,
      postId INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      body TEXT NOT NULL
    );
  `;
  databaseInstance.exec(createTableQuery);
  console.log('Database initialized and "records" table ready.');
};

export default db;